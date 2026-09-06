/*
 * p31_sync.c — dependency-free CRDT/Lamport delta sync for node-zero (ESP32-S3).
 * Companion to p31_sync.h. Implements the same merge semantics as
 * workers/device-registry/src/schema.ts (CRDT + Lamport, higher clock wins,
 * ties broken by actor id). No cJSON / no external CRDT dependency.
 */
#include "p31_sync.h"
#include <string.h>
#include <stdio.h>

/* Path storage kept parallel to fields[] (fields don't carry their own key). */
static char s_paths[P31_MAX_FIELDS][P31_MAX_PATH];

void p31_sync_init(p31_device_state_t *st, const char *device_id, const char *actor) {
    memset(st, 0, sizeof(*st));
    strncpy(st->device_id, device_id, P31_MAX_ACTOR - 1);
    strncpy(st->actor, actor, P31_MAX_ACTOR - 1);
    st->lamport = 0;
    st->field_count = 0;
    st->version = 0;
    memset(s_paths, 0, sizeof(s_paths));
}

static int path_index(p31_device_state_t *st, const char *path) {
    for (uint8_t i = 0; i < st->field_count; i++) {
        if (strcmp(s_paths[i], path) == 0) return i;
    }
    return -1;
}

static bool lamport_wins(const p31_ts_val_t *a, const p31_ts_val_t *b) {
    if (a->ts != b->ts) return a->ts > b->ts;
    return strcmp(a->actor, b->actor) > 0;
}

void p31_sync_set(p31_device_state_t *st, const char *path, p31_value_t v) {
    st->lamport += 1;
    int idx = path_index(st, path);
    if (idx < 0) {
        if (st->field_count >= P31_MAX_FIELDS) return; /* overflow guard */
        idx = st->field_count++;
        strncpy(s_paths[idx], path, P31_MAX_PATH - 1);
    }
    st->fields[idx].value = v;
    st->fields[idx].ts = st->lamport;
    strncpy(st->fields[idx].actor, st->actor, P31_MAX_ACTOR - 1);
    if (st->lamport > st->version) st->version = st->lamport;
}

uint64_t p31_sync_merge(p31_device_state_t *st, const char *src_actor,
                        uint64_t src_lamport,
                        const char *paths[], const p31_ts_val_t vals[], uint8_t count) {
    for (uint8_t i = 0; i < count && i < P31_MAX_FIELDS; i++) {
        int idx = path_index(st, paths[i]);
        if (idx < 0) {
            if (st->field_count >= P31_MAX_FIELDS) continue;
            idx = st->field_count++;
            strncpy(s_paths[idx], paths[i], P31_MAX_PATH - 1);
        }
        const p31_ts_val_t *incoming = &vals[i];
        if (idx >= 0) {
            const p31_ts_val_t *current = &st->fields[idx];
            if (current->ts == 0 || lamport_wins(incoming, current)) {
                st->fields[idx] = *incoming;
            }
        }
    }
    st->lamport = (st->lamport > src_lamport) ? st->lamport : src_lamport;
    if (st->lamport > st->version) st->version = st->lamport;
    return st->lamport;
}

uint64_t p31_sync_now_lamport(const p31_device_state_t *st) {
    return st->lamport;
}

/* Minimal JSON emitter — no deps. Escapes are best-effort for our value set. */
int p31_sync_serialize(const p31_device_state_t *st, char *out, size_t out_len) {
    int n = snprintf(out, out_len,
        "{\"deviceId\":\"%s\",\"actor\":\"%s\",\"lamport\":%llu,\"paths\":{",
        st->device_id, st->actor, (unsigned long long)st->lamport);
    if (n < 0) return -1;
    size_t off = (size_t)n;
    for (uint8_t i = 0; i < st->field_count; i++) {
        const p31_ts_val_t *f = &st->fields[i];
        int written = 0;
        if (i > 0) { if (off < out_len) out[off++] = ','; }
        const p31_value_t *v = &f->value;
        char valbuf[80];
        switch (v->type) {
            case P31_T_NULL:  strcpy(valbuf, "null"); break;
            case P31_T_BOOL:  snprintf(valbuf, sizeof valbuf, "%s", v->u.b ? "true" : "false"); break;
            case P31_T_INT:   snprintf(valbuf, sizeof valbuf, "%lld", (long long)v->u.i); break;
            case P31_T_FLOAT: snprintf(valbuf, sizeof valbuf, "%f", v->u.f); break;
            case P31_T_STR:   snprintf(valbuf, sizeof valbuf, "\"%s\"", v->u.s); break;
            default:          strcpy(valbuf, "null");
        }
        written = snprintf(out + off, out_len - off,
            "\"%s\":{\"v\":%s,\"ts\":%llu,\"actor\":\"%s\"}",
            s_paths[i], valbuf, (unsigned long long)f->ts, f->actor);
        if (written < 0) return -1;
        off += (size_t)written;
    }
    int tail = snprintf(out + off, out_len - off, "},\"version\":%llu}", (unsigned long long)st->version);
    if (tail < 0) return -1;
    off += (size_t)tail;
    return (int)off;
}

/*
 * Minimal JSON parser for an inbound SyncDelta. Handles our fixed shape only:
 * {"deviceId":..,"actor":..,"lamport":N,"paths":{ "p":{ "v":..,"ts":N,"actor":".."}, ...}}
 * Returns 0 on success, -1 on parse error. Merges into st.
 */
int p31_sync_deserialize_merge(p31_device_state_t *st, const char *buf) {
    char src_actor[P31_MAX_ACTOR] = {0};
    uint64_t src_lamport = 0;
    const char *p = buf;
    /* extract lamport */
    const char *l = strstr(p, "\"lamport\"");
    if (l) src_lamport = (uint64_t)strtoull(l + 9, NULL, 10);
    /* extract actor (first "actor":"..." after "paths" is per-field; the top-level
       actor appears before "lamport") */
    const char *a = strstr(p, "\"actor\"");
    if (a) {
        const char *q = strchr(a + 8, '"');
        if (q) { const char *e = strchr(q + 1, '"'); if (e) { size_t n = e - (q + 1); if (n >= P31_MAX_ACTOR) n = P31_MAX_ACTOR - 1; memcpy(src_actor, q + 1, n); } }
    }

    /* walk the "paths" object */
    const char *paths = strstr(p, "\"paths\"");
    if (!paths) return -1;
    const char *obj = strchr(paths, '{');
    if (!obj) return -1;
    const char *end = strrchr(obj, '}');
    if (!end) return -1;

    char local_paths[P31_MAX_FIELDS][P31_MAX_PATH];
    p31_ts_val_t local_vals[P31_MAX_FIELDS];
    uint8_t cnt = 0;

    const char *cur = obj + 1;
    while (cur < end && cnt < P31_MAX_FIELDS) {
        /* path key */
        const char *kq = strchr(cur, '"');
        if (!kq || kq > end) break;
        const char *ke = strchr(kq + 1, '"');
        if (!ke) break;
        size_t klen = ke - (kq + 1);
        if (klen >= P31_MAX_PATH) klen = P31_MAX_PATH - 1;
        memcpy(local_paths[cnt], kq + 1, klen);
        local_paths[cnt][klen] = 0;

        /* find value object start '{' after ke */
        const char *vo = strchr(ke + 1, '{');
        if (!vo || vo > end) break;
        const char *ve = NULL;
        int depth = 0;
        for (const char *x = vo; x < end; x++) {
            if (*x == '{') depth++;
            else if (*x == '}') { depth--; if (depth == 0) { ve = x; break; } }
        }
        if (!ve) break;

        p31_ts_val_t tv; memset(&tv, 0, sizeof tv);
        /* parse "v": */
        const char *vv = strstr(vo, "\"v\"");
        if (vv && vv < ve) {
            const char *colon = strchr(vv + 3, ':');
            if (colon) {
                /* determine value kind by first non-space char after colon */
                const char *val = colon + 1;
                while (*val == ' ' || *val == '\t') val++;
                if (*val == '"') {
                    const char *qs = val + 1; const char *qe = strchr(qs, '"');
                    if (qe) { size_t n = qe - qs; if (n >= 56) n = 55; memcpy(tv.value.u.s, qs, n); tv.value.u.s[n] = 0; tv.value.type = P31_T_STR; }
                } else if (strncmp(val, "true", 4) == 0) { tv.value.u.b = true; tv.value.type = P31_T_BOOL; }
                else if (strncmp(val, "false", 5) == 0) { tv.value.u.b = false; tv.value.type = P31_T_BOOL; }
                else if (*val == 'n') { tv.value.type = P31_T_NULL; }
                else {
                    /* number */
                    char *endp = NULL;
                    double d = strtod(val, &endp);
                    if (endp != val && strchr(val, '.') == NULL) { tv.value.u.i = (int64_t)d; tv.value.type = P31_T_INT; }
                    else { tv.value.u.f = d; tv.value.type = P31_T_FLOAT; }
                }
            }
        }
        /* parse "ts": */
        const char *ts = strstr(vo, "\"ts\"");
        if (ts && ts < ve) tv.ts = (uint64_t)strtoull(ts + 4, NULL, 10);
        /* parse per-field "actor": */
        const char *fa = strstr(vo, "\"actor\"");
        if (fa && fa < ve) { const char *fq = strchr(fa + 7, '"'); if (fq) { const char *fe = strchr(fq + 1, '"'); if (fe) { size_t n = fe - (fq + 1); if (n >= P31_MAX_ACTOR) n = P31_MAX_ACTOR - 1; memcpy(tv.actor, fq + 1, n); } } }
        else strncpy(tv.actor, src_actor, P31_MAX_ACTOR - 1);

        local_vals[cnt] = tv;
        cnt++;
        cur = ve + 1;
    }

    p31_sync_merge(st, src_actor, src_lamport, (const char **)local_paths, local_vals, cnt);
    return 0;
}
