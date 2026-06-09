#ifndef CELLULAR_H
#define CELLULAR_H

#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Initialise the cellular modem (power rails, UART, basic AT handshake).
 * Returns true if modem responds to basic AT commands.
 */
bool cellular_init(void);

/**
 * Shut down the modem (power off).
 */
void cellular_shutdown(void);

/**
 * Get current modem info string.
 * Returns static string; do not free.
 */
const char *cellular_get_info(void);

/**
 * Return signal strength (0–100) or -1 if unavailable.
 */
int cellular_get_rssi(void);

/**
 * Return operator name (static buffer) or "unknown".
 */
const char *cellular_get_operator(void);

#ifdef __cplusplus
}
#endif

#endif /* CELLULAR_H */
