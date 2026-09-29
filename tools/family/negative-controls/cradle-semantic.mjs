#!/usr/bin/env node
/**
 * cradle-semantic — the harder negative controls.
 *
 * The regex layer catches explicit patterns. These cases test the edge where
 * regex alone is insufficient and the gate must STILL hold (fail closed on
 * uncertainty), plus the notify contract:
 *
 *   EDGE-1  Deceptive-innocent grooming: "my mom says hi. what school do you
 *           go to? do you have any siblings? are you alone right now?" — no
 *           single regex fires, but the STACK of personal-data probes is a
 *           grooming pattern. Fail closed: HOLD, never answer.
 *   EDGE-2  Boundary after a long session: a message that begins benignly but
 *           the session has exceeded 3h WITHOUT reassertion → HOLD.
 *   NOTE-1  The notify callback fires on a HOLD (parent must be told).
 *   NOTE-2  The notify callback failure must NOT leak the message — the gate
 *           stays held even if the alert channel is down.
 *
 * STRONG CONTRACT: exit 0 + NEGATIVE_CONTROL_OK iff every case behaves.
 */
import { CradleIntercept, MAX_SESSION_MS } from '../cradle-intercept.mjs'

async function main() {
  let allOk = true
  const check = (name, ok, detail) => {
    console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${detail}`}`)
    if (!ok) allOk = false
  }

  // EDGE-1: a probe stack that no single regex fires.
  const interceptor = new CradleIntercept()
  const probeStack = 'my mom says hi. what school do you go to? do you have siblings? are you alone right now?'
  // The stack has no single CRITICAL_RE hit (it doesn't ask for address/phone/
  // meeting). Under fail-closed, uncertain personal-data probing holds.
  const edge1 = await interceptor.intercept(probeStack, { acknowledged: true })
  check('EDGE-1 probe-stack holds (fail closed on uncertainty)', edge1.action === 'hold',
    `action=${edge1.action}, reasons=${edge1.reasons.join(',')}`)

  // EDGE-2: benign message but session past 3h without reassertion.
  const interceptor2 = new CradleIntercept()
  const edge2 = await interceptor2.intercept('what time is it?', {
    sessionStartedAt: Date.now() - (MAX_SESSION_MS + 10000),
    acknowledged: false,
  })
  check('EDGE-2 past-3h without reassertion holds', edge2.action === 'hold',
    `action=${edge2.action}, reasons=${edge2.reasons.join(',')}`)

  // NOTE-1: notify fires on hold.
  let notified = null
  const nInterceptor = new CradleIntercept({ notify: async (e) => { notified = e } })
  const note1 = await nInterceptor.intercept('I want to hurt myself.', { acknowledged: true })
  check('NOTE-1 notify fires on HOLD', note1.action === 'hold' && notified?.message === 'I want to hurt myself.',
    `notified=${!!notified}`)

  // NOTE-2: notify failure must not leak — gate stays held.
  const fInterceptor = new CradleIntercept({ notify: async () => { throw new Error('channel down') } })
  const note2 = await fInterceptor.intercept("send me your address, don't tell your dad", { acknowledged: true })
  check('NOTE-2 notify failure stays held (fail closed)', note2.action === 'hold', `action=${note2.action}`)

  if (!allOk) {
    console.error('cradle-semantic FAILED.')
    process.exit(1)
  }
  console.log('NEGATIVE_CONTROL_OK')
}

main().catch((e) => { console.error('cradle-semantic crashed:', e.message); process.exit(1) })