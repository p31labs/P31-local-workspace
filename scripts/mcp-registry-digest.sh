#!/usr/bin/env bash
# mcp-registry-digest.sh — daily observability digest for the MCP marketplace.
#
# Pulls the four signals that tell you what the marketplace is actually doing:
#   GET /errors          portal error ingestion (is anything breaking?)
#   GET /anomalies       sanitizer/write-on-readonly findings
#   GET /audit           which tools are being called (top 15)
#   GET /servers/pending community registrations awaiting review
#
# Usage:
#   MCP_REGISTRY_ADMIN_TOKEN=<token> bash scripts/mcp-registry-digest.sh
# Cron (optional):
#   0 9 * * * MCP_REGISTRY_ADMIN_TOKEN=<token> /home/p31/P31-local-workspace/scripts/mcp-registry-digest.sh >> /home/p31/P31-local-workspace/logs/registry-digest.log 2>&1

set -uo pipefail
BASE="${MCP_REGISTRY_BASE:-https://mcp-registry.trimtab-signal.workers.dev}"
TOKEN="${MCP_REGISTRY_ADMIN_TOKEN:-}"
NOW="$(date -u +%Y-%m-%dT%H:%MZ)"

if [ -z "$TOKEN" ]; then
  echo "MCP_REGISTRY_ADMIN_TOKEN not set — digest skipped" >&2
  exit 1
fi

AUTH="Authorization: Bearer $TOKEN"
JQ() { python3 -c "import json,sys; d=json.load(sys.stdin); $1"; }

echo "## P31 MCP registry digest — $NOW"

echo ""
echo "### errors (last 100, admin)"
curl -s --max-time 20 -H "$AUTH" "$BASE/errors?limit=100" | python3 -c "
import json,sys
try:
  ev=json.load(sys.stdin).get('events',[])
  print('count:', len(ev))
  from collections import Counter
  for src,n in Counter(e.get('source','?') for e in ev).most_common(8): print(' ', n, src)
  for e in ev[:5]: print('  -', e.get('ts',''), '|', (e.get('message') or '')[:90])
except Exception as ex: print('  parse error', ex)
"

echo ""
echo "### anomalies"
curl -s --max-time 20 -H "$AUTH" "$BASE/anomalies" | python3 -c "
import json,sys
try:
  f=json.load(sys.stdin).get('findings',[])
  print('findings:', len(f))
  for x in f[:10]: print('  -', x.get('type'), x.get('serverId'), x.get('severity'), '|', (x.get('detail') or '')[:90])
except Exception as ex: print('  parse error', ex)
"

echo ""
echo "### audit — top tools (last 100 calls)"
curl -s --max-time 20 "$BASE/audit?limit=100" | python3 -c "
import json,sys
from collections import Counter
try:
  d=json.load(sys.stdin)
  print('source:', d.get('source'), '| chain ok:', d.get('chain',{}).get('ok'), '| entries:', len(d.get('entries',[])))
  tools=Counter((e.get('serverId','?'), e.get('tool','?')) for e in d.get('entries',[]))
  for (sid,tool),n in tools.most_common(15): print('  ', n, sid, tool)
  errs=sum(1 for e in d.get('entries',[]) if e.get('status')=='error')
  print('  error calls:', errs)
except Exception as ex: print('  parse error', ex)
"

echo ""
echo "### pending registrations"
curl -s --max-time 20 -H "$AUTH" "$BASE/servers/pending" | python3 -c "
import json,sys
try:
  p=json.load(sys.stdin)
  print('pending:', p.get('pending',0))
  for s in p.get('servers',[])[:10]: print('  -', s.get('id'), s.get('category'), '|', (s.get('description') or '')[:70])
except Exception as ex: print('  parse error', ex)
"