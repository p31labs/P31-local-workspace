# P31 Security Hardening Checklist

## 1. Key Rotation
- [ ] Implement API key rotation endpoint (`POST /auth/rotate`)
- [ ] Keys should expire after 90 days (configurable)
- [ ] Add rotation notification (email/webhook)

## 2. Rate Limiting
- [x] Rate limiter implemented (`src/security/rate-limit.ts`)
- [ ] Wire rate limiter into public endpoints (`/auth/register`, `/auth/keygen`, `/did/resolve`)
- [ ] Implement per-API-key rate limiting on authenticated endpoints
- [ ] Use Cloudflare WAF rate limiting rules (Pro plan: 2 rules)
- [ ] Or implement Worker-based rate limiting with KV (already implemented)

## 3. Input Validation
- [x] All D1 queries use prepared statements
- [ ] Validate all incoming JSON schemas with Zod
- [ ] Sanitize user-provided strings before logging

## 4. Secret Management
- [ ] All secrets stored with `wrangler secret`
- [ ] No secrets in source code or wrangler.toml
- [ ] .env files are gitignored

## 5. WAF & DDoS Protection
- [ ] Enable OWASP Top-10 rule set in Cloudflare WAF
- [ ] Enable Bot Management
- [ ] Set per-minute request cap (e.g., 120 req/min per API key)

## 6. Audit Logging
- [ ] Log all authentication events (login, registration, key rotation)
- [ ] Log all access to sensitive endpoints
- [ ] Store audit logs in a separate D1 table
