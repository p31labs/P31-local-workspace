#pragma once
#include "esp_err.h"
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char version[16];
    char url[256];
    char sha256[65];
} ota_manifest_t;

esp_err_t ota_fetch_manifest(ota_manifest_t *manifest);

esp_err_t ota_apply_update(const ota_manifest_t *manifest);

bool ota_check_and_update(void);

void ota_task(void *arg);

#ifdef __cplusplus
}
#endif