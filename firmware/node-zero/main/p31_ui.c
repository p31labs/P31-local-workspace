#include "p31_ui.h"
#include "config.h"
#include "esp_log.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

static const char *TAG = "p31_ui";

// ── Widget handles (accessed only from LVGL task) ─────────────────────────────
static lv_obj_t *s_screen      = NULL;
static lv_obj_t *s_title_label = NULL;
static lv_obj_t *s_status_label= NULL;
static lv_obj_t *s_spoon_arc   = NULL;
static lv_obj_t *s_spoon_label = NULL;
static lv_obj_t *s_lora_dot    = NULL;
static lv_obj_t *s_rssi_bar    = NULL;
static lv_obj_t *s_rssi_label  = NULL;
static lv_obj_t *s_mesh_label  = NULL;

// ── Async update payloads ─────────────────────────────────────────────────────
typedef struct { lora_state_t state; int16_t rssi; } lora_update_t;
typedef struct { uint8_t pct; }                       spoon_update_t;
typedef struct { char msg[36]; }                      status_update_t;

static void _async_lora(void *p) {
    lora_update_t *u = (lora_update_t *)p;

    // Dot color: green=RX/idle, yellow=TX, red=error
    lv_color_t c = (u->state == LORA_STATE_RX)  ? lv_color_hex(0x00E676) :
                   (u->state == LORA_STATE_TX)  ? lv_color_hex(0xFFD600) :
                                                   lv_color_hex(0xFF1744);
    lv_obj_set_style_bg_color(s_lora_dot, c, 0);

    // RSSI bar: map -120..-20 dBm → 0..100
    int val = (int)(u->rssi) + 120;
    if (val < 0) val = 0;
    if (val > 100) val = 100;
    lv_bar_set_value(s_rssi_bar, val, LV_ANIM_ON);

    char rssi_str[16];
    snprintf(rssi_str, sizeof(rssi_str), "%d dBm", u->rssi);
    lv_label_set_text(s_rssi_label, rssi_str);

    free(u);
}

static void _async_spoon(void *p) {
    spoon_update_t *u = (spoon_update_t *)p;
    lv_arc_set_value(s_spoon_arc, u->pct);
    char buf[8];
    snprintf(buf, sizeof(buf), "%d%%", u->pct);
    lv_label_set_text(s_spoon_label, buf);
    free(u);
}

static void _async_status(void *p) {
    status_update_t *u = (status_update_t *)p;
    lv_label_set_text(s_status_label, u->msg);
    free(u);
}

// ── Build the single-screen layout (320 × 480 logical portrait) ───────────────
void p31_ui_init(lv_disp_t *disp) {
    // Logical resolution after sw_rotate 90°: width=V_RES=320, height=H_RES=480
    const lv_coord_t W = DISPLAY_V_RES;  // 320
    const lv_coord_t H = DISPLAY_H_RES;  // 480

    lv_disp_set_default(disp);
    s_screen = lv_scr_act();
    lv_obj_set_style_bg_color(s_screen, lv_color_hex(0x0A0A0F), 0);  // deep navy-black

    // ── Header bar ────────────────────────────────────────────────────────────
    lv_obj_t *header = lv_obj_create(s_screen);
    lv_obj_set_size(header, W, 44);
    lv_obj_align(header, LV_ALIGN_TOP_MID, 0, 0);
    lv_obj_set_style_bg_color(header, lv_color_hex(0x0D1117), 0);
    lv_obj_set_style_border_width(header, 0, 0);
    lv_obj_set_style_radius(header, 0, 0);
    lv_obj_set_style_pad_all(header, 0, 0);

    s_title_label = lv_label_create(header);
    lv_label_set_text(s_title_label, "P31  NODE ZERO");
    lv_obj_set_style_text_color(s_title_label, lv_color_hex(0x58A6FF), 0);
    lv_obj_set_style_text_font(s_title_label, &lv_font_montserrat_16, 0);
    lv_obj_align(s_title_label, LV_ALIGN_LEFT_MID, 10, 0);

    // LoRa status dot (top right)
    s_lora_dot = lv_obj_create(header);
    lv_obj_set_size(s_lora_dot, 12, 12);
    lv_obj_align(s_lora_dot, LV_ALIGN_RIGHT_MID, -12, 0);
    lv_obj_set_style_radius(s_lora_dot, LV_RADIUS_CIRCLE, 0);
    lv_obj_set_style_bg_color(s_lora_dot, lv_color_hex(0x444444), 0);
    lv_obj_set_style_border_width(s_lora_dot, 0, 0);

    // ── Spoon arc (energy/cognition gauge) ────────────────────────────────────
    // Arc center: x=160, y=200
    s_spoon_arc = lv_arc_create(s_screen);
    lv_obj_set_size(s_spoon_arc, 220, 220);
    lv_obj_align(s_spoon_arc, LV_ALIGN_TOP_MID, 0, 60);
    lv_arc_set_range(s_spoon_arc, 0, 100);
    lv_arc_set_value(s_spoon_arc, 80);
    lv_arc_set_bg_angles(s_spoon_arc, 135, 45);
    lv_arc_set_angles(s_spoon_arc, 135, 135 + (int)(0.8f * 270));
    lv_obj_set_style_arc_color(s_spoon_arc, lv_color_hex(0x1A1A2E), LV_PART_MAIN);
    lv_obj_set_style_arc_width(s_spoon_arc, 20, LV_PART_MAIN);
    lv_obj_set_style_arc_color(s_spoon_arc, lv_color_hex(0x00E5FF), LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(s_spoon_arc, 20, LV_PART_INDICATOR);
    lv_obj_clear_flag(s_spoon_arc, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_set_style_bg_opa(s_spoon_arc, LV_OPA_TRANSP, 0);

    // Label inside arc: percentage
    s_spoon_label = lv_label_create(s_screen);
    lv_label_set_text(s_spoon_label, "80%");
    lv_obj_set_style_text_font(s_spoon_label, &lv_font_montserrat_32, 0);
    lv_obj_set_style_text_color(s_spoon_label, lv_color_hex(0xEAEAEA), 0);
    lv_obj_align_to(s_spoon_label, s_spoon_arc, LV_ALIGN_CENTER, 0, -10);

    lv_obj_t *spoon_lbl2 = lv_label_create(s_screen);
    lv_label_set_text(spoon_lbl2, "SPOONS");
    lv_obj_set_style_text_font(spoon_lbl2, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(spoon_lbl2, lv_color_hex(0x666688), 0);
    lv_obj_align_to(spoon_lbl2, s_spoon_arc, LV_ALIGN_CENTER, 0, 16);

    // ── Mesh status label ─────────────────────────────────────────────────────
    s_mesh_label = lv_label_create(s_screen);
    lv_label_set_text(s_mesh_label, "MESH  --");
    lv_obj_set_style_text_font(s_mesh_label, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(s_mesh_label, lv_color_hex(0x888899), 0);
    lv_obj_align(s_mesh_label, LV_ALIGN_TOP_MID, 0, 295);

    // ── RSSI bar ──────────────────────────────────────────────────────────────
    lv_obj_t *rssi_title = lv_label_create(s_screen);
    lv_label_set_text(rssi_title, "LoRa RSSI");
    lv_obj_set_style_text_font(rssi_title, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(rssi_title, lv_color_hex(0x666688), 0);
    lv_obj_align(rssi_title, LV_ALIGN_TOP_LEFT, 16, 330);

    s_rssi_label = lv_label_create(s_screen);
    lv_label_set_text(s_rssi_label, "-- dBm");
    lv_obj_set_style_text_font(s_rssi_label, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(s_rssi_label, lv_color_hex(0x00E5FF), 0);
    lv_obj_align(s_rssi_label, LV_ALIGN_TOP_RIGHT, -16, 330);

    s_rssi_bar = lv_bar_create(s_screen);
    lv_obj_set_size(s_rssi_bar, W - 32, 16);
    lv_obj_align(s_rssi_bar, LV_ALIGN_TOP_MID, 0, 354);
    lv_bar_set_range(s_rssi_bar, 0, 100);
    lv_bar_set_value(s_rssi_bar, 0, LV_ANIM_OFF);
    lv_obj_set_style_bg_color(s_rssi_bar, lv_color_hex(0x1A1A2E), LV_PART_MAIN);
    lv_obj_set_style_radius(s_rssi_bar, 8, LV_PART_MAIN);
    lv_obj_set_style_bg_color(s_rssi_bar, lv_color_hex(0x00E5FF), LV_PART_INDICATOR);
    lv_obj_set_style_radius(s_rssi_bar, 8, LV_PART_INDICATOR);

    // ── Status line (bottom) ──────────────────────────────────────────────────
    s_status_label = lv_label_create(s_screen);
    lv_label_set_text(s_status_label, "initializing...");
    lv_obj_set_style_text_font(s_status_label, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(s_status_label, lv_color_hex(0x444455), 0);
    lv_obj_align(s_status_label, LV_ALIGN_BOTTOM_MID, 0, -10);

    ESP_LOGI(TAG, "UI ready (%dx%d logical)", W, H);
}

// ── Thread-safe update helpers ────────────────────────────────────────────────
void p31_ui_update_lora(lora_state_t state, int16_t rssi) {
    lora_update_t *u = malloc(sizeof(*u));
    if (!u) return;
    u->state = state;
    u->rssi  = rssi;
    lv_async_call(_async_lora, u);
}

void p31_ui_update_spoons(uint8_t pct) {
    spoon_update_t *u = malloc(sizeof(*u));
    if (!u) return;
    u->pct = pct;
    lv_async_call(_async_spoon, u);
}

void p31_ui_update_status(const char *msg) {
    status_update_t *u = malloc(sizeof(*u));
    if (!u) return;
    strncpy(u->msg, msg, sizeof(u->msg) - 1);
    u->msg[sizeof(u->msg) - 1] = '\0';
    lv_async_call(_async_status, u);
}
