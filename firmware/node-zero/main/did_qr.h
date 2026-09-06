#pragma once
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

void did_qr_create(void);
void did_qr_display(void);
void did_qr_remove(void);

#ifdef __cplusplus
}
#endif