#!/usr/bin/env node
// Lightweight CashPilot mobile sync – runs in Termux
// Records bandwidth earnings locally, pushes to D1 when online
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, homedir } from 'path'

const CONFIG = join(homedir(), '.p31')
const EARNINGS = join(CONFIG, 'earnings.json')
const API = 'https://api-phosphorus31-org.trimtab-signal.workers.dev'

function init() {
  if (!existsSync(CONFIG)) mkdirSync(CONFIG, { recursive: true })
  if (!existsSync(EARNINGS)) {
    writeFileSync(EARNINGS, JSON.stringify({ earnings: [], last_sync: null }))
  }
}

function load() {
  return JSON.parse(readFileSync(EARNINGS, 'utf8'))
}

function save(data) {
  writeFileSync(EARNINGS, JSON.stringify(data, null, 2))
}

let cmd = process.argv[2]

if (cmd === 'add') {
  init()
  let data = load()
  let amount = parseFloat(process.argv[3]) || 0
  let kind = process.argv[4] || 'bandwidth'
  data.earnings.push({
    source: 'mobile',
    amount,
    kind,
    timestamp: new Date().toISOString(),
  })
  save(data)
  console.log(`Recorded: +${amount} (${kind})`)

} else if (cmd === 'push') {
  init()
  let data = load()
  if (data.earnings.length === 0) {
    console.log('Nothing to sync')
    process.exit(0)
  }
  console.log(`Pushing ${data.earnings.length} records to D1...`)
  try {
    let res = await fetch(`${API}/ledger/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.earnings),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.earnings = []
    data.last_sync = Date.now()
    save(data)
    console.log('Synced ✓')
  } catch (e) {
    console.log(`Sync failed: ${e.message} (offline? will retry)`)
  }

} else {
  console.log(`
  Usage: mobile-sync.mjs add <amount> [kind]
         mobile-sync.mjs push

  Kinds: bandwidth, bandwidth_cache, referral, other
  `)
}
