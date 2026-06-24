/**
 * Week 2 Convergence Checkpoint: Voice-Persona Integration
 * Integration: Voice + Bros (Persona system)
 * 
 * Success: Voice commands can switch between personas seamlessly
 */

import type { PHOSMasterRuntime, ConvergenceReport, IntegrationCheck } from '../master';
import { VoicePhase } from '../phase1-voice/index';
import { BrosPhase } from '../phase2-bros/index';

export interface Week2ConvergenceInput {
  voicePhaseId: string;
  brosPhaseId: string;
  testPhrases: string[];
  expectedPersonaSwitches: Array<{
    phrase: string;
    expectedPersona: 'wj' | 'sj' | 'cj' | 'wij';
  }>;
}

export interface Week2SuccessCriteria {
  voiceRecognitionAccuracy: number; // Target: >0.85
  personaSwitchLatency: number; // Target: <500ms
  integrationReliability: number; // Target: >0.95
}

export async function runWeek2Convergence(
  master: PHOSMasterRuntime,
  input?: Week2ConvergenceInput
): Promise<ConvergenceReport> {
  const week = 2;
  const timestamp = Date.now();
   
  console.log(`[Week 2 Convergence] Voice-Persona Integration checkpoint starting...`);
   
  // Get config from master
  const config = (master as any).config as { version?: string } | undefined;
   
  // Create Voice and Bros phases for testing
  const voicePhase = new VoicePhase();
  const brosPhase = new BrosPhase();
   
  // Initialize phases with master's config
  await voicePhase.initialize(config || { version: '1.0.0', convergenceWeek: week, phases: {}, features: { voice: true, bros: true, router: false, visual: false, predictive: false, guardian: false, bridge: false, memory: false } });
  await brosPhase.initialize(config || { version: '1.0.0', convergenceWeek: week, phases: {}, features: { voice: true, bros: true, router: false, visual: false, predictive: false, guardian: false, bridge: false, memory: false } });
   
  // Connect phases to master's event system
  voicePhase.setEmitDelegate((event) => master.emit?.(event));
  voicePhase.setOnDelegate((event, handler) => master.on?.(event, handler));
  brosPhase.setEmitDelegate((event) => master.emit?.(event));
  brosPhase.setOnDelegate((event, handler) => master.on?.(event, handler));
   
  // Activate phases
  voicePhase.activate();
  brosPhase.activate();
   
  // Run master convergence to get baseline state
  const baseReport = await master.converge(week);
   
  // Week 2 specific integration validation
  const integrationChecks: IntegrationCheck[] = [
    {
      phases: ['voice', 'bros'],
      name: 'Voice-Persona Switching',
      ready: baseReport.integrations.some(i => 
        i.name === 'Voice-Persona Switching' && i.ready
      ),
      demo: '"Switch to S.J. mode" → UI transforms, voice responses adapt to sibling persona'
    },
    {
      phases: ['voice', 'bros', 'router'],
      name: 'Voice-Routed Persona Commands',
      ready: baseReport.integrations.some(i => 
        i.name === 'Core Runtime' && i.ready
      ),
      demo: '"Hey PHOS, ask W.J. about the mesh" → Voice captures, Router directs to W.J. persona'
    }
  ];
   
  // Demo scenarios for Week 2
  const demoScenarios = [
    {
      name: 'Direct Persona Switch',
      description: 'User says "Switch to C.J. mode" → Bros phase activates C.J. persona, UI updates',
      trigger: 'voice.persona.switch',
      successIndicator: 'bros.persona.changed event fired with persona=cj'
    },
    {
      name: 'Contextual Persona Query',
      description: 'User says "What would S.J. say about this?" → Voice routes to S.J. persona for response',
      trigger: 'voice.query.persona',
      successIndicator: 'Response generated using S.J. voice patterns and knowledge'
    },
    {
      name: 'Persona-Aware Voice Feedback',
      description: 'Voice responses adapt tone based on active persona (parental vs sibling)',
      trigger: 'voice.speak',
      successIndicator: 'Audio output matches active persona characteristics'
    }
  ];
   
  // Run actual measurements using test phrases
  let voiceRecognitionAccuracy = 0.0;
  let personaSwitchLatency = 0;
  let integrationReliability = 0.0;
   
  if (input && input.testPhrases && input.expectedPersonaSwitches) {
    // Test voice recognition accuracy
    const recognitionResults = await testVoiceRecognition(voicePhase, input.testPhrases);
    voiceRecognitionAccuracy = recognitionResults.accuracy;
   
    // Test persona switch latency
    const latencyResults = await testPersonaSwitchLatency(brosPhase, voicePhase, input.expectedPersonaSwitches);
    personaSwitchLatency = latencyResults.averageLatency;
   
    // Test integration reliability
    const reliabilityResults = await testIntegrationReliability(voicePhase, brosPhase, input.expectedPersonaSwitches);
    integrationReliability = reliabilityResults.reliability;
  } else {
    // Fallback to baseline convergence data if no test input provided
    voiceRecognitionAccuracy = 0.85;
    personaSwitchLatency = 400;
    integrationReliability = 0.90;
  }
   
  // Success criteria validation
  const successCriteria: Week2SuccessCriteria = {
    voiceRecognitionAccuracy,
    personaSwitchLatency,
    integrationReliability
  };
   
  // Validate against criteria
  const passed = 
    successCriteria.voiceRecognitionAccuracy > 0.85 &&
    successCriteria.personaSwitchLatency < 500 &&
    successCriteria.integrationReliability > 0.95;
   
  // Week 2 specific blockers
  const week2Blockers = [
    ...baseReport.blockers,
    ...(successCriteria.voiceRecognitionAccuracy <= 0.85 
      ? ['Voice recognition accuracy below threshold for persona switching'] 
      : []),
    ...(successCriteria.personaSwitchLatency >= 500 
      ? ['Persona switch latency too high for smooth UX'] 
      : []),
    ...(successCriteria.integrationReliability <= 0.95 
      ? ['Integration reliability insufficient for production'] 
      : [])
  ];
   
  const report: ConvergenceReport = {
    week,
    timestamp,
    phaseReports: baseReport.phaseReports,
    integrations: integrationChecks,
    blockers: week2Blockers,
    // Extended convergence data
    demoScenarios,
    successCriteria,
    passed,
    summary: passed 
      ? 'Week 2: Voice-Persona integration CONVERGED'
      : 'Week 2: Voice-Persona integration DIVERGED - blockers detected'
  } as ConvergenceReport & { 
    demoScenarios: typeof demoScenarios;
    successCriteria: typeof successCriteria;
    passed: boolean;
    summary: string;
  };
   
  console.log(`[Week 2 Convergence] ${report.summary}`);
  console.log(`[Week 2 Convergence] Blockers: ${week2Blockers.length}`);
  console.log(`[Week 2 Convergence] Demo ready: "${integrationChecks[0].demo}"`);
   
  return report;
}

// Default test phrases for persona switching
export const DEFAULT_PERSONA_PHRASES = [
  { phrase: 'Switch to S.J. mode', expectedPersona: 'sj' as const },
  { phrase: 'Let me talk to C.J.', expectedPersona: 'cj' as const },
  { phrase: 'W.J., what do you think?', expectedPersona: 'wj' as const },
  { phrase: 'Switch back to dad', expectedPersona: 'wij' as const }
];

async function testVoiceRecognition(phase: VoicePhase, testPhrases: string[]): Promise<{ accuracy: number }> {
  if (testPhrases.length === 0) return { accuracy: 0.85 }; // fallback
  
  let correct = 0;
  const total = testPhrases.length;
   
  for (const phrase of testPhrases) {
    // Simulate voice recognition - in real implementation, this would use actual speech-to-text
    // For now, we'll simulate based on phrase complexity and known patterns
    const recognized = await simulateVoiceRecognition(phrase);
    if (recognized && recognized.length > 0) {
      correct++;
    }
  }
   
  return { accuracy: correct / total };
}

async function testPersonaSwitchLatency(brosPhase: BrosPhase, voicePhase: VoicePhase, expectedSwitches: Array<{ phrase: string; expectedPersona: 'wj' | 'sj' | 'cj' | 'wij'; }>): Promise<{ averageLatency: number }> {
  if (expectedSwitches.length === 0) return { averageLatency: 320 }; // fallback
   
  const latencies: number[] = [];
   
  for (const { phrase, expectedPersona } of expectedSwitches) {
    const startTime = Date.now();
   
    // Simulate voice command triggering persona switch
    await simulateVoiceCommand(brosPhase, voicePhase, phrase);
   
    // Wait for persona switch to complete (simulate with async delay)
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing time
   
    const endTime = Date.now();
    latencies.push(endTime - startTime);
  }
   
  const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  return { averageLatency };
}

async function testIntegrationReliability(brosPhase: BrosPhase, voicePhase: VoicePhase, expectedSwitches: Array<{ phrase: string; expectedPersona: 'wj' | 'sj' | 'cj' | 'wij'; }>): Promise<{ reliability: number }> {
  if (expectedSwitches.length === 0) return { reliability: 0.90 }; // fallback
   
  let successful = 0;
  const total = expectedSwitches.length;
   
  for (const { phrase, expectedPersona } of expectedSwitches) {
    try {
      // Simulate voice command and check if persona switched correctly
      await simulateVoiceCommand(brosPhase, voicePhase, phrase);
      await new Promise(resolve => setTimeout(resolve, 30));
       
      // Check if the persona switched as expected
      const currentPersona = brosPhase.getCurrentPersona();
      if (currentPersona === expectedPersona) {
        successful++;
      }
    } catch (error) {
      // Test failed
    }
  }
   
  return { reliability: successful / total };
}

// Simulation helpers - in a real implementation, these would interface with actual speech recognition and phase APIs
async function simulateVoiceRecognition(phrase: string): Promise<string | null> {
  // Simulate voice recognition accuracy based on phrase length and complexity
  // Longer, more complex phrases are harder to recognize accurately
  const baseAccuracy = 0.90;
  const complexityPenalty = Math.min(0.3, phrase.length * 0.01);
  const accuracy = baseAccuracy - complexityPenalty + (Math.random() * 0.1 - 0.05); // Add some randomness
   
  return Math.random() < accuracy ? phrase : null;
}

async function simulateVoiceCommand(brosPhase: BrosPhase, voicePhase: VoicePhase, phrase: string): Promise<void> {
  // Simulate processing a voice command through the voice phase to the bros phase
  // In reality, this would involve:
  // 1. Voice phase processing audio to text
  // 2. Sending the text as an event
  // 3. Bros phase receiving the event and processing it
   
  // Simulate network/event processing delay
  await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
   
  // For persona switch phrases, actually trigger the switch
  if (phrase.toLowerCase().includes('switch')) {
    // Extract persona name from phrase (simplified)
    if (phrase.toLowerCase().includes('s.j.') || phrase.toLowerCase().includes('sj')) {
      brosPhase.switchPersona('sj');
    } else if (phrase.toLowerCase().includes('c.j.') || phrase.toLowerCase().includes('cj')) {
      brosPhase.switchPersona('cj');
    } else if (phrase.toLowerCase().includes('w.j.') || phrase.toLowerCase().includes('wj')) {
      brosPhase.switchPersona('wj');
    } else if (phrase.toLowerCase().includes('dad') || phrase.toLowerCase().includes('father')) {
      brosPhase.switchPersona('wij');
    }
  }
}

export default runWeek2Convergence;
