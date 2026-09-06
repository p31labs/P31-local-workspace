#include "did_qr.h"
#include "mldsa_identity.h"
#include "esp_log.h"
#include "lvgl.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

static const char *TAG = "did_qr";

static lv_obj_t *s_qr_obj = NULL;
static lv_obj_t *s_qr_label = NULL;

void did_qr_create(void) {
    if (s_qr_obj) {
        lv_obj_del(s_qr_obj);
        s_qr_obj = NULL;
    }
    if (s_qr_label) {
        lv_obj_del(s_qr_label);
        s_qr_label = NULL;
    }

    const char *did = mldsa_identity_did_key();
    if (!did || strlen(did) == 0) {
        ESP_LOGW(TAG, "No DID — skipping QR");
        return;
    }

    s_qr_obj = lv_qrcode_create(lv_scr_act(), 100, lv_color_hex(0x00E5FF), lv_color_hex(0x0A0A0F));
    if (!s_qr_obj) {
        ESP_LOGE(TAG, "Failed to create QR widget");
        return;
    }
    lv_obj_align(s_qr_obj, LV_ALIGN_BOTTOM_MID, 0, -36);

    lv_res_t res = lv_qrcode_update(s_qr_obj, did, strlen(did));
    if (res != LV_RES_OK) {
        ESP_LOGW(TAG, "QR encode failed — display blank");
    }

    s_qr_label = lv_label_create(lv_scr_act());
    lv_label_set_text(s_qr_label, mldsa_identity_short_did());
    lv_obj_set_style_text_color(s_qr_label, lv_color_hex(0x666688), 0);
    lv_obj_set_style_text_font(s_qr_label, &lv_font_montserrat_12, 0);
    lv_obj_align_to(s_qr_label, s_qr_obj, LV_ALIGN_OUT_TOP_MID, 0, -2);

    ESP_LOGI(TAG, "QR code displayed for short_did=%s", mldsa_identity_short_did());
}

void did_qr_display(void) {
    did_qr_create();
}

void did_qr_remove(void) {
    if (s_qr_obj) {
        lv_obj_del(s_qr_obj);
        s_qr_obj = NULL;
    }
    if (s_qr_label) {
        lv_obj_del(s_qr_label);
        s_qr_label = NULL;
    }
}