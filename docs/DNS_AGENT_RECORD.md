# DNS `_agent` TXT Record Configuration

## What This Is

The IETF Agent Identity and Discovery (AID) draft defines a DNS TXT record at `_agent.{domain}` that points to an agent registry. This allows clients to discover an organization's agents via standard DNS lookups, complementing the `/.well-known/agents.json` endpoint.

## DNS Record

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Type   | TXT                                      |
| Name   | `_agent`                                 |
| Target | `https://p31ca.org/.well-known/agents.json` |
| TTL    | Auto (3600)                              |

## Cloudflare Dashboard Steps

1. Go to **Cloudflare Dashboard** → **DNS** → **Records**
2. Click **Add record**
3. Set **Type** to `TXT`
4. Set **Name** to `_agent`
5. Set **Target** to `https://p31ca.org/.well-known/agents.json`
6. Leave TTL as Auto
7. Click **Save**

## Verify

```bash
dig TXT _agent.p31ca.org +short
```

Expected output:

```
"https://p31ca.org/.well-known/agents.json"
```

## Why It Matters

This completes the three-layer agent discovery stack:

1. **`/.well-known/agents.json`** — HTTP endpoint for machine consumption
2. **`_agent.{domain}` DNS TXT** — DNS-level discovery for clients that can't fetch HTTP
3. **`/llms.txt`** — Human-readable agent inventory

All three are now live for `p31ca.org`.
