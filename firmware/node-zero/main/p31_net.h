#pragma once
#include "esp_err.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Fetch or create the device DID from NVS.
// Format: 6 lowercase hex chars (e.g. "a3f09c") — matches p31-did in browser localStorage.
// On first call ever, generates via esp_random() and persists to NVS namespace "p31" key "did".
// Returns pointer to static buffer; valid for the lifetime of the app.
const char *p31_net_did(void);

// POST a spoon-balance event to api.p31ca.org/qfactor/event.
// value: 0–100 (% of daily spoon budget remaining).
// Blocks the calling task; call from a background task, NOT the LVGL task.
esp_err_t p31_net_report_spoons(uint8_t value);

// GET the current Q-score for this device's DID.
// Writes the score (0.0–1.0) to *q_out on success.
// Blocks the calling task.
esp_err_t p31_net_fetch_q(float *q_out);

// Periodic telemetry task entry point — call via xTaskCreate.
// Reports spoon level every 5 minutes and updates UI with fetched Q-score.
void p31_net_task(void *arg);

#ifdef __cplusplus
}
#endif
