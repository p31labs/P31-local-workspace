# DNS `_agent` TXT Record — IETF AID Discovery

Add the following TXT record to your Cloudflare DNS zone for `p31ca.org`:

**Record Type:** TXT
**Name:** `_agent.p31ca.org`
**Content:** `ver=1; uri=https://p31ca.org/.well-known/agents.json; auth=none`
**TTL:** 300 (or auto)

**Full entry (bind format):**

```
_agent.p31ca.org. 300 IN TXT "ver=1; uri=https://p31ca.org/.well-known/agents.json; auth=none"
```

**Verification:**

```bash
dig TXT _agent.p31ca.org +short
```

Expected output:

```
"ver=1; uri=https://p31ca.org/.well-known/agents.json; auth=none"
```

**Fallback:** If DNS is unavailable, clients should fall back to `https://p31ca.org/.well-known/agents.json` (already deployed).

**References:** IETF AID draft, Agent Discovery Protocol (ADP) v1.1
