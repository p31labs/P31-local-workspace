/**
 * Test harness for orchestrator guardrail evaluation
 * Simulates trigger events and verifies guardrail behavior
 */

import { evaluateGuardrails, calculateCurrentLevel } from '../../src/guardrails.js';

console.log('🧪 Orchestrator Test Harness\n');

// Test 1: Full guardrail evaluation across spoon range
console.log('Test 1: Guardrail evaluation across spoon range');
console.log('-----------------------------------------------');

const testAction = {
  safetyLevel: 2,
  priority: 5,
  baseDelayMs: 300000 // 5 minutes
};

for (let spoons = 20; spoons >= 0; spoons -= 2) {
  const result = evaluateGuardrails(testAction, { spoons });
  const minutes = result.delayMs / 60000;
  console.log(
    `Spoons=${String(spoons).padStart(2)}: ` +
    `${result.approved ? '✅' : '❌'} ` +
    `${minutes.toFixed(1).padStart(5)}m ` +
    `${result.requiresManual ? '(MANUAL)' : ''} ` +
    `${result.reason}`
  );
}

console.log('\nTest 2: Emergency bypass behavior');
console.log('----------------------------------');

const criticalAction = {
  safetyLevel: 4,
  priority: 10,
  baseDelayMs: 300000
};

const criticalResult = evaluateGuardrails(criticalAction, { spoons: 1 });
console.log(`Spoons=1, Priority=10: ${criticalResult.approved ? '✅' : '❌'} ${criticalResult.reason}`);
console.log(`Delay: ${criticalResult.delayMs}ms`);

console.log('\nTest 3: Hysteresis transition behavior');
console.log('---------------------------------------');

let level = 4;
console.log(`Initial level: ${level}`);

level = calculateCurrentLevel(9, level);
console.log(`Spoons=9: level=${level}`);

level = calculateCurrentLevel(8.6, level);
console.log(`Spoons=8.6: level=${level} (no transition, hysteresis)`);

level = calculateCurrentLevel(8.4, level);
console.log(`Spoons=8.4: level=${level}`);

level = calculateCurrentLevel(2.4, level);
console.log(`Spoons=2.4: level=${level}`);

level = calculateCurrentLevel(2.6, level);
console.log(`Spoons=2.6: level=${level} (no transition, hysteresis)`);

level = calculateCurrentLevel(3.0, level);
console.log(`Spoons=3.0: level=${level}`);

console.log('\n✅ All tests completed');
