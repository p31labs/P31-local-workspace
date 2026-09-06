#ifndef P31_IDENTITY_H
#define P31_IDENTITY_H

#include <stdint.h>
#include <stddef.h>

#define P31_DID_KEY_MAX 64
#define P31_DID_JWK_MAX 256
#define P31_SHORT_DID_MAX 7

bool p31_identity_init(void);

const char *p31_identity_did_key(void);
const char *p31_identity_short_did(void);

const uint8_t *p31_identity_ed_public(void);
const uint8_t *p31_identity_ed_secret(void);

#endif