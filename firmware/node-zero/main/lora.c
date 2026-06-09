#include "lora.h"
#include "config.h"
#include "driver/spi_master.h"
#include "driver/gpio.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "esp_log.h"
#include "esp_err.h"
#include <string.h>

static const char *TAG = "lora";

// ── SX1262 command opcodes ─────────────────────────────────────────────────────
#define SX_SET_STANDBY          0x80
#define SX_SET_PACKET_TYPE      0x01
#define SX_SET_RF_FREQUENCY     0x86
#define SX_SET_TX_PARAMS        0x8E
#define SX_SET_MODULATION_PARAMS 0x8B
#define SX_SET_PACKET_PARAMS    0x8C
#define SX_SET_BUFFER_BASE_ADDR 0x8F
#define SX_SET_DIO_IRQ_PARAMS   0x08
#define SX_CLEAR_IRQ_STATUS     0x02
#define SX_GET_IRQ_STATUS       0x12
#define SX_GET_RX_BUF_STATUS    0x13
#define SX_GET_PACKET_STATUS    0x14
#define SX_WRITE_BUFFER         0x0E
#define SX_READ_BUFFER          0x1E
#define SX_SET_RX               0x82
#define SX_SET_TX               0x83
#define SX_GET_STATUS           0xC0
#define SX_SET_REGULATOR_MODE   0x96
#define SX_SET_DIO3_AS_TCXO_CTRL 0x97
#define SX_CALIBRATE_IMAGE      0x98
#define SX_SET_PA_CONFIG        0x95

// ── IRQ masks ─────────────────────────────────────────────────────────────────
#define IRQ_TX_DONE             (1 << 0)
#define IRQ_RX_DONE             (1 << 1)
#define IRQ_CRC_ERR             (1 << 6)

// ── Meshtastic LONG_FAST constants ────────────────────────────────────────────
// 915 MHz: freq_word = round(915e6 * 2^25 / 32e6) = 959,447,040
#define LORA_FREQ_WORD          959447040UL
#define LORA_SF                 0x0B    // SF11
#define LORA_BW                 0x05    // 250 kHz
#define LORA_CR                 0x01    // 4/5
#define LORA_LDRO               0x01    // Low data rate optimize: required at SF≥11 + BW≤250
#define LORA_TX_POWER_DBM       14      // 14 dBm — safe default, Meshtastic default
#define LORA_TX_RAMP            0x04    // 40 µs ramp time
#define LORA_PREAMBLE_LEN       8
#define LORA_MAX_PAYLOAD        255

static spi_device_handle_t s_spi     = NULL;
static volatile lora_state_t s_state = LORA_STATE_IDLE;

// RX ring buffer — single slot, protected by mutex
static uint8_t  s_rx_buf[256];
static size_t   s_rx_len   = 0;
static int16_t  s_rx_rssi  = 0;
static int8_t   s_rx_snr   = 0;
static bool     s_rx_ready = false;
static SemaphoreHandle_t s_rx_mutex = NULL;

// ── SPI helpers ───────────────────────────────────────────────────────────────
static esp_err_t sx_write(const uint8_t *data, size_t len) {
    spi_transaction_t t = {
        .length    = len * 8,
        .tx_buffer = data,
        .rx_buffer = NULL,
    };
    return spi_device_polling_transmit(s_spi, &t);
}

static esp_err_t sx_cmd(uint8_t cmd) {
    return sx_write(&cmd, 1);
}

static esp_err_t sx_write_cmd(uint8_t cmd, const uint8_t *params, size_t plen) {
    uint8_t buf[64];
    buf[0] = cmd;
    memcpy(buf + 1, params, plen);
    return sx_write(buf, 1 + plen);
}

static esp_err_t sx_read_cmd(uint8_t cmd, uint8_t *out, size_t out_len) {
    // SX1262 read: send cmd + NOP byte, then read out_len bytes
    uint8_t tx[2 + out_len];
    uint8_t rx[2 + out_len];
    memset(tx, 0x00, sizeof(tx));
    tx[0] = cmd;
    spi_transaction_t t = {
        .length    = sizeof(tx) * 8,
        .tx_buffer = tx,
        .rx_buffer = rx,
    };
    esp_err_t err = spi_device_polling_transmit(s_spi, &t);
    if (err == ESP_OK) memcpy(out, rx + 2, out_len);
    return err;
}

// ── Wait for BUSY low (max 100ms) ─────────────────────────────────────────────
static esp_err_t sx_wait_busy(void) {
    for (int i = 0; i < 1000; i++) {
        if (!gpio_get_level(LORA_BUSY)) return ESP_OK;
        vTaskDelay(pdMS_TO_TICKS(1));
    }
    return ESP_ERR_TIMEOUT;
}

// ── DIO1 GPIO ISR — fires on TX_DONE / RX_DONE / CRC_ERR ────────────────────
static void IRAM_ATTR dio1_isr(void *arg) {
    // Minimal ISR: set a flag; the LVGL/main task handles packet retrieval
    BaseType_t woken = pdFALSE;
    // We use a task notification to wake the LoRa handler task
    TaskHandle_t *htask = (TaskHandle_t *)arg;
    if (htask && *htask) vTaskNotifyGiveFromISR(*htask, &woken);
    portYIELD_FROM_ISR(woken);
}

static TaskHandle_t s_lora_task_handle = NULL;

// ── LoRa background task: handles IRQ, reads packets, restarts RX ─────────────
static void lora_task(void *arg) {
    while (1) {
        // Wait for DIO1 notification (or poll every 500ms as fallback)
        ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(500));

        sx_wait_busy();

        uint8_t irq_raw[2];
        sx_read_cmd(SX_GET_IRQ_STATUS, irq_raw, 2);
        uint16_t irq = ((uint16_t)irq_raw[0] << 8) | irq_raw[1];

        uint8_t clr[2] = {0xFF, 0xFF};
        sx_write_cmd(SX_CLEAR_IRQ_STATUS, clr, 2);

        if (irq & IRQ_RX_DONE) {
            uint8_t rx_status[2];
            sx_read_cmd(SX_GET_RX_BUF_STATUS, rx_status, 2);
            uint8_t plen   = rx_status[0];
            uint8_t offset = rx_status[1];

            // Read payload
            uint8_t rd_buf[2 + plen];
            uint8_t tx_buf[2 + plen];
            memset(tx_buf, 0, sizeof(tx_buf));
            tx_buf[0] = SX_READ_BUFFER;
            tx_buf[1] = offset;
            spi_transaction_t t = {
                .length    = sizeof(tx_buf) * 8,
                .tx_buffer = tx_buf,
                .rx_buffer = rd_buf,
            };
            spi_device_polling_transmit(s_spi, &t);

            // Packet status: rssi, snr
            uint8_t pkt_status[3];
            sx_read_cmd(SX_GET_PACKET_STATUS, pkt_status, 3);
            int16_t rssi = -(pkt_status[0] >> 1);
            int8_t  snr  = (int8_t)pkt_status[1] / 4;

            if (!(irq & IRQ_CRC_ERR) && plen > 0) {
                xSemaphoreTake(s_rx_mutex, portMAX_DELAY);
                s_rx_len = (plen <= sizeof(s_rx_buf)) ? plen : sizeof(s_rx_buf);
                memcpy(s_rx_buf, rd_buf + 2, s_rx_len);
                s_rx_rssi  = rssi;
                s_rx_snr   = snr;
                s_rx_ready = true;
                xSemaphoreGive(s_rx_mutex);
                ESP_LOGD(TAG, "RX %zu bytes  RSSI=%d SNR=%d", s_rx_len, rssi, snr);
            }
        }

        if (irq & IRQ_TX_DONE) {
            s_state = LORA_STATE_RX;
            ESP_LOGD(TAG, "TX done — back to RX");
        }

        // Restart continuous RX
        uint8_t rx_timeout[3] = {0xFF, 0xFF, 0xFF};
        sx_write_cmd(SX_SET_RX, rx_timeout, 3);
        s_state = LORA_STATE_RX;
    }
}

// ── Public: init ──────────────────────────────────────────────────────────────
esp_err_t lora_init(void) {
    s_rx_mutex = xSemaphoreCreateMutex();
    configASSERT(s_rx_mutex);

    // ── SPI bus (SPI3_HOST = FSPI, GPIO 38-45 — above PSRAM kill zone) ──────
    spi_bus_config_t bus = {
        .mosi_io_num   = LORA_MOSI,
        .miso_io_num   = LORA_MISO,
        .sclk_io_num   = LORA_SCK,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 256 + 4,
    };
    ESP_ERROR_CHECK(spi_bus_initialize(LORA_HOST, &bus, SPI_DMA_CH_AUTO));

    spi_device_interface_config_t dev = {
        .clock_speed_hz = LORA_CLK_HZ,
        .mode           = 0,
        .spics_io_num   = LORA_NSS,
        .queue_size     = 4,
        .flags          = 0,
    };
    ESP_ERROR_CHECK(spi_bus_add_device(LORA_HOST, &dev, &s_spi));

    // ── BUSY pin input, NRST output, DIO1 input+ISR ───────────────────────────
    gpio_config_t io = {
        .pin_bit_mask = (1ULL << LORA_BUSY) | (1ULL << LORA_DIO1),
        .mode         = GPIO_MODE_INPUT,
        .pull_up_en   = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type    = GPIO_INTR_DISABLE,
    };
    gpio_config(&io);
    gpio_config_t out = {
        .pin_bit_mask = (1ULL << LORA_NRST),
        .mode         = GPIO_MODE_OUTPUT,
        .pull_up_en   = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type    = GPIO_INTR_DISABLE,
    };
    gpio_config(&out);

    // ── Hardware reset ────────────────────────────────────────────────────────
    gpio_set_level(LORA_NRST, 0);
    vTaskDelay(pdMS_TO_TICKS(2));
    gpio_set_level(LORA_NRST, 1);
    vTaskDelay(pdMS_TO_TICKS(10));
    ESP_ERROR_CHECK(sx_wait_busy());

    // ── Radio configuration ───────────────────────────────────────────────────

    // Standby (STDBY_RC)
    uint8_t stdby[1] = {0x00};
    sx_write_cmd(SX_SET_STANDBY, stdby, 1);
    sx_wait_busy();

    // Use DCDC regulator (more efficient than LDO)
    uint8_t reg_mode[1] = {0x01};
    sx_write_cmd(SX_SET_REGULATOR_MODE, reg_mode, 1);

    // PA config: SX1262, 22 dBm max, HP output
    uint8_t pa[4] = {0x04, 0x07, 0x00, 0x01};
    sx_write_cmd(SX_SET_PA_CONFIG, pa, 4);

    // Packet type: LoRa
    uint8_t pkt_type[1] = {0x01};
    sx_write_cmd(SX_SET_PACKET_TYPE, pkt_type, 1);
    sx_wait_busy();

    // RF frequency: 915 MHz
    uint8_t freq[4] = {
        (LORA_FREQ_WORD >> 24) & 0xFF,
        (LORA_FREQ_WORD >> 16) & 0xFF,
        (LORA_FREQ_WORD >>  8) & 0xFF,
        (LORA_FREQ_WORD      ) & 0xFF,
    };
    sx_write_cmd(SX_SET_RF_FREQUENCY, freq, 4);

    // TX params: 14 dBm, 40µs ramp
    uint8_t tx_params[2] = {LORA_TX_POWER_DBM, LORA_TX_RAMP};
    sx_write_cmd(SX_SET_TX_PARAMS, tx_params, 2);

    // Modulation: SF11, BW250, CR4/5, LDRO=1
    uint8_t mod[4] = {LORA_SF, LORA_BW, LORA_CR, LORA_LDRO};
    sx_write_cmd(SX_SET_MODULATION_PARAMS, mod, 4);

    // Packet params: preamble=8, explicit header, max payload=255, CRC on, no invertIQ
    uint8_t pkt[6] = {
        0x00, LORA_PREAMBLE_LEN,   // preamble length (uint16 big-endian)
        0x00,                       // explicit header (variable length)
        LORA_MAX_PAYLOAD,           // max payload bytes
        0x01,                       // CRC enabled
        0x00,                       // IQ not inverted
    };
    sx_write_cmd(SX_SET_PACKET_PARAMS, pkt, 6);

    // Buffer base: TX starts at 0, RX at 128
    uint8_t base[2] = {0x00, 0x80};
    sx_write_cmd(SX_SET_BUFFER_BASE_ADDR, base, 2);

    // IRQ: enable TX_DONE + RX_DONE + CRC_ERR on DIO1
    uint16_t irq_mask = IRQ_TX_DONE | IRQ_RX_DONE | IRQ_CRC_ERR;
    uint8_t irq_cfg[8] = {
        (irq_mask >> 8) & 0xFF, irq_mask & 0xFF,  // IRQ mask
        (irq_mask >> 8) & 0xFF, irq_mask & 0xFF,  // DIO1 mask
        0x00, 0x00,                                 // DIO2 (unused)
        0x00, 0x00,                                 // DIO3 (unused)
    };
    sx_write_cmd(SX_SET_DIO_IRQ_PARAMS, irq_cfg, 8);

    // Clear any pending IRQs
    uint8_t clr[2] = {0xFF, 0xFF};
    sx_write_cmd(SX_CLEAR_IRQ_STATUS, clr, 2);

    // ── DIO1 interrupt ────────────────────────────────────────────────────────
    gpio_install_isr_service(0);
    gpio_isr_handler_add(LORA_DIO1, dio1_isr, &s_lora_task_handle);
    gpio_set_intr_type(LORA_DIO1, GPIO_INTR_POSEDGE);

    // ── LoRa background task (CPU0, priority 5) ───────────────────────────────
    xTaskCreate(lora_task, "lora", 4096, NULL, 5, &s_lora_task_handle);

    // ── Start continuous RX ───────────────────────────────────────────────────
    uint8_t rx_timeout[3] = {0xFF, 0xFF, 0xFF};  // continuous mode
    sx_write_cmd(SX_SET_RX, rx_timeout, 3);
    s_state = LORA_STATE_RX;

    ESP_LOGI(TAG, "SX1262 ready — 915 MHz SF11 BW250 CR4/5 LDRO=1 (Meshtastic LONG_FAST)");
    return ESP_OK;
}

// ── Public: transmit ───────────────────────────────────────────────────────────
esp_err_t lora_tx(const uint8_t *buf, size_t len, uint32_t timeout_ms) {
    if (!buf || len == 0 || len > LORA_MAX_PAYLOAD) return ESP_ERR_INVALID_ARG;

    s_state = LORA_STATE_TX;

    // Write payload to TX buffer at offset 0
    uint8_t wr[2 + len];
    wr[0] = SX_WRITE_BUFFER;
    wr[1] = 0x00;
    memcpy(wr + 2, buf, len);
    sx_write(wr, sizeof(wr));

    // Update packet params with actual length
    uint8_t pkt[6] = {0x00, LORA_PREAMBLE_LEN, 0x00, (uint8_t)len, 0x01, 0x00};
    sx_write_cmd(SX_SET_PACKET_PARAMS, pkt, 6);

    // Set TX with timeout
    uint32_t sx_timeout = (timeout_ms * 64) & 0xFFFFFF;  // SX1262: 1 unit = 15.625µs
    uint8_t tx_p[3] = {
        (sx_timeout >> 16) & 0xFF,
        (sx_timeout >>  8) & 0xFF,
        (sx_timeout      ) & 0xFF,
    };
    sx_write_cmd(SX_SET_TX, tx_p, 3);

    // Wait for TX_DONE notification from ISR (via lora_task indirection)
    // Simple polling fallback here; production would use a semaphore
    uint32_t t0 = xTaskGetTickCount();
    while ((xTaskGetTickCount() - t0) < pdMS_TO_TICKS(timeout_ms)) {
        uint8_t irq_raw[2];
        sx_read_cmd(SX_GET_IRQ_STATUS, irq_raw, 2);
        uint16_t irq = ((uint16_t)irq_raw[0] << 8) | irq_raw[1];
        if (irq & IRQ_TX_DONE) {
            uint8_t clr[2] = {0xFF, 0xFF};
            sx_write_cmd(SX_CLEAR_IRQ_STATUS, clr, 2);
            // Return to RX
            uint8_t rx_to[3] = {0xFF, 0xFF, 0xFF};
            sx_write_cmd(SX_SET_RX, rx_to, 3);
            s_state = LORA_STATE_RX;
            return ESP_OK;
        }
        vTaskDelay(pdMS_TO_TICKS(5));
    }

    s_state = LORA_STATE_ERROR;
    return ESP_ERR_TIMEOUT;
}

// ── Public: receive ────────────────────────────────────────────────────────────
size_t lora_rx_get(uint8_t *buf, size_t buf_len, int16_t *rssi_out, int8_t *snr_out) {
    size_t n = 0;
    xSemaphoreTake(s_rx_mutex, portMAX_DELAY);
    if (s_rx_ready) {
        n = (s_rx_len <= buf_len) ? s_rx_len : buf_len;
        memcpy(buf, s_rx_buf, n);
        if (rssi_out) *rssi_out = s_rx_rssi;
        if (snr_out)  *snr_out  = s_rx_snr;
        s_rx_ready = false;
    }
    xSemaphoreGive(s_rx_mutex);
    return n;
}

lora_state_t lora_state(void) { return s_state; }
