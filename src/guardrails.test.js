/**
 * Unit tests for guardrails system
 */
import { 
  calculateCurrentLevel, 
  getThrottledInterval, 
  isActionAllowed,
  isFawnGuardActive,
  GUARDRAIL_LEVELS
} from './guardrails.js'

console.log('Running guardrails tests...\n')

// Test 1: Level transition logic
console.log('Test 1: Level transitions (S_MAX=20)')
console.log('----------------------------------')

let level = 4
console.log(`Initial level: ${level}`)

level = calculateCurrentLevel(6, level)
console.log(`Spoons=6, new level: ${level} (expected 2)`)

level = calculateCurrentLevel(1, level)
console.log(`Spoons=1, new level: ${level} (expected 0)`)

level = calculateCurrentLevel(3, level)
console.log(`Spoons=3, new level: ${level} (expected 1)`)

level = calculateCurrentLevel(6, level)
console.log(`Spoons=6, new level: ${level} (expected 2)`)

level = calculateCurrentLevel(12, level)
console.log(`Spoons=12, new level: ${level} (expected 3)`)

level = calculateCurrentLevel(16, level)
console.log(`Spoons=16, new level: ${level} (expected 4)`)

console.log('')

// Test 2: Hysteresis behavior
console.log('Test 2: Hysteresis (no flapping)')
console.log('-------------------------------')

level = 2
console.log(`At level ${level}, spoons=5 (threshold)`)
level = calculateCurrentLevel(5, level)
console.log(`Spoons=5, level remains: ${level} (no transition, expected 2)`)

level = calculateCurrentLevel(5.6, level)
console.log(`Spoons=5.6, level remains: ${level} (no transition, expected 2)`)

level = calculateCurrentLevel(5.6, level)
console.log(`Spoons=5.6, still level: ${level} (hysteresis prevents early transition)`)

level = calculateCurrentLevel(10.5, level)
console.log(`Spoons=10.5, new level: ${level} (expected 3)`)

console.log('')

// Test 3: Throttling intervals
console.log('Test 3: Throttling intervals')
console.log('---------------------------')

const baseInterval = 300000 // 5 minutes
console.log(`Base interval: ${baseInterval}ms (5 minutes)`)

GUARDRAIL_LEVELS.forEach(l => {
  const interval = getThrottledInterval(baseInterval, l.level)
  console.log(`Level ${l.level}: ${interval === Infinity ? 'PAUSED' : `${Math.round(interval/60000)} minutes`}`)
})

console.log('')

// Test 4: Action priority filtering
console.log('Test 4: Priority filtering')
console.log('-------------------------')

console.log('Level 2 (min priority 4):')
console.log(`Priority 3: ${isActionAllowed(3, 2) ? 'allowed' : 'blocked'} (expected blocked)`)
console.log(`Priority 4: ${isActionAllowed(4, 2) ? 'allowed' : 'blocked'} (expected allowed)`)
console.log(`Priority 7: ${isActionAllowed(7, 2) ? 'allowed' : 'blocked'} (expected allowed)`)

console.log('\nLevel 0 (Fawn Guard):')
console.log(`Priority 9: ${isActionAllowed(9, 0) ? 'allowed' : 'blocked'} (expected blocked)`)
console.log(`Priority 10: ${isActionAllowed(10, 0) ? 'allowed' : 'blocked'} (expected allowed)`)

console.log('')

// Test 5: Fawn Guard behavior
console.log('Test 5: Fawn Guard mode')
console.log('----------------------')
console.log(`Level 0 is Fawn Guard: ${isFawnGuardActive(0)}`)
console.log(`Level 1 is Fawn Guard: ${isFawnGuardActive(1)}`)

console.log('')

// Test 6: Cybernetic time dilation
console.log('Test 6: Exponential time dilation')
console.log('---------------------------------')
import { evaluateGuardrails, S_MAX } from './guardrails.js'

const baseAction = {
  safetyLevel: 2,
  priority: 5,
  baseDelayMs: 300000 // 5 minutes
}

console.log(`Base delay: ${baseAction.baseDelayMs/60000} minutes`)
console.log('')

for (let spoons = 20; spoons >= 0; spoons -= 4) {
  const result = evaluateGuardrails(baseAction, { spoons })
  const minutes = result.delayMs / 60000
  console.log(`Spoons=${spoons}: ${minutes.toFixed(1)} minutes (x${result.dilationFactor} dilation)`)
}

console.log('')

// Test 7: Emergency bypass
console.log('Test 7: Emergency bypass override')
console.log('---------------------------------')

const criticalAction = {
  safetyLevel: 4,
  priority: 10,
  baseDelayMs: 300000
}

const result = evaluateGuardrails(criticalAction, { spoons: 1 })
console.log(`Spoons=1, critical action (P=10): approved=${result.approved}, delay=${result.delayMs}ms`)
console.log(`Reason: ${result.reason}`)

console.log('\n✅ All tests completed')
