/*
 * p31_sync.h — dependency-free CRDT/Lamport delta sync for node-zero (ESP32-S3).
 * Mirror of workers/device-registry/src/schema.ts. No external CRDT lib.
 *
 * Each leaf carries a Lamport timestamp + actor id; higher clock wins, ties
 * broken by actor string. Converges with the Cloudflare device-registry DO.
 */
#ifndef P31_SYNC_H
#define P31_SYNC_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#define P31_MAX_PATH   64
#define P31_MAX_ACTOR  40
#define P31_MAX_FIELDS 48

typedef enum {
    P31_T_NULL = 0,
    P31_T_BOOL,
    P31_T_INT,
    P31_T_FLOAT,
    P31_T_STR
} p31_val_type_t;

typedef struct {
    p31_val_type_t type;
    union {
        bool    b;
        int64_t i;
        double  f;
        char    s[56];
    } u;
} p31_value_t;

typedef struct {
    p31_value_t value;
    uint64_t    ts;                       /* Lamport clock */
    char        actor[P31_MAX_ACTOR];
} p31_ts_val_t;

typedef struct {
    char            device_id[P31_MAX_ACTOR];
    char            actor[P31_MAX_ACTOR];
    uint64_t        lamport;
    p31_ts_val_t    fields[P31_MAX_FIELDS];
    uint8_t         field_count;
    uint64_t        version;
} p31_device_state_t;

/* Initialize an empty state for a device. */
void p31_sync_init(p31_device_state_t *st, const char *device_id, const char *actor);

/* Local mutation: stamps value with (lamport+1) and stores at path. */
void p31_sync_set(p31_device_state_t *st, const char *path, p31_value_t v);

/* Merge an incoming delta (paths[], count) into state. Returns new lamport. */
uint64_t p31_sync_merge(p31_device_state_t *st, const char *src_actor,
                        uint64_t src_lamport,
                        const char *paths[], const p31_ts_val_t vals[], uint8_t count);

/* Serialize state to a JSON SyncDelta string into out (must be >= out_len). */
int p31_sync_serialize(const p31_device_state_t *st, char *out, size_t out_len);

/* Parse a JSON SyncDelta from buf, merge into st. Returns 0 on success. */
int p31_sync_deserialize_merge(p31_device_state_t *st, const char *buf);

uint64_t p31_sync_now_lamport(const p31_device_state_t *st);

#endif /* P31_SYNC_H */
