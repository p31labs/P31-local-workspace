#pragma once
#include "esp_err.h"
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Shared HTTP helpers for P31 Node Zero.
 * Used by p31_net (spoon telemetry) and p31_care_proof (ledger POST).
 * All functions include retry with exponential backoff (3 attempts).
 */

#define P31_HTTP_TIMEOUT_MS  8000
#define P31_HTTP_MAX_RETRIES 3

/**
 * Accumulate HTTP response data into a dynamically-grown buffer.
 * Pass a resp_t as user_data to esp_http_client_config_t::user_data.
 */
typedef struct {
    char  *buf;
    size_t len;
    size_t cap;
} p31_http_resp_t;

/**
 * HTTP event handler — appends data chunks to a p31_http_resp_t buffer.
 * Install as esp_http_client_config_t::event_handler.
 */
esp_err_t p31_http_evt(esp_http_client_event_t *evt);

/**
 * POST JSON body to url, return JSON response in resp_out/resp_len.
 * Retries up to P31_HTTP_MAX_RETRIES times on failure.
 * Caller must free resp_out when done.
 */
esp_err_t p31_http_post_json(const char *url, const char *body,
                             char **resp_out, size_t *resp_len);

/**
 * GET url, return JSON response in resp_out/resp_len.
 * Retries up to P31_HTTP_MAX_RETRIES times on failure.
 * Caller must free resp_out when done.
 */
esp_err_t p31_http_get_json(const char *url,
                            char **resp_out, size_t *resp_len);

#ifdef __cplusplus
}
#endif