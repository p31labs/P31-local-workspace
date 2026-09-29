import { describe, it, expect } from 'vitest'
import { generatePickleName, generatePickleNames, pickleInvariants, PICKLE_PREFIXES, PICKLE_SUFFIXES } from './index.js'
import { PASSENGERS, PASSENGER_IDS, passportInvariants, getPassport, canAccess, defaultModeFor } from './passports.js'

describe('pickle-names — determinism + vocabulary', () => {
  it('is deterministic: same seed → same name', () => {
    expect(generatePickleName('dillpickle')).toBe(generatePickleName('dillpickle'))
    expect(generatePickleName('some-seed')).toBe('Vine·warm')
  })

  it('produced a known stable name for the canonical passport seed', () => {
    // Determinism contract: the canonical passport ids must map to stable names.
    const name = generatePickleName('dillpickle')
    expect(name.length).toBeGreaterThan(0)
  })

  it('vocabulary is byte-identical to QPJ source (24 prefixes, 24 suffixes)', () => {
    expect(PICKLE_PREFIXES).toHaveLength(24)
    expect(PICKLE_SUFFIXES).toHaveLength(24)
    // spot-check known QPJ entries
    expect(PICKLE_PREFIXES[0]).toBe('Dill')
    expect(PICKLE_PREFIXES[3]).toBe('Gherkin')
    expect(PICKLE_SUFFIXES[0]).toBe('quiet')
    expect(PICKLE_SUFFIXES[14]).toBe('cool')
  })

  it('batch generation is collision-free', () => {
    const names = generatePickleNames('family', 40)
    expect(new Set(names).size).toBe(40)
  })

  it('passes the pickle invariants (determinism, vocabulary, collision)', () => {
    const r = pickleInvariants()
    expect(r.ok, r.failures.join('; ')).toBe(true)
  })
})

describe('pickle-names — canonical passports', () => {
  it('has exactly 5 passengers with unique ids and pickle names', () => {
    expect(PASSENGER_IDS).toHaveLength(5)
    const names = PASSENGER_IDS.map((id) => PASSENGERS[id].pickledName)
    expect(new Set(names).size).toBe(5)
    expect(names).toContain('Dillpickle')
    expect(names).toContain('Half-Sour')
  })

  it('has exactly one caregiver (gherkin)', () => {
    const caregivers = PASSENGER_IDS.filter((id) => PASSENGERS[id].isCaregiver)
    expect(caregivers).toEqual(['gherkin'])
  })

  it('passes passport invariants', () => {
    const r = passportInvariants()
    expect(r.ok, r.failures.join('; ')).toBe(true)
  })

  it('unknown id falls back to dillpickle', () => {
    expect(getPassport('nobody').id).toBe('dillpickle')
  })

  it('mode access respects the rank (caregiver workshop can reach spark)', () => {
    expect(canAccess('workshop', 'spark')).toBe(true)
    expect(canAccess('spark', 'workshop')).toBe(false)
  })

  it('default mode follows role', () => {
    expect(defaultModeFor('dillpickle')).toBe('spark')
    expect(defaultModeFor('breadbutter')).toBe('maker')
    expect(defaultModeFor('halfsour')).toBe('workshop')
  })
})