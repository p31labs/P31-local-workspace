// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Growth Rings Engine
//
// Age-adaptive tier system for UI and feature availability.
// ═══════════════════════════════════════════════════════

export type GrowthTier = 'seed' | 'sprout' | 'sapling' | 'canopy' | 'forest';

export interface GrowthProfile {
  tier: GrowthTier;
  age: number;
  language: 'simple' | 'curious' | 'direct' | 'peer' | 'full';
  teachingMode: 'tell' | 'show' | 'ask' | 'collaborate' | 'peer';
  features: {
    textInput: boolean;
    customElements: boolean;
    freestyleMode: boolean;
    discoveryNaming: boolean;
    reactions: boolean;
    moduleCreation: boolean;
    sovereignty: boolean;
  };
  elementTier: string[];
  funFactDepth: 'simple' | 'intermediate' | 'scientific' | 'research';
  sentenceLength: 'short' | 'medium' | 'long' | 'full';
  uiDensity: number;
}

export function calculateTier(dob: Date, now = new Date()): GrowthTier {
  const age = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return tierFromAge(age);
}

export function tierFromAge(age: number): GrowthTier {
    if (age <= 9) return 'seed';
    if (age <= 13) return 'sprout';
    if (age <= 17) return 'sapling';
    if (age <= 25) return 'canopy';
    return 'forest';
}

export function getGrowthProfile(dob: Date, now = new Date()): GrowthProfile {
  const age = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const tier = tierFromAge(age);
  const features: GrowthProfile['features'] = {
      textInput: isFeatureAvailable('textInput', tier),
      customElements: isFeatureAvailable('customElements', tier),
      freestyleMode: isFeatureAvailable('freestyleMode', tier),
      discoveryNaming: isFeatureAvailable('discoveryNaming', tier),
      reactions: isFeatureAvailable('reactions', tier),
      moduleCreation: isFeatureAvailable('moduleCreation', tier),
      sovereignty: isFeatureAvailable('sovereignty', tier),
  };
  
  let language: GrowthProfile['language'] = 'full';
  if (tier === 'seed') language = 'simple';
  else if (tier === 'sprout') language = 'curious';
  else if (tier === 'sapling') language = 'direct';
  else if (tier === 'canopy') language = 'peer';
  
  // Simplified for now
  return {
      tier, age, language, features,
      teachingMode: 'peer',
      elementTier: getElementsForTier(tier),
      funFactDepth: 'scientific',
      sentenceLength: 'full',
      uiDensity: 100,
  };
}

export function getElementsForTier(tier: GrowthTier): string[] {
  if (tier === 'seed') return ['H', 'O'];
  if (tier === 'sprout') return ['H', 'C', 'N', 'O'];
  return ['H', 'C', 'N', 'O', 'P', 'Na', 'Ca', 'Cl', 'S', 'Fe'];
}

export function adaptFunFact(baseFact: string, tier: GrowthTier): string {
  if (tier === 'seed') {
      return baseFact.split('.')[0]!;
  }
  return baseFact;
}

export function isFeatureAvailable(feature: keyof GrowthProfile['features'], tier: GrowthTier): boolean {
    const featureTiers: Record<keyof GrowthProfile['features'], GrowthTier[]> = {
        textInput: ['sprout', 'sapling', 'canopy', 'forest'],
        customElements: ['sapling', 'canopy', 'forest'],
        freestyleMode: ['sapling', 'canopy', 'forest'],
        discoveryNaming: ['sprout', 'sapling', 'canopy', 'forest'],
        reactions: ['canopy', 'forest'],
        moduleCreation: ['forest'],
        sovereignty: ['canopy', 'forest'],
    };
    return featureTiers[feature].includes(tier);
}
