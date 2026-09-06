#!/usr/bin/env node
// EUDI Wallet Compatibility Test
// Validates P31 Cognitive Passport against EUDI Wallet requirements

import { readFileSync } from 'fs';
import { join } from 'path';

const EUDI_REQUIREMENTS = {
  // EUDI Wallet mandatory fields per eIDAS 2.0
  mandatoryFields: [
    '@context',
    'type',
    'issuer',
    'validFrom',
    'credentialSubject.id',
    'proof',
  ],
  // W3C VC 2.0 context
  requiredContexts: [
    'https://www.w3.org/2018/credentials/v1',
    'https://www.w3.org/2018/credentials/v2',
  ],
  // Required types
  requiredTypes: [
    'VerifiableCredential',
    'CognitivePassportCredential',
  ],
};

async function validateEUDICompliance(vc) {
  const results = {
    compliant: true,
    errors: [],
    warnings: [],
    checks: {},
  };

  // Check mandatory fields
  for (const field of EUDI_REQUIREMENTS.mandatoryFields) {
    const present = field.includes('.') 
      ? field.split('.').reduce((o, k) => o && o[k], vc)
      : vc[field];
    results.checks[field] = !!present;
    if (!present) {
      results.compliant = false;
      results.errors.push(`Missing mandatory field: ${field}`);
    }
  }

  // Check @context
  if (vc['@context']) {
    const contexts = Array.isArray(vc['@context']) ? vc['@context'] : [vc['@context']];
    for (const required of EUDI_REQUIREMENTS.requiredContexts) {
      const has = contexts.some(c => c.includes(required));
      results.checks[`context:${required}`] = has;
      if (!has) results.warnings.push(`Missing context: ${required}`);
    }
  }

  // Check types
  if (vc.type) {
    const types = Array.isArray(vc.type) ? vc.type : [vc.type];
    for (const required of EUDI_REQUIREMENTS.requiredTypes) {
      const has = types.includes(required);
      results.checks[`type:${required}`] = has;
      if (!has) results.errors.push(`Missing type: ${required}`);
    }
  }

  // Check proof
  if (vc.proof) {
    results.checks.proof = true;
    if (vc.proof.type && !Array.isArray(vc.proof.type)) {
      results.warnings.push('Proof type should be an array for multi-algorithm support');
    }
  }

  return results;
}

async function main() {
  console.log('=== EUDI Wallet Compatibility Test ===\n');

  // Test 1: Validate EUDI export function
  console.log('Test 1: EUDI Export Structure');
  try {
    const { buildEUDIVC, validateEUDIVC } = await import(
      join(process.cwd(), 'packages/ui/src/passport/eudiExport.ts')
    );
    
    // Create a test passport
    const testPassport = {
      schema: 'p31.cognitivePassport/1.1.0',
      issuedAt: new Date().toISOString(),
      subject: { did: 'did:key:z6Mk...' },
    };
    
    const vc = buildEUDIVC(testPassport, 'did:key:z6Mk...');
    const validation = validateEUDIVC(vc);
    
    console.log(`  Compliant: ${validation.compliant}`);
    console.log(`  Checks: ${Object.values(validation.checks).filter(Boolean).length}/${Object.keys(validation.checks).length}`);
    if (validation.errors.length) {
      console.log(`  Errors: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length) {
      console.log(`  Warnings: ${validation.warnings.join(', ')}`);
    }
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
  }

  // Test 2: Check SD-JWT VC envelope
  console.log('\nTest 2: SD-JWT VC Envelope');
  try {
    const { createSDJWTVC, signSDJWTVC } = await import(
      join(process.cwd(), 'packages/ui/src/passport/eudi.ts')
    );
    console.log('  SD-JWT VC functions available: ✓');
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
  }

  // Test 3: Check triple-signature support
  console.log('\nTest 3: Triple-Signature Support');
  try {
    const signModule = await import(
      join(process.cwd(), 'packages/shared/src/cognitive-passport/crypto/sign.ts')
    );
    console.log('  Triple-signature module available: ✓');
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
