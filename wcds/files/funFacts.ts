// src/config/funFacts.ts
// Fun facts shown on molecule completion. One per formula.
// Content: Gemini (Narrator) | QA: Opus (Architect) | March 3, 2026
// Sources verified — see GEMINI_PROMPTS.md for full [V:] citations

export const MOLECULE_FUN_FACTS: Record<string, string> = {
  // ── Seed Mode (🌱) ──
  'H2':       'It\'s the lightest gas in the whole universe, and the giant planet Jupiter is mostly made of it!',
  'O2':       'Fish breathe this too, but they use their gills to filter it right out of the ocean water!',
  'H2O':      'The water you drink is billions of years old. You might literally be drinking recycled dinosaur pee!',
  'H2O2':     'The bombardier beetle shoots a boiling hot spray of this out of its bottom to blast away bugs!',

  // ── Sprout Mode (🌿) ──
  'CO2':      'It\'s the invisible gas that gives your soda those fizzy, tickly bubbles that make you burp!',
  'CH4':      'Cows burp and fart out huge amounts of this invisible gas every single day while digesting their grass!',
  'H3N':      'Ancient Romans actually washed their dirty clothes in aged pee because it\'s full of this strong cleaner!',
  'C6H12O6':  'Your brain is a hungry engine! It gobbles up about half of this sweet sugar in your body!',

  // ── Sapling Mode (🌳) ──
  'ClNa':     'When you run outside, your sweat tastes salty because it has this exact same mineral mixed right in!',
  'CaO':      'Long ago, theaters burned this chalky rock to make a super bright spotlight called "limelight" for the stage!',
  'ClH':      'Your stomach is a pool of this super strong acid. It easily melts down the pizza you ate!',
  'Ca9O24P6': 'This is the Posner molecule — a cage of calcium protecting phosphorus at its core. Your dad named his whole company after it.',

  // ── Bonus molecules (all modes) ──
  'N2':       'Every single time you take a deep breath, most of the air going into your lungs is this!',
  'CO':       'Scientists have found giant, swirling clouds of this invisible gas floating deep in outer space between the stars!',
  'NO':       'Lightning bolts are so incredibly hot they zap the sky and create this gas right out of thin air!',
  'O2S':      'When giant volcanoes erupt, they burp out massive clouds of this gas, which smells exactly like burnt matches!',
  'H2S':      'This tricky invisible gas is the main ingredient that makes your stinkiest farts smell absolutely terrible!',
  'CaCO3':    'If you write with chalk on the sidewalk, you are using the exact same stuff that makes seashells!',
  'NaOH':     'Even though it dissolves grease, bakers use a tiny bit of this slippery stuff to make squishy pretzels!',
  'C2H6O':    'Deep in outer space, there is a giant glowing cloud of this liquid covering billions of miles!',
};

// Helper — safe lookup with fallback
export function getFunFact(hillFormula: string): string | null {
  return MOLECULE_FUN_FACTS[hillFormula] ?? null;
}
