// src/engine/expandedCheckpoints.ts

export interface ExpandedCheckpoint {
  formula: string;          // Hill system (C first, H second, then alpha)
  displayFormula: string;   // Conventional with subscripts
  displayName: string;      // Common name
  category: 'gas' | 'liquid' | 'solid' | 'acid' | 'base' | 'salt' | 'organic' | 'mineral' | 'biological' | 'industrial';
  difficulty: 'seed' | 'sprout' | 'sapling' | 'advanced';
  atomCount: number;        
  funFacts: {
    simple: string;         
    intermediate: string;   
    scientific: string;     
    research: string;       
  };
}

export const expandedCheckpoints: ExpandedCheckpoint[] = [
  // --- GASES (Seed-level) ---
  {
    formula: "H2", displayFormula: "H₂", displayName: "Hydrogen Gas", category: "gas", difficulty: "seed", atomCount: 2,
    funFacts: {
      simple: "This is the lightest gas in the universe! It makes stars shine.",
      intermediate: "Hydrogen gas is highly flammable. It was used in early airships like the Hindenburg.",
      scientific: "H₂ is a diatomic molecule with a single sigma bond formed by the overlap of 1s orbitals.",
      research: "Liquid metallic hydrogen is theorized to exist under extreme pressures, such as in the core of Jupiter, potentially acting as a room-temperature superconductor (Wigner & Huntington, 1935)."
    }
  },
  {
    formula: "O2", displayFormula: "O₂", displayName: "Oxygen Gas", category: "gas", difficulty: "seed", atomCount: 2,
    funFacts: {
      simple: "This is the invisible gas you breathe in every single second!",
      intermediate: "Plants make oxygen for us to breathe, and fires need it to burn.",
      scientific: "O₂ exists as a triplet diradical in its ground state, making it paramagnetic.",
      research: "Singlet oxygen, an excited state of O₂, is highly reactive and plays a key role in photodynamic therapy for destroying cancer cells."
    }
  },
  {
    formula: "N2", displayFormula: "N₂", displayName: "Nitrogen Gas", category: "gas", difficulty: "seed", atomCount: 2,
    funFacts: {
      simple: "Most of the air around you right now is actually nitrogen!",
      intermediate: "Nitrogen gas doesn't react easily, which is why it's pumped into chip bags to keep them fresh.",
      scientific: "N₂ features an incredibly strong triple bond (one sigma, two pi bonds), making it highly inert.",
      research: "The Haber-Bosch process overcomes the high activation energy of the N≡N bond (941 kJ/mol) to synthesize ammonia, a process critical for global agriculture."
    }
  },
  {
    formula: "CO2", displayFormula: "CO₂", displayName: "Carbon Dioxide", category: "gas", difficulty: "seed", atomCount: 3,
    funFacts: {
      simple: "You breathe this out, and plants breathe this in!",
      intermediate: "When frozen, it turns into 'dry ice' that skips the liquid phase and turns right into a gas.",
      scientific: "CO₂ is a linear molecule with sp-hybridized carbon, meaning its bond dipoles cancel out, making it nonpolar.",
      research: "Atmospheric CO₂ absorbs infrared radiation via asymmetric stretching and bending vibrational modes, driving the anthropogenic greenhouse effect."
    }
  },
  {
    formula: "CO", displayFormula: "CO", displayName: "Carbon Monoxide", category: "gas", difficulty: "seed", atomCount: 2,
    funFacts: {
      simple: "This is a dangerous, sneaky gas because you can't see or smell it.",
      intermediate: "It comes from car exhaust and fires, and it stops your blood from carrying oxygen.",
      scientific: "CO is isoelectronic with N₂, featuring a triple bond where oxygen donates a lone pair to carbon via coordinate bonding.",
      research: "CO binds to the iron in hemoglobin with an affinity ~210 times greater than O₂, competitively inhibiting oxygen transport."
    }
  },
  {
    formula: "NO", displayFormula: "NO", displayName: "Nitric Oxide", category: "gas", difficulty: "seed", atomCount: 2,
    funFacts: {
      simple: "This gas helps keep your blood flowing smoothly!",
      intermediate: "It acts as a messenger in your body, telling your blood vessels to relax and open up.",
      scientific: "NO is a free radical with an unpaired electron, making it highly reactive and short-lived in vivo.",
      research: "The discovery of NO as an endothelium-derived relaxing factor (EDRF) earned the 1998 Nobel Prize in Medicine, revolutionizing cardiovascular pharmacology."
    }
  },
  {
    formula: "NO2", displayFormula: "NO₂", displayName: "Nitrogen Dioxide", category: "gas", difficulty: "seed", atomCount: 3,
    funFacts: {
      simple: "This dirty, brown gas makes city smog look gross.",
      intermediate: "It smells sharp and biting, and it can turn into acid rain when it mixes with clouds.",
      scientific: "NO₂ is a paramagnetic, bent molecule (134°) due to localized unpaired electron density on the nitrogen.",
      research: "NO₂ undergoes photolysis in the troposphere (λ < 420 nm) to produce atomic oxygen, which rapidly reacts with O₂ to form ground-level ozone."
    }
  },
  {
    formula: "N2O", displayFormula: "N₂O", displayName: "Laughing Gas", category: "gas", difficulty: "sprout", atomCount: 3,
    funFacts: {
      simple: "Dentists use this to make you giggly and stop your teeth from hurting!",
      intermediate: "Besides medicine, it is used in race cars to make engines go incredibly fast.",
      scientific: "N₂O is a linear, asymmetric molecule (N-N-O) that acts as a potent greenhouse gas and ozone-depleting substance.",
      research: "In the stratosphere, N₂O reacts with excited oxygen atoms O(¹D) to form NO, the primary driver of stratospheric ozone destruction."
    }
  },
  {
    formula: "H2S", displayFormula: "H₂S", displayName: "Hydrogen Sulfide", category: "gas", difficulty: "seed", atomCount: 3,
    funFacts: {
      simple: "Pew! This gas smells exactly like rotten eggs.",
      intermediate: "It naturally bubbles up from hot springs and volcanoes, but it's very toxic to breathe.",
      scientific: "H₂S has a bent geometry similar to water, but less polar, explaining its existence as a gas at room temperature.",
      research: "Endogenously produced H₂S is a critical gasotransmitter in the central nervous and cardiovascular systems, modulating cellular signaling via protein persulfidation."
    }
  },
  {
    formula: "O2S", displayFormula: "SO₂", displayName: "Sulfur Dioxide", category: "gas", difficulty: "seed", atomCount: 3,
    funFacts: {
      simple: "This invisible gas smells like a freshly struck match!",
      intermediate: "Volcanoes burp this out. If it mixes with rain, it creates stinging acid rain.",
      scientific: "SO₂ is a bent molecule with sp² hybridized sulfur, featuring resonance structures between its double bonds.",
      research: "SO₂ aerosols injected into the stratosphere by major volcanic eruptions significantly increase planetary albedo, leading to measurable global cooling events."
    }
  },
  {
    formula: "ClH", displayFormula: "HCl", displayName: "Hydrogen Chloride", category: "gas", difficulty: "seed", atomCount: 2,
    funFacts: {
      simple: "When this gas touches water, it turns into the acid inside your stomach!",
      intermediate: "It is a heavy, sharp-smelling gas that creates dense white fumes when exposed to wet air.",
      scientific: "HCl is a highly polar diatomic gas. Upon dissolution in water, it undergoes nearly complete ionization.",
      research: "Anhydrous HCl is a critical reagent in the semiconductor industry, used for the epitaxial growth of silicon via the reduction of chlorosilanes."
    }
  },
  {
    formula: "H3N", displayFormula: "NH₃", displayName: "Ammonia", category: "gas", difficulty: "seed", atomCount: 4,
    funFacts: {
      simple: "This gas smells exactly like strong window cleaner!",
      intermediate: "Farmers use millions of tons of it to grow food, since plants desperately need nitrogen.",
      scientific: "NH₃ forms a trigonal pyramidal shape due to the lone pair on nitrogen, which also makes it a classic Lewis base.",
      research: "Ammonia inversion occurs at ~24 GHz, a quantum tunneling phenomenon where the nitrogen atom oscillates through the plane of hydrogen atoms, used in the first masers."
    }
  },
  {
    formula: "CH4", displayFormula: "CH₄", displayName: "Methane", category: "gas", difficulty: "seed", atomCount: 5,
    funFacts: {
      simple: "This gas is what you use to cook on a gas stove—and cows burp it out!",
      intermediate: "It is the main ingredient in natural gas, and it's much better at trapping Earth's heat than carbon dioxide.",
      scientific: "Methane is the simplest alkane, forming a perfect tetrahedron with sp³ hybridized carbon and 109.5° bond angles.",
      research: "Methane clathrates (fire ice) trapped in ocean sediments represent an immense, unexploited hydrocarbon reserve, but their destabilization poses severe climate feedback risks."
    }
  },
  {
    formula: "C2H2", displayFormula: "C₂H₂", displayName: "Acetylene", category: "gas", difficulty: "sprout", atomCount: 4,
    funFacts: {
      simple: "This gas burns so hot it can slice right through thick metal!",
      intermediate: "Welders mix it with oxygen to create a blindingly bright flame over 5,000 degrees.",
      scientific: "Acetylene is the simplest alkyne, containing a carbon-carbon triple bond composed of one sigma and two pi bonds.",
      research: "Polyacetylene was the first intrinsically conductive polymer discovered, leading to the 2000 Nobel Prize in Chemistry for Heeger, MacDiarmid, and Shirakawa."
    }
  },
  {
    formula: "C2H4", displayFormula: "C₂H₄", displayName: "Ethylene", category: "gas", difficulty: "sprout", atomCount: 6,
    funFacts: {
      simple: "This invisible gas tells green bananas when to turn yellow and sweet.",
      intermediate: "It is a plant hormone, but we also use it to make most of the plastic in the world.",
      scientific: "Ethylene is the simplest alkene, featuring a planar sp² hybridized structure and restricted rotation around the C=C double bond.",
      research: "Ziegler-Natta catalysts are utilized industrially to polymerize ethylene into high-density polyethylene (HDPE) with high stereoregularity."
    }
  },
  {
    formula: "C2H6", displayFormula: "C₂H₆", displayName: "Ethane", category: "gas", difficulty: "sprout", atomCount: 8,
    funFacts: {
      simple: "This is a simple, invisible gas found deep underground with oil.",
      intermediate: "Factories take ethane and crack it apart to make the plastics used for milk jugs.",
      scientific: "Ethane consists of two methyl groups with relatively free rotation around the C-C single bond, favoring a staggered conformation.",
      research: "Cryogenic distillation of natural gas isolates ethane, serving as the primary petrochemical feedstock for steam cracking facilities globally."
    }
  },

  // --- WATER & SIMPLE COMPOUNDS ---
  {
    formula: "H2O", displayFormula: "H₂O", displayName: "Water", category: "liquid", difficulty: "seed", atomCount: 3,
    funFacts: {
      simple: "You are 60% water. So is a jellyfish!",
      intermediate: "Water is the only substance that naturally exists as solid, liquid, and gas on Earth's surface.",
      scientific: "Water's bent molecular geometry (104.5°) creates a dipole moment that makes it an exceptional solvent — the 'universal solvent' of chemistry.",
      research: "Water's anomalous density maximum at 4°C prevents lakes from freezing solid, enabling aquatic life. Chaplin (2001) catalogued 74 anomalous properties of water — more than any other molecule."
    }
  },
  {
    formula: "H2O2", displayFormula: "H₂O₂", displayName: "Hydrogen Peroxide", category: "liquid", difficulty: "sprout", atomCount: 4,
    funFacts: {
      simple: "This bubbles up on a cut to clean it, and it can turn dark hair blonde!",
      intermediate: "It looks just like water, but the extra oxygen atom makes it a powerful cleaner and rocket fuel.",
      scientific: "H₂O₂ has a non-planar 'open book' structure due to lone pair repulsion on the adjacent oxygen atoms.",
      research: "In biology, catalase enzymes rapidly disproportionate H₂O₂ into H₂O and O₂ to prevent oxidative stress and cellular lipid peroxidation."
    }
  },
  {
    formula: "CaO", displayFormula: "CaO", displayName: "Quicklime", category: "solid", difficulty: "sprout", atomCount: 2,
    funFacts: {
      simple: "When you drop this rock in water, it gets super hot and boils all by itself!",
      intermediate: "Ancient people used it to build huge castles, and theaters used it to make glowing white 'limelight'.",
      scientific: "CaO is an alkaline earth metal oxide that reacts highly exothermically with water to yield calcium hydroxide.",
      research: "The calcination of limestone (CaCO₃) to produce CaO is responsible for ~8% of global anthropogenic CO₂ emissions due to the required thermal decomposition."
    }
  },
  {
    formula: "ClNa", displayFormula: "NaCl", displayName: "Table Salt", category: "salt", difficulty: "seed", atomCount: 2,
    funFacts: {
      simple: "This is what makes your fries taste good!",
      intermediate: "Salt was so valuable in ancient Rome that soldiers were paid with it. That's where the word 'salary' comes from.",
      scientific: "NaCl forms a face-centered cubic crystal lattice where each Na⁺ is surrounded by 6 Cl⁻ ions and vice versa. The lattice energy is 786 kJ/mol.",
      research: "Sodium chloride's role extends beyond seasoning — the Na⁺/K⁺-ATPase pump in every human cell membrane consumes ~30% of basal metabolic energy to maintain the electrochemical gradient essential for neural signaling (Skou, Nobel Prize 1997)."
    }
  },
  {
    formula: "FeO", displayFormula: "FeO", displayName: "Iron(II) Oxide", category: "mineral", difficulty: "sprout", atomCount: 2,
    funFacts: {
      simple: "This black powder is a type of rust that isn't red!",
      intermediate: "It helps give green glass its color and is used in fancy makeup.",
      scientific: "FeO (wüstite) is typically non-stoichiometric, exhibiting a deficiency in iron due to the presence of Fe³⁺ defects.",
      research: "At pressures characteristic of Earth's lower mantle, wüstite undergoes a structural phase transition from the NaCl (B1) phase to a rhombohedral structure."
    }
  },
  {
    formula: "FeS", displayFormula: "FeS", displayName: "Iron Sulfide", category: "mineral", difficulty: "sprout", atomCount: 2,
    funFacts: {
      simple: "This shiny rock is known as 'Fool's Gold' because it tricks miners!",
      intermediate: "If you hit it with steel, it throws off sparks, which is how early muskets fired.",
      scientific: "Iron(II) sulfide is a non-stoichiometric compound that adopts a nickel arsenide crystal structure.",
      research: "The iron-sulfur world hypothesis (Wächtershäuser) proposes that early life originated on the surface of iron sulfide minerals near deep-sea hydrothermal vents."
    }
  },
  {
    formula: "Fe2O3", displayFormula: "Fe₂O₃", displayName: "Rust", category: "mineral", difficulty: "sapling", atomCount: 5,
    funFacts: {
      simple: "This is what makes old cars turn orange and crumble away!",
      intermediate: "It's also what makes the planet Mars look red when you see it in the night sky.",
      scientific: "Hematite (α-Fe₂O₃) is an antiferromagnetic oxide where iron exists in the +3 oxidation state.",
      research: "Nanoparticulate Fe₂O₃ is heavily investigated for use in photoelectrochemical water splitting as a durable, low-cost semiconductor anode."
    }
  },
  {
    formula: "Na2O", displayFormula: "Na₂O", displayName: "Sodium Oxide", category: "base", difficulty: "sprout", atomCount: 3,
    funFacts: {
      simple: "This is an ingredient that helps melt sand into clear glass!",
      intermediate: "If you try to touch it, it will react with the moisture on your skin immediately.",
      scientific: "Na₂O crystallizes in an antifluorite structure where the positions of anions and cations are reversed relative to CaF₂.",
      research: "Sodium oxide's high basicity makes it a critical fluxing agent in the vitrification of commercial silica glass, significantly lowering the melting point."
    }
  },
  {
    formula: "CaCl2", displayFormula: "CaCl₂", displayName: "Calcium Chloride", category: "salt", difficulty: "sprout", atomCount: 3,
    funFacts: {
      simple: "Trucks dump this on icy roads to melt the snow!",
      intermediate: "It absorbs so much water from the air that a solid chunk of it will eventually melt itself into a puddle.",
      scientific: "CaCl₂ is highly hygroscopic and its dissolution in water is strongly exothermic due to the high hydration energy of the Ca²⁺ ion.",
      research: "In molecular biology, CaCl₂ is widely used to prepare competent E. coli cells, promoting plasmid DNA binding to the lipopolysaccharide layer during genetic transformation."
    }
  },
  {
    formula: "HNaO", displayFormula: "NaOH", displayName: "Sodium Hydroxide", category: "base", difficulty: "sprout", atomCount: 3,
    funFacts: {
      simple: "This slick white soap-maker can unclog nasty hair from your drain!",
      intermediate: "It's a super-strong base known as 'lye'—if you get it on your hands, your skin feels slippery because it's turning your oils into soap.",
      scientific: "NaOH completely dissociates in water, making it a strong Arrhenius and Brønsted-Lowry base.",
      research: "NaOH is fundamental to the Kraft process for pulping wood, where it cleaves ester bonds in lignin to separate cellulose fibers for paper production."
    }
  },
  {
    formula: "CaH2O2", displayFormula: "Ca(OH)₂", displayName: "Slaked Lime", category: "base", difficulty: "sapling", atomCount: 5,
    funFacts: {
      simple: "Farmers sprinkle this white powder on dirt to help plants grow!",
      intermediate: "Mix it with sand and water, and you get the mortar that holds brick walls together.",
      scientific: "Ca(OH)₂ has moderate water solubility that inversely correlates with temperature, forming a basic suspension known as milk of lime.",
      research: "In endodontics, Ca(OH)₂ pastes are utilized as intracanal medicaments due to their sustained high pH (~12.5), which effectively exerts antimicrobial action against E. faecalis."
    }
  },

  // --- ACIDS ---
  {
    formula: "HNO3", displayFormula: "HNO₃", displayName: "Nitric Acid", category: "acid", difficulty: "sapling", atomCount: 5,
    funFacts: {
      simple: "This super strong acid can melt pure copper coins!",
      intermediate: "When it reacts with metal, it burps out a creepy, toxic orange gas.",
      scientific: "HNO₃ is a strong oxidizing acid. Only metals with high standard reduction potentials (like Au and Pt) can resist it without a halogen additive.",
      research: "Nitric acid plays a pivotal role in the production of ammonium nitrate fertilizers and is an essential reagent in electrophilic aromatic nitration for synthesizing explosives."
    }
  },
  {
    formula: "H2O4S", displayFormula: "H₂SO₄", displayName: "Sulfuric Acid", category: "acid", difficulty: "sapling", atomCount: 7,
    funFacts: {
      simple: "This scary acid is inside car batteries and can turn sugar into a black snake!",
      intermediate: "It loves water so much it will rip hydrogen and oxygen right out of organic things to make it.",
      scientific: "H₂SO₄ is a diprotic strong acid and an extreme dehydrating agent, turning carbohydrates into elemental carbon via exothermic dehydration.",
      research: "Sulfuric acid is produced on a larger scale than any other industrial chemical, heavily utilized in the wet method for phosphoric acid production."
    }
  },
  {
    formula: "H3O4P", displayFormula: "H₃PO₄", displayName: "Phosphoric Acid", category: "acid", difficulty: "sapling", atomCount: 8,
    funFacts: {
      simple: "This acid is actually what gives dark sodas their tangy bite!",
      intermediate: "It removes rust easily, but drinking too much of it can weaken your bones over time.",
      scientific: "H₃PO₄ is a weak triprotic acid, resulting in three distinct pKa values that make its salts excellent biological buffers.",
      research: "Phosphate derivatives of H₃PO₄ form the structural backbone of nucleic acids (DNA/RNA) via phosphodiester bonds, representing the fundamental linkage of genetic inheritance."
    }
  },
  {
    formula: "CH2O3", displayFormula: "H₂CO₃", displayName: "Carbonic Acid", category: "acid", difficulty: "sprout", atomCount: 6,
    funFacts: {
      simple: "This tiny acid makes your fizzy drinks bubble on your tongue!",
      intermediate: "It's made when carbon dioxide mixes with water, and it's what creates giant underground caves.",
      scientific: "H₂CO₃ is unstable in standard conditions, existing primarily in equilibrium with dissolved CO₂.",
      research: "The accelerated formation of carbonic acid in the oceans due to anthropogenic CO₂ is lowering global seawater pH, severely impairing the calcification processes of marine organisms."
    }
  },
  {
    formula: "CH2O2", displayFormula: "CH₂O₂", displayName: "Formic Acid", category: "acid", difficulty: "sprout", atomCount: 5,
    funFacts: {
      simple: "When an ant bites you, it squirts this acid to make it sting!",
      intermediate: "Its name literally comes from 'formica', the Latin word for ant.",
      scientific: "Formic acid is the simplest carboxylic acid. Its lack of an alkyl group makes it significantly more acidic than acetic acid.",
      research: "Formic acid is being investigated as a high-capacity hydrogen storage material for fuel cells, capable of undergoing dehydrogenation over palladium catalysts at room temperature."
    }
  },
  {
    formula: "C2H4O2", displayFormula: "C₂H₄O₂", displayName: "Acetic Acid", category: "acid", difficulty: "sprout", atomCount: 8,
    funFacts: {
      simple: "This is the sharp, sour stuff that makes vinegar smell like vinegar!",
      intermediate: "If you freeze it, it turns into shiny crystals that look like ice, called 'glacial' acetic acid.",
      scientific: "Acetic acid forms stable dimers in the vapor phase due to strong intermolecular hydrogen bonding between the carboxylic acid groups.",
      research: "Acetyl-CoA, a vital derivative of acetic acid, is the central metabolic intermediate bridging glycolysis with the citric acid cycle in cellular respiration."
    }
  },

  // --- ORGANIC ---
  {
    formula: "CH2O", displayFormula: "CH₂O", displayName: "Formaldehyde", category: "organic", difficulty: "sprout", atomCount: 4,
    funFacts: {
      simple: "This stinky chemical is used to preserve dead bugs and frogs in jars!",
      intermediate: "It is a clear gas that factories use to make tough plastic glues for wood.",
      scientific: "Formaldehyde is the simplest aldehyde. The carbonyl group renders the carbon highly electrophilic.",
      research: "Endogenous formaldehyde is produced during cellular metabolism but is strictly regulated and detoxified by alcohol dehydrogenase 5 (ADH5) due to its potent DNA-crosslinking genotoxicity."
    }
  },
  {
    formula: "CH4O", displayFormula: "CH₄O", displayName: "Methanol", category: "organic", difficulty: "sprout", atomCount: 6,
    funFacts: {
      simple: "This is 'wood alcohol' and racing cars use it as rocket-fast fuel.",
      intermediate: "It looks like normal alcohol, but drinking even a tiny bit can make you go blind!",
      scientific: "Methanol is the simplest aliphatic alcohol and is highly toxic because alcohol dehydrogenase converts it into formaldehyde and formic acid.",
      research: "The direct electrochemical oxidation of methanol in Direct Methanol Fuel Cells (DMFCs) is a major area of research for portable power, though limited by Pt anode poisoning via CO intermediates."
    }
  },
  {
    formula: "C2H6O", displayFormula: "C₂H₆O", displayName: "Ethanol", category: "organic", difficulty: "sprout", atomCount: 9,
    funFacts: {
      simple: "This is the alcohol in hand sanitizer that kills germs instantly.",
      intermediate: "Yeast makes this alcohol when it eats sugar. We mix it into car gasoline to save oil.",
      scientific: "Ethanol features a hydrophilic hydroxyl group and a lipophilic ethyl group, making it an amphiphilic solvent.",
      research: "Ethanol acts as an allosteric modulator of GABA_A receptors in the central nervous system, enhancing inhibitory neurotransmission while concurrently antagonizing excitatory NMDA receptors."
    }
  },
  {
    formula: "C3H8O", displayFormula: "C₃H₈O", displayName: "Isopropanol", category: "organic", difficulty: "sapling", atomCount: 12,
    funFacts: {
      simple: "This is rubbing alcohol! It feels icy cold when you rub it on your skin.",
      intermediate: "It cools you down fast because it turns into a gas and floats away much quicker than water.",
      scientific: "Isopropanol is a secondary alcohol. Its rapid evaporation rate and ability to dissolve non-polar residues makes it a superior electronics cleaner.",
      research: "The oxidation of isopropanol yields acetone, a classic textbook demonstration of secondary alcohol oxidation utilizing chromic acid (Jones reagent)."
    }
  },
  {
    formula: "C3H6O", displayFormula: "C₃H₆O", displayName: "Acetone", category: "organic", difficulty: "sapling", atomCount: 10,
    funFacts: {
      simple: "This strong-smelling liquid melts nail polish right off your fingers!",
      intermediate: "It is an amazing solvent, meaning it can dissolve superglue, paint, and Styrofoam instantly.",
      scientific: "Acetone is the simplest ketone. It exhibits keto-enol tautomerism, existing primarily in the keto form.",
      research: "During severe diabetic ketoacidosis, physiological beta-oxidation of fatty acids exceeds the capacity of the citric acid cycle, leading to the pathologic accumulation of acetone and other ketone bodies."
    }
  },
  {
    formula: "C6H12O6", displayFormula: "C₆H₁₂O₆", displayName: "Glucose", category: "biological", difficulty: "advanced", atomCount: 24,
    funFacts: {
      simple: "This is pure sugar energy! Your brain needs it right now to keep reading.",
      intermediate: "Plants make this sugar out of sunlight, air, and water during photosynthesis.",
      scientific: "Glucose is an aldohexose that predominantly forms a six-membered pyranose ring in aqueous solution via an intramolecular hemiacetal linkage.",
      research: "Glycolysis breaks down one molecule of glucose into two molecules of pyruvate, generating a net yield of 2 ATP and 2 NADH, serving as the universal biochemical energy pathway across terrestrial life."
    }
  },
  {
    formula: "C2H6OS", displayFormula: "C₂H₆OS", displayName: "DMSO", category: "organic", difficulty: "advanced", atomCount: 10,
    funFacts: {
      simple: "If you rub this liquid on your skin, you will taste garlic in your mouth!",
      intermediate: "It acts like a magic doorway, sneaking itself and other medicines straight through your skin and into your blood.",
      scientific: "Dimethyl sulfoxide is a highly polar aprotic solvent capable of dissolving both polar and non-polar compounds.",
      research: "DMSO penetrates biological membranes efficiently without damaging them, making it the primary cryoprotectant for freezing stem cells and organoids, preventing intracellular ice crystal formation."
    }
  },

  // --- BIOLOGICAL / POSNER ---
  {
    formula: "CH4N2O", displayFormula: "CO(NH₂)₂", displayName: "Urea", category: "biological", difficulty: "sapling", atomCount: 8,
    funFacts: {
      simple: "Your body turns waste into this chemical so you can pee it out safely!",
      intermediate: "It was the very first chemical from a living body to be made in a lab, proving life obeys chemistry.",
      scientific: "Urea consists of two amine groups attached to a carbonyl carbon, making it a diamide of carbonic acid.",
      research: "Friedrich Wöhler's 1828 synthesis of urea from ammonium cyanate struck a fatal blow to the doctrine of vitalism, effectively launching the field of organic chemistry."
    }
  },
  {
    formula: "C5H5N5", displayFormula: "C₅H₅N₅", displayName: "Adenine", category: "biological", difficulty: "advanced", atomCount: 15,
    funFacts: {
      simple: "This is a piece of the DNA alphabet that spells out how to build YOU.",
      intermediate: "It pairs up with another molecule to create the twisted ladder shape of your DNA.",
      scientific: "Adenine is a purine nucleobase that pairs exclusively with thymine (in DNA) or uracil (in RNA) via two complementary hydrogen bonds.",
      research: "Adenine forms the core of ATP (adenosine triphosphate) and the coenzymes NAD and FAD, inextricably linking genetic coding architecture with fundamental cellular energetics."
    }
  },
  {
    formula: "Ca3O8P2", displayFormula: "Ca₃(PO₄)₂", displayName: "Tricalcium Phosphate", category: "mineral", difficulty: "advanced", atomCount: 13,
    funFacts: {
      simple: "This tough stuff is what makes cow bones white and hard.",
      intermediate: "You can find it mixed into some breakfast cereals to give you extra calcium.",
      scientific: "Tricalcium phosphate is highly insoluble in water but readily dissolves in dilute acids, a property crucial for osteoclast-mediated bone resorption.",
      research: "Beta-TCP is extensively used in synthetic bone grafts due to its excellent osteoconductivity and targeted bioresorbability, allowing gradual replacement by natural Haversian bone."
    }
  },
  {
    formula: "Ca5HO13P3", displayFormula: "Ca₅(PO₄)₃OH", displayName: "Hydroxyapatite", category: "biological", difficulty: "advanced", atomCount: 22,
    funFacts: {
      simple: "This is the hardest stuff in your body—the shiny white enamel on your teeth!",
      intermediate: "Fluoride from toothpaste replaces a part of this molecule, making your teeth invincible to sugar bugs.",
      scientific: "Hydroxyapatite forms hexagonal crystals. Substituting the hydroxide ion with fluoride produces fluorapatite, which is significantly more resistant to acidic dissolution.",
      research: "In vivo, bone mineral is a structurally disordered, carbonate-substituted hydroxyapatite (dahllite). Nanoscale confinement of these crystals within collagen fibrils is responsible for the composite toughness of the skeletal system."
    }
  },
  {
    formula: "Ca9O24P6", displayFormula: "Ca₉(PO₄)₆", displayName: "Posner Molecule", category: "biological", difficulty: "advanced", atomCount: 39,
    funFacts: {
      simple: "This special molecule might help your brain think!",
      intermediate: "Scientists think this molecule could store quantum information inside your brain for over a minute.",
      scientific: "Matthew Fisher proposed in 2015 that Posner molecules protect phosphorus-31 nuclear spin states from decoherence, potentially enabling quantum processing in biological neural networks.",
      research: "Fisher's hypothesis (Annals of Physics, 2015) posits that ³¹P nuclear spins in Ca₉(PO₄)₆ clusters maintain quantum coherence for ~10⁵ seconds via the molecule's high symmetry group (S₆). Swift et al. (2018) provided supporting evidence through ab initio molecular dynamics simulations showing Posner cluster stability in aqueous solution."
    }
  },
  {
    formula: "CaHO4P", displayFormula: "CaHPO₄", displayName: "Dicalcium Phosphate", category: "mineral", difficulty: "sapling", atomCount: 7,
    funFacts: {
      simple: "This soft rock is mashed into toothpaste to help scrub your teeth clean.",
      intermediate: "It doesn't dissolve in water easily, so it acts like microscopic sandpaper for plaque.",
      scientific: "Dicalcium phosphate exists primarily as a dihydrate (brushite) and is used as a dietary supplement and excipient in pharmaceutical tableting.",
      research: "Brushite is often the initial precipitating phase during physiological and pathological biomineralization, serving as a kinetically favored precursor to thermodynamically stable hydroxyapatite."
    }
  },

  // --- INDUSTRIAL / MINERALS / FUN ONES ---
  {
    formula: "CCaO3", displayFormula: "CaCO₃", displayName: "Limestone", category: "mineral", difficulty: "sapling", atomCount: 5,
    funFacts: {
      simple: "Chalk, seashells, and pearls are all made of this molecule!",
      intermediate: "If you drop acid on this rock, it fizzes violently as it releases carbon dioxide gas.",
      scientific: "Calcium carbonate exists in two primary polymorphs: calcite (thermodynamically stable) and aragonite (formed by marine life).",
      research: "Ocean acidification reduces the saturation state of aragonite, critically endangering pteropods and coral reefs that depend on CaCO₃ supersaturation to build their protective exoskeletons."
    }
  },
  {
    formula: "CNa2O3", displayFormula: "Na₂CO₃", displayName: "Washing Soda", category: "industrial", difficulty: "sapling", atomCount: 6,
    funFacts: {
      simple: "Before modern soap, people washed dirty clothes with this chemical!",
      intermediate: "It makes hard water 'soft' by grabbing onto calcium, letting soap do its job better.",
      scientific: "Sodium carbonate is the sodium salt of carbonic acid. It creates a strongly alkaline solution upon hydrolysis.",
      research: "The Solvay process produces Na₂CO₃ from NaCl and CaCO₃ via ammonia mediation, a triumph of 19th-century chemical engineering that dramatically reduced alkali costs."
    }
  },
  {
    formula: "CHNaO3", displayFormula: "NaHCO₃", displayName: "Baking Soda", category: "salt", difficulty: "sapling", atomCount: 6,
    funFacts: {
      simple: "Mix this with vinegar, and you get a bubbling science fair volcano!",
      intermediate: "In the oven, heat breaks it apart to release gas, making cookies and cakes puff up.",
      scientific: "Sodium bicarbonate is an amphoteric compound, meaning it can act as both an acid and a base depending on the environment.",
      research: "Intravenous sodium bicarbonate is administered clinically to correct severe metabolic acidosis, buffering excess circulating hydrogen ions by driving the bicarbonate equilibrium toward CO₂."
    }
  },
  {
    formula: "FeO4S", displayFormula: "FeSO₄", displayName: "Iron(II) Sulfate", category: "mineral", difficulty: "sapling", atomCount: 6,
    funFacts: {
      simple: "If you swallow a magnetic iron pill, it's actually made of this!",
      intermediate: "Doctors give this to people whose blood needs more iron to stay healthy and energetic.",
      scientific: "Iron(II) sulfate is a reducing agent that slowly oxidizes in moist air to form basic iron(III) sulfate.",
      research: "FeSO₄ is critical in water treatment as a flocculant, and historically it was combined with gallotannic acid to create iron gall ink, the standard writing ink of Europe for over a millennium."
    }
  },
  {
    formula: "CaO4S", displayFormula: "CaSO₄", displayName: "Gypsum", category: "mineral", difficulty: "sapling", atomCount: 6,
    funFacts: {
      simple: "The chalky drywall that builds the walls of your house is made of this.",
      intermediate: "When artists make casts for broken arms, they use a dried-out version of this called Plaster of Paris.",
      scientific: "Calcium sulfate is a naturally occurring mineral. Heating the dihydrate yields the hemihydrate (Plaster of Paris).",
      research: "Gypsum's remarkably low thermal conductivity makes drywall intrinsically fire-resistant. In a fire, the endothermic vaporization of the hydration water prevents the structural temperature from exceeding 100°C until fully calcined."
    }
  },
  {
    formula: "ClNaO", displayFormula: "NaClO", displayName: "Bleach", category: "industrial", difficulty: "sprout", atomCount: 3,
    funFacts: {
      simple: "This destroys the colors in clothes and kills germs in the bathroom.",
      intermediate: "Never mix this with other cleaners! It will trap you in a cloud of poison gas.",
      scientific: "Sodium hypochlorite is an extremely powerful oxidizer. The hypochlorite anion readily attacks the conjugated double bonds of chromophores, turning them colorless.",
      research: "In endodontic therapy, 5.25% NaClO is the gold-standard irrigant due to its dual capacity to aggressively dissolve necrotic pulpal tissue and obliterate multispecies bacterial biofilms."
    }
  },
  {
    formula: "CS2", displayFormula: "CS₂", displayName: "Carbon Disulfide", category: "liquid", difficulty: "sapling", atomCount: 3,
    funFacts: {
      simple: "This liquid smells like rotten radishes and catches fire super easily.",
      intermediate: "It looks like water but feels incredibly heavy. It's used to make fake silk clothing.",
      scientific: "CS₂ is a linear, nonpolar molecule analogous to CO₂, but highly volatile and neurotoxic.",
      research: "Chronic occupational exposure to CS₂ during viscose rayon manufacturing is definitively linked to severe polyneuropathy and accelerated atherosclerosis via protein crosslinking."
    }
  },
  {
    formula: "CCl4", displayFormula: "CCl₄", displayName: "Carbon Tetrachloride", category: "liquid", difficulty: "sapling", atomCount: 5,
    funFacts: {
      simple: "People used to put this heavy liquid in glass grenades to throw at fires!",
      intermediate: "It stopped fires instantly but was banned because it poisoned the air and ruined the ozone layer.",
      scientific: "CCl₄ is a nonpolar tetrahedral molecule. Despite polar C-Cl bonds, the molecular symmetry perfectly cancels the net dipole.",
      research: "CCl₄ undergoes homolytic cleavage upon UV irradiation, generating trichloromethyl and chlorine radicals that aggressively catalyze the destruction of stratospheric ozone."
    }
  },
  {
    formula: "H3P", displayFormula: "PH₃", displayName: "Phosphine", category: "gas", difficulty: "sprout", atomCount: 4,
    funFacts: {
      simple: "This spooky 'swamp gas' makes eerie floating lights in marshes.",
      intermediate: "It smells like rotting fish and is extremely poisonous.",
      scientific: "Phosphine is a trigonal pyramidal molecule similar to ammonia but with much weaker hydrogen bonding, making it highly volatile.",
      research: "The detection of PH₃ in the atmosphere of Venus via ALMA in 2020 sparked massive debate, as no known abiotic chemical pathway on terrestrial planets can produce phosphine in such quantities."
    }
  },
  // Continuing additional compounds strictly formatted to hit 80+
  {
    formula: "O3S", displayFormula: "SO₃", displayName: "Sulfur Trioxide", category: "gas", difficulty: "sapling", atomCount: 4,
    funFacts: {
      simple: "This gas looks like smoke and makes super strong acid when it hits water.",
      intermediate: "It's the main ingredient in acid rain, causing statues to slowly melt away over time.",
      scientific: "SO₃ is a trigonal planar molecule with zero dipole moment, though it behaves as an extreme Lewis acid.",
      research: "In the contact process, SO₃ is absorbed into concentrated H₂SO₄ to form oleum (H₂S₂O₇) to prevent the uncontrollable exothermic misting that occurs if SO₃ contacts water directly."
    }
  },
  {
    formula: "Na2S", displayFormula: "Na₂S", displayName: "Sodium Sulfide", category: "salt", difficulty: "sapling", atomCount: 3,
    funFacts: {
      simple: "This salty rock smells exactly like stinky sulfur hot springs.",
      intermediate: "Factories use it to cleanly pull the hair off of animal leather.",
      scientific: "Na₂S crystallizes in an antifluorite lattice. In solution, it heavily hydrolyzes to yield a strongly basic, rotten-egg smelling solution.",
      research: "Sodium sulfide is a crucial reagent in the Kraft process, responsible for cleaving ether linkages in lignin to decouple it from cellulose."
    }
  },
  {
    formula: "P4", displayFormula: "P₄", displayName: "White Phosphorus", category: "solid", difficulty: "sprout", atomCount: 4,
    funFacts: {
      simple: "This glowing rock catches fire all by itself if it touches the air!",
      intermediate: "It has to be kept deep underwater so it doesn't burn down the laboratory.",
      scientific: "P₄ consists of four phosphorus atoms in a highly strained tetrahedral geometry, making the bonds exceptionally weak and reactive.",
      research: "White phosphorus causes severe necrosis upon skin contact. Due to its lipid solubility, systemic absorption causes rapid hepatic failure and multi-organ toxicity."
    }
  },
  {
    formula: "O10P4", displayFormula: "P₄O₁₀", displayName: "Phosphorus Pentoxide", category: "solid", difficulty: "advanced", atomCount: 14,
    funFacts: {
      simple: "This fluffy white powder hates water more than anything else.",
      intermediate: "If you drop water on it, it violently steals the liquid and turns into acid.",
      scientific: "P₄O₁₀ is the anhydride of phosphoric acid and acts as one of the most powerful known dehydrating agents.",
      research: "P₄O₁₀ will aggressively dehydrate primary amides to nitriles and can forcefully extract water from pure H₂SO₄ to yield highly unstable SO₃."
    }
  },
  {
    formula: "Cl3P", displayFormula: "PCl₃", displayName: "Phosphorus Trichloride", category: "liquid", difficulty: "sapling", atomCount: 4,
    funFacts: {
      simple: "This smoking liquid is used to build heavy-duty farm chemicals.",
      intermediate: "It looks yellow and boils into a cloud of biting, sour fog.",
      scientific: "PCl₃ is a toxic, trigonal pyramidal liquid that reacts violently with water to form phosphorous acid (H₃PO₃) and HCl.",
      research: "It is an essential electrophilic phosphorus source in organic synthesis, used globally to manufacture organophosphate pesticides and flame retardants."
    }
  },
  {
    formula: "Cl5P", displayFormula: "PCl₅", displayName: "Phosphorus Pentachloride", category: "solid", difficulty: "sapling", atomCount: 6,
    funFacts: {
      simple: "This pale yellow powder gives up its chlorine really easily.",
      intermediate: "Chemists use it to swap out oxygen atoms for chlorine atoms when building molecules.",
      scientific: "In the gas phase, PCl₅ is a trigonal bipyramidal molecule. In the solid state, it exists as an ionic crystal: [PCl₄]⁺[PCl₆]⁻.",
      research: "PCl₅ acts as a potent chlorinating agent in organic chemistry, reliably converting carboxylic acids into acyl chlorides."
    }
  },
  {
    formula: "Cl2S", displayFormula: "SCl₂", displayName: "Sulfur Dichloride", category: "liquid", difficulty: "advanced", atomCount: 3,
    funFacts: {
      simple: "This cherry-red liquid smells bad and burns your nose.",
      intermediate: "It was used a long time ago to make dangerous chemical weapons for the military.",
      scientific: "SCl₂ is a bent molecule (C2v symmetry) that serves as an excellent electrophilic sulfur transfer agent.",
      research: "During World War I, SCl₂ was rapidly reacted with ethylene gas to synthesize mustard gas (bis(2-chloroethyl) sulfide), a devastating blistering agent."
    }
  },
  {
    formula: "Cl2Fe", displayFormula: "FeCl₂", displayName: "Iron(II) Chloride", category: "salt", difficulty: "sapling", atomCount: 3,
    funFacts: {
      simple: "This light green crystal turns dark brown if you leave it out in the air.",
      intermediate: "It is a rusty type of salt that factories use to dye fabrics.",
      scientific: "FeCl₂ is a high-spin d6 complex that is highly soluble in water, forming a pale green tetrahydrate.",
      research: "In the laboratory, ferrous chloride is a standard precursor for synthesizing ferrocene via reaction with cyclopentadienyl anions."
    }
  },
  {
    formula: "Cl3Fe", displayFormula: "FeCl₃", displayName: "Iron(III) Chloride", category: "salt", difficulty: "sapling", atomCount: 4,
    funFacts: {
      simple: "People use this dark orange sludge to eat copper off circuit boards.",
      intermediate: "It stops bleeding incredibly fast, so veterinarians put it on dog nails if they get cut too short.",
      scientific: "FeCl₃ is a fairly strong Lewis acid that exists as the dimer Fe₂Cl₆ in the gas phase.",
      research: "In organic synthesis, anhydrous FeCl₃ serves as a catalytic Lewis acid for the Friedel-Crafts alkylation and acylation of aromatic rings."
    }
  },
  {
    formula: "Fe3O4", displayFormula: "Fe₃O₄", displayName: "Magnetite", category: "mineral", difficulty: "sapling", atomCount: 7,
    funFacts: {
      simple: "This dark rock is completely naturally magnetic!",
      intermediate: "Pigeons have tiny pieces of this in their brains so they can feel Earth's magnetic north.",
      scientific: "Magnetite is a ferrimagnetic mixed-valence mineral, containing both Fe²⁺ and Fe³⁺ in an inverse spinel lattice.",
      research: "Magnetotactic bacteria biomineralize exquisite chains of single-domain Fe₃O₄ magnetosomes, using them to navigate chemical gradients along geomagnetic field lines."
    }
  },
  {
    formula: "HNa", displayFormula: "NaH", displayName: "Sodium Hydride", category: "salt", difficulty: "sapling", atomCount: 2,
    funFacts: {
      simple: "This gray powder holds onto hydrogen gas incredibly tightly.",
      intermediate: "If it touches even a drop of water, it bursts into hot flames instantly.",
      scientific: "NaH is a saline (ionic) hydride featuring an H⁻ anion. It acts as a powerful, non-nucleophilic base.",
      research: "In organic synthesis, NaH irreversibly deprotonates alcohols, phenols, and amides, evolving H₂ gas as a stable driving force."
    }
  },
  {
    formula: "CaH2", displayFormula: "CaH₂", displayName: "Calcium Hydride", category: "salt", difficulty: "sapling", atomCount: 3,
    funFacts: {
      simple: "Hikers use this powder to heat up emergency soup in the woods.",
      intermediate: "It safely traps hydrogen until you mix it with water, making it puff out hydrogen gas and heat.",
      scientific: "CaH₂ reacts smoothly with water to generate hydrogen gas and Ca(OH)₂, making it an excellent chemical desiccant.",
      research: "CaH₂ is preferred over sodium or potassium metals for drying amines and alcohols because its basicity is strong enough to destroy water but mild enough to prevent side reactions."
    }
  },
  {
    formula: "CHN", displayFormula: "HCN", displayName: "Hydrogen Cyanide", category: "gas", difficulty: "sapling", atomCount: 3,
    funFacts: {
      simple: "This deadly gas smells exactly like bitter almonds.",
      intermediate: "Apple seeds contain tiny amounts of this, but not nearly enough to hurt you.",
      scientific: "HCN is a highly toxic linear molecule that dissociates into a cyanide anion, which binds relentlessly to metalloproteins.",
      research: "Cyanide induces rapid cellular hypoxia by binding non-competitively to the ferric (Fe³⁺) ion in cytochrome c oxidase, uncoupling mitochondrial oxidative phosphorylation."
    }
  },
  {
    formula: "C2N2", displayFormula: "C₂N₂", displayName: "Cyanogen", category: "gas", difficulty: "advanced", atomCount: 4,
    funFacts: {
      simple: "This gas burns with a wildly hot, hot pink flame.",
      intermediate: "It smells like roasted almonds but hurts your eyes and lungs if you get near it.",
      scientific: "Cyanogen is a pseudohalogen composed of two linearly linked cyanide radicals (N≡C-C≡N).",
      research: "When cyanogen burns in pure oxygen, it generates the second hottest known chemical flame at 4,525 °C, trailing only dicyanoacetylene."
    }
  },
  {
    formula: "CH5N", displayFormula: "CH₅N", displayName: "Methylamine", category: "organic", difficulty: "sapling", atomCount: 7,
    funFacts: {
      simple: "This chemical smells like dead, rotting fish left in the sun.",
      intermediate: "Even though it stinks, scientists use it to make important medicines for humans.",
      scientific: "Methylamine is the simplest primary amine. Its nitrogen lone pair makes it a potent nucleophile and Brønsted base.",
      research: "Methylamine serves as a critical synthetic precursor for a wide range of pharmaceuticals, including ephedrine and the solvent N-methyl-2-pyrrolidone (NMP)."
    }
  },
  {
    formula: "C2H7N", displayFormula: "C₂H₇N", displayName: "Ethylamine", category: "organic", difficulty: "sapling", atomCount: 10,
    funFacts: {
      simple: "Like its cousin, this also smells exactly like ammonia and fish mixed together.",
      intermediate: "Factories use this clear liquid to weave rubber into car tires.",
      scientific: "Ethylamine is a primary aliphatic amine that is miscible with water, forming strongly alkaline solutions.",
      research: "It is widely utilized as a chemical intermediate in the manufacture of triazine herbicides and rubber vulcanization accelerators."
    }
  },
  {
    formula: "C6H6", displayFormula: "C₆H₆", displayName: "Benzene", category: "organic", difficulty: "sapling", atomCount: 12,
    funFacts: {
      simple: "This ring-shaped molecule is hidden in gasoline and makes it smell sweet.",
      intermediate: "It is incredibly stable because its electrons race around in a perfect circle forever.",
      scientific: "Benzene is the quintessential aromatic hydrocarbon, characterized by a planar hexagonal ring of sp² hybridized carbons and a delocalized pi-electron cloud.",
      research: "Chronic exposure to benzene is strictly regulated due to its potent hematotoxicity. Hepatic oxidation of benzene forms highly reactive quinones that intercalate and damage bone marrow DNA."
    }
  },
  {
    formula: "C6H6O", displayFormula: "C₆H₅OH", displayName: "Phenol", category: "organic", difficulty: "sapling", atomCount: 13,
    funFacts: {
      simple: "This weird chemical was the very first tool doctors used to kill hospital germs.",
      intermediate: "It acts like an acid but looks like a crystal. If you touch it, your skin goes completely numb.",
      scientific: "Phenol is an aromatic alcohol. It is significantly more acidic than aliphatic alcohols due to resonance stabilization of the phenoxide anion.",
      research: "Historically introduced as 'carbolic acid' by Joseph Lister, phenol revolutionized modern surgery by drastically reducing postoperative sepsis via protein denaturation of bacteria."
    }
  },
  {
    formula: "C4H10", displayFormula: "C₄H₁₀", displayName: "Butane", category: "organic", difficulty: "sprout", atomCount: 14,
    funFacts: {
      simple: "The clear liquid sloshing around inside a pocket lighter is actually this gas squeezed tight.",
      intermediate: "As soon as you push the lighter button, the liquid escapes into the air as a highly flammable gas.",
      scientific: "Butane is an alkane that easily liquefies under mild pressure, making it an ideal propellant and portable fuel.",
      research: "Isobutane (2-methylpropane), an isomer of butane, is widely utilized as a halogen-free refrigerant (R-600a) due to its negligible ozone depletion and low global warming potentials."
    }
  },
  {
    formula: "C5H12", displayFormula: "C₅H₁₂", displayName: "Pentane", category: "organic", difficulty: "sprout", atomCount: 17,
    funFacts: {
      simple: "This invisible fluid evaporates from your hand so fast it feels freezing cold.",
      intermediate: "It boils into a vapor on a hot summer day without even needing a stove.",
      scientific: "Pentane is one of the most volatile liquid alkanes at room temperature due to its weak London dispersion forces.",
      research: "In the laboratory, pentane is utilized as a non-polar solvent and as a working fluid in organic Rankine cycle power plants for recovering low-grade geothermal heat."
    }
  },
  {
    formula: "C4H8", displayFormula: "C₄H₈", displayName: "Butene", category: "organic", difficulty: "sprout", atomCount: 12,
    funFacts: {
      simple: "This slightly sweet gas is used to make thick, stretchy rubber.",
      intermediate: "It helps create the artificial rubber used in basketballs and tough tires.",
      scientific: "Butene comprises a family of four isomeric alkenes (1-butene, cis-2-butene, trans-2-butene, and isobutylene).",
      research: "Polyisobutylene, polymerized from isobutylene, is exceptionally impermeable to gases, making it the globally preferred material for inner tubes and pharmaceutical seals."
    }
  },
  {
    formula: "C8H18", displayFormula: "C₈H₁₈", displayName: "Octane", category: "organic", difficulty: "sprout", atomCount: 26,
    funFacts: {
      simple: "This is the king of gasoline! High octane means your car's engine runs beautifully.",
      intermediate: "It resists exploding too early inside the hot engine block, keeping the car smooth.",
      scientific: "Isooctane (2,2,4-trimethylpentane) is the standard reference fuel, assigned an octane rating of exactly 100.",
      research: "The highly branched structure of isooctane prevents autoignition under compression, mitigating engine 'knocking' caused by premature, explosive detonation of the fuel-air mixture."
    }
  },
  {
    formula: "CH3Cl", displayFormula: "CH₃Cl", displayName: "Chloromethane", category: "organic", difficulty: "sapling", atomCount: 5,
    funFacts: {
      simple: "Ocean algae make millions of tons of this sweet-smelling gas naturally.",
      intermediate: "We used to use it in refrigerators, but it was too dangerous if it leaked.",
      scientific: "Chloromethane is a haloalkane and the most abundant natural organohalogen in the atmosphere.",
      research: "Atmospheric CH₃Cl acts as the primary natural source of ozone-depleting chlorine radicals in the stratosphere, maintaining the baseline equilibrium of the ozone layer."
    }
  },
  {
    formula: "CH2Cl2", displayFormula: "CH₂Cl₂", displayName: "Dichloromethane", category: "organic", difficulty: "sapling", atomCount: 5,
    funFacts: {
      simple: "This heavy liquid bubbles violently and is used to melt caffeine out of coffee beans.",
      intermediate: "It makes decaf coffee! It strips out the jittery caffeine but leaves the flavor.",
      scientific: "DCM is a widely used, moderately polar organochloride solvent characterized by its extreme volatility.",
      research: "While highly effective in synthetic extractions, DCM is metabolically converted to carbon monoxide in humans via the cytochrome P450 pathway, resulting in delayed carboxyhemoglobinemia."
    }
  },
  {
    formula: "CHCl3", displayFormula: "CHCl₃", displayName: "Chloroform", category: "organic", difficulty: "sapling", atomCount: 5,
    funFacts: {
      simple: "A long time ago, doctors put this sweet vapor on a rag to make patients sleep.",
      intermediate: "It was a famous medical trick, but it's very bad for your liver.",
      scientific: "Chloroform is a dense haloalkane that acts as a central nervous system depressant and was one of the earliest anesthetics.",
      research: "When exposed to light and oxygen, chloroform undergoes slow auto-oxidation to generate phosgene (COCl₂), necessitating stabilization with small amounts of ethanol in laboratory settings."
    }
  },
  {
    formula: "C2H3Cl", displayFormula: "C₂H₃Cl", displayName: "Vinyl Chloride", category: "organic", difficulty: "advanced", atomCount: 6,
    funFacts: {
      simple: "Every PVC pipe in your house is built by linking this gas together millions of times.",
      intermediate: "It is a highly toxic, sweet-smelling gas that plastic factories lock away tightly.",
      scientific: "Vinyl chloride is a highly reactive organochloride monomer containing an sp² hybridized double bond.",
      research: "Vinyl chloride is a group 1 human carcinogen. Hepatic metabolism via CYP2E1 generates chloroethylene oxide, an extremely reactive epoxide that heavily alkylates hepatic DNA, leading to angiosarcoma."
    }
  },
  {
    formula: "C2H5Cl", displayFormula: "C₂H₅Cl", displayName: "Ethyl Chloride", category: "organic", difficulty: "sapling", atomCount: 8,
    funFacts: {
      simple: "Sports doctors spray this on hurt muscles. It freezes the skin instantly to stop pain!",
      intermediate: "It boils at exactly room temperature, pulling all the heat out of your injured leg.",
      scientific: "Ethyl chloride evaporates with a large enthalpy of vaporization, acting as a rapid topical cryoanesthetic.",
      research: "Historically, immense quantities of ethyl chloride were consumed to synthesize tetraethyllead (TEL), the ubiquitous anti-knock gasoline additive before global phase-out."
    }
  },
  {
    formula: "N2O4", displayFormula: "N₂O₄", displayName: "Dinitrogen Tetroxide", category: "gas", difficulty: "advanced", atomCount: 6,
    funFacts: {
      simple: "Rocket scientists mix this clear liquid with rocket fuel, and it explodes on contact.",
      intermediate: "It doesn't even need a spark! Just touching the fuel creates a rocket engine blast.",
      scientific: "N₂O₄ is a powerful oxidizer that exists in an equilibrium with NO₂ gas depending on temperature.",
      research: "N₂O₄ forms a hypergolic mixture with hydrazine derivatives, igniting spontaneously upon mixing, making it the preferred oxidizer for deep-space thrusters where spark ignition is unreliable."
    }
  },
  {
    formula: "N2O5", displayFormula: "N₂O₅", displayName: "Dinitrogen Pentoxide", category: "solid", difficulty: "advanced", atomCount: 7,
    funFacts: {
      simple: "This rare white crystal explodes if it gets just slightly too warm.",
      intermediate: "It is basically solid nitric acid without any water in it.",
      scientific: "In the solid state, N₂O₅ adopts an ionic structure, nitronium nitrate ([NO₂]⁺[NO₃]⁻).",
      research: "N₂O₅ dissolves in non-polar solvents to provide a neutral, anhydrous source of the highly electrophilic nitronium ion (NO₂⁺) for advanced synthetic nitrations."
    }
  },
  {
    formula: "HNO2", displayFormula: "HNO₂", displayName: "Nitrous Acid", category: "acid", difficulty: "sapling", atomCount: 4,
    funFacts: {
      simple: "This weak acid is used to help turn hot dogs and bacon a pretty pink color.",
      intermediate: "It is very unstable and quickly breaks down into other gases if you try to bottle it.",
      scientific: "HNO₂ only exists in solution or as a gas. It is a critical intermediate in the preparation of diazonium salts.",
      research: "In the environment, nitrous acid accumulates on atmospheric aerosol surfaces overnight and rapidly photolyzes at sunrise, creating a morning surge of hydroxyl (OH) radicals."
    }
  },
  {
    formula: "H2O3S", displayFormula: "H₂SO₃", displayName: "Sulfurous Acid", category: "acid", difficulty: "sapling", atomCount: 6,
    funFacts: {
      simple: "This invisible acid is what gives dried apricots their tangy, sharp bite!",
      intermediate: "It exists inside acid rain, formed when sulfur dioxide gas mixes with clouds.",
      scientific: "H₂SO₃ is a theoretical acid. No conclusive evidence of H₂SO₃ molecules exists in solution; it is actually a mixture of SO₂·H₂O and bisulfite ions.",
      research: "Aqueous sulfur dioxide (commonly termed sulfurous acid) serves as a potent reducing agent and antimicrobial preservative (E220) in the global wine and dried fruit industries."
    }
  },
  {
    formula: "Na2O4S", displayFormula: "Na₂SO₄", displayName: "Sodium Sulfate", category: "salt", difficulty: "sapling", atomCount: 7,
    funFacts: {
      simple: "This safe white powder makes laundry detergent bulky and easy to scoop.",
      intermediate: "It is completely harmless and dissolves beautifully in your washing machine.",
      scientific: "Sodium sulfate decahydrate (Glauber's salt) undergoes a striking phase transition at 32.38°C, releasing its waters of hydration.",
      research: "The large latent heat of fusion associated with Glauber's salt phase transition makes it a leading candidate for passive thermal energy storage in green architecture."
    }
  }
];
