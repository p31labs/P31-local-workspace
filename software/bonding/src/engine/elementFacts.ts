// src/engine/elementFacts.ts

export interface ElementFunFacts {
  symbol: string;
  facts: {
    simple: string;
    intermediate: string;
    scientific: string;
    research: string;
  };
  discoveryStory: string;
  bodyConnection: string;
  cosmicOrigin: string;
}

export const elementFacts: ElementFunFacts[] = [
  {
    symbol: 'H',
    facts: {
      simple: "Hydrogen is the lightest and most common thing in the whole universe!",
      intermediate: "It makes up 75% of all matter in space and acts as the fuel that makes the Sun shine brightly.",
      scientific: "Hydrogen is the simplest element, containing just one proton and one electron. Its 1s orbital is highly reactive, seeking to form covalent or ionic bonds.",
      research: "Protium (¹H) exhibits massive quantum mechanical tunneling effects in chemical reactions, drastically altering kinetic isotope effects compared to deuterium (²H)."
    },
    discoveryStory: "Henry Cavendish recognized it as a unique substance in 1766, calling it 'flammable air'. Antoine Lavoisier later named it 'water-former' (hydro-gen) because burning it produced water.",
    bodyConnection: "Hydrogen accounts for about 10% of your body weight. Every single water molecule and organic chain in your cells relies on hydrogen bonds to maintain their 3D shapes.",
    cosmicOrigin: "Hydrogen wasn't made in stars. It formed just seconds after the Big Bang itself, making it the oldest and most primordial element in existence."
  },
  {
    symbol: 'C',
    facts: {
      simple: "Carbon is the magical building block that makes up all living things!",
      intermediate: "Depending on how it's squished together, pure carbon can be black pencil lead or a sparkling diamond.",
      scientific: "Carbon's tetravalency (4 valence electrons) allows it to catenate, forming stable, complex chains, rings, and fullerenes via strong sp, sp², and sp³ hybridized bonds.",
      research: "Graphene, a 2D monolayer of sp² hybridized carbon atoms, exhibits extraordinary electron mobility (>200,000 cm²/Vs), positioning it as a foundational material for post-silicon nanoelectronics."
    },
    discoveryStory: "Carbon has been known since ancient times as soot and charcoal. The brilliant Antoine Lavoisier officially listed it as a fundamental element in 1789.",
    bodyConnection: "Carbon is 18% of your body weight. It forms the essential structural backbone of your DNA, proteins, fats, and carbohydrates.",
    cosmicOrigin: "Carbon is forged in the core of aging stars via the triple-alpha process, where three helium nuclei collide at incredible speeds to fuse into a single carbon atom."
  },
  {
    symbol: 'N',
    facts: {
      simple: "Most of the air you breathe is actually made of nitrogen gas!",
      intermediate: "It makes up 78% of the sky. Plants desperately need it to grow, which is why fertilizers are packed with it.",
      scientific: "Nitrogen gas (N₂) is incredibly inert due to its diatomic triple bond, requiring high activation energy (like lightning or the Haber process) to 'fix' it into reactive forms.",
      research: "Isotopic fractionation of ¹⁵N/¹⁴N serves as an exquisite biomarker in trophic ecology and paleoclimatology, delineating deep-sea nitrogen cycles and ancestral human diets."
    },
    discoveryStory: "Daniel Rutherford discovered it in 1772 by leaving a mouse in a closed jar until the oxygen ran out, finding a lingering gas that extinguished flames.",
    bodyConnection: "Nitrogen is ~3% of your body. It is the defining element of amino acids (the building blocks of proteins) and the nucleic acids in your DNA.",
    cosmicOrigin: "Nitrogen is primarily synthesized during the CNO cycle in massive, hot stars, where it acts as a catalyst for converting hydrogen into helium."
  },
  {
    symbol: 'O',
    facts: {
      simple: "You need to breathe oxygen to live, and it helps make fire burn!",
      intermediate: "It's the most common element in the Earth's crust, meaning most rocks and sand are actually full of oxygen.",
      scientific: "Oxygen is highly electronegative, aggressively stealing electrons from other elements to achieve an octet, which drives global oxidation-reduction (redox) chemistry.",
      research: "The Great Oxidation Event ~2.4 billion years ago, driven by cyanobacterial photosynthesis, fundamentally inverted planetary geochemistry, precipitating banded iron formations globally."
    },
    discoveryStory: "Carl Wilhelm Scheele and Joseph Priestley independently discovered it in the 1770s by heating various oxides. Lavoisier later figured out its role in combustion.",
    bodyConnection: "Oxygen is an astonishing 65% of your total body mass, mostly locked inside water (H₂O). Your mitochondria use it to burn glucose and generate cellular ATP.",
    cosmicOrigin: "Oxygen is intensely forged during the late life stages of massive stars, specifically during oxygen-burning shell fusion, right before a supernova explosion."
  },
  {
    symbol: 'P',
    facts: {
      simple: "Your bones and teeth need this element to be strong!",
      intermediate: "Phosphorus is element 31. DNA, the instruction manual for every living thing, uses phosphorus as its backbone.",
      scientific: "Phosphorus exists in two primary allotropes: white phosphorus (P₄, pyrophoric) and red phosphorus (polymeric, stable). The phosphate group (PO₄³⁻) is the energy currency of biology via ATP.",
      research: "³¹P is the only stable NMR-active isotope of phosphorus (spin ½). Its Larmor frequency in Earth's field has been proposed as relevant to quantum cognition models (Fisher, 2015)."
    },
    discoveryStory: "Hennig Brand discovered phosphorus in 1669 by boiling urine. He was looking for the Philosopher's Stone. He found something that glowed in the dark instead.",
    bodyConnection: "Your body contains about 750g of phosphorus — 85% in your bones and teeth as hydroxyapatite, the rest in every cell as part of DNA, RNA, and ATP.",
    cosmicOrigin: "Phosphorus is forged in massive stars during oxygen-burning shell fusion and scattered across space in supernova explosions. Every phosphorus atom in your body was once inside a star."
  },
  {
    symbol: 'Na',
    facts: {
      simple: "Sodium is a soft metal that explodes if you throw it into water!",
      intermediate: "When you bond this exploding metal with toxic chlorine gas, it magically turns into delicious table salt.",
      scientific: "Sodium is an alkali metal with a single loosely held 3s valence electron. It rapidly oxidizes and reacts exothermically with H₂O to generate NaOH and H₂ gas.",
      research: "Voltage-gated sodium channels (NaV) initiate action potentials in excitable cells. Mutations in NaV1.7 lead to congenital insensitivity to pain or extreme pain disorders like erythromelalgia."
    },
    discoveryStory: "Sir Humphry Davy isolated pure sodium in 1807 by running powerful electric currents through melted sodium hydroxide (lye).",
    bodyConnection: "Sodium is the primary extracellular cation in your body. It regulates blood volume, blood pressure, and is absolutely critical for sending electrical signals through your nerves.",
    cosmicOrigin: "Sodium is created during the carbon-burning phase of massive stars, where two carbon atoms smash together to form neon, sodium, and magnesium."
  },
  {
    symbol: 'Ca',
    facts: {
      simple: "Your bones, teeth, and sea shells are all made strong by calcium!",
      intermediate: "Cows eat calcium-rich grass, which goes into their milk. When you drink it, it builds your skeleton.",
      scientific: "Calcium is an alkaline earth metal. The Ca²⁺ ion acts as a universal intracellular secondary messenger, triggering neurotransmitter release and muscle contraction.",
      research: "Intracellular Ca²⁺ oscillations encode complex cellular responses. The frequency and amplitude of these oscillations directly govern differential gene expression via the calcineurin/NFAT pathway."
    },
    discoveryStory: "Like sodium, Sir Humphry Davy isolated pure calcium in 1808 using electrolysis on a mixture of lime and mercuric oxide.",
    bodyConnection: "You have about 1 kilogram of calcium inside you. 99% is structural (bones), but the remaining 1% is tightly regulated in the blood to keep your heart beating.",
    cosmicOrigin: "Calcium is synthesized in supernovae via the rapid capture of helium nuclei (alpha particles) by silicon atoms, a process called silicon burning."
  },
  {
    symbol: 'Cl',
    facts: {
      simple: "Chlorine keeps swimming pools clean and makes your salt taste salty!",
      intermediate: "As a pure gas, it is pale green and heavy. It kills germs instantly by ripping their cell walls apart.",
      scientific: "Chlorine is a highly electronegative halogen. The chloride anion (Cl⁻) is the most abundant dissolved ion in the oceans.",
      research: "Cystic fibrosis is caused by mutations in the CFTR gene, which functions as a cyclic AMP-regulated chloride channel, leading to defective osmotic hydration of mucosal surfaces."
    },
    discoveryStory: "Carl Wilhelm Scheele discovered it in 1774, but Sir Humphry Davy proved it was a distinct element in 1810, naming it after the Greek word 'chloros' meaning pale green.",
    bodyConnection: "Chloride pairs with sodium to maintain your body's fluid balance. It's also used by your stomach to make strong hydrochloric acid for digesting food.",
    cosmicOrigin: "Chlorine is primarily produced via the r-process (rapid neutron capture) during catastrophic cosmic events like the collision of neutron stars."
  },
  {
    symbol: 'S',
    facts: {
      simple: "Sulfur is a yellow rock that smells exactly like rotten eggs!",
      intermediate: "It makes garlic and onions smell strong, and it is a key ingredient in gunpowder.",
      scientific: "Sulfur catenates to form cyclic octatomic rings (S₈). In biology, thiol groups (-SH) form rigid disulfide bonds to determine tertiary protein folding.",
      research: "Extremophile lithoautotrophs near deep-sea hydrothermal vents utilize hydrogen sulfide (H₂S) instead of water as an electron donor, fueling entire ecosystems devoid of sunlight."
    },
    discoveryStory: "Known as 'brimstone' in ancient texts, Lavoisier convinced the scientific community that sulfur was a true element, not a compound, in 1777.",
    bodyConnection: "Sulfur keeps your hair and nails tough. The smell of burning hair is actually the smell of the sulfur bonds in keratin breaking apart.",
    cosmicOrigin: "Sulfur is synthesized in the deep, incredibly hot layers of supergiant stars right before they collapse and explode as supernovae."
  },
  {
    symbol: 'Fe',
    facts: {
      simple: "Iron makes your blood red and is the heavy metal inside our Earth!",
      intermediate: "If it gets wet, it turns into flaky orange rust. It was so important for making tools that an entire part of history is called the Iron Age.",
      scientific: "Iron is a transition metal capable of multiple oxidation states (Fe²⁺, Fe³⁺). It exhibits ferromagnetism due to aligned unpaired d-orbital electrons.",
      research: "Iron is the ultimate elemental dead-end of stellar nucleosynthesis. Its binding energy per nucleon is so exceptionally high that fusing iron requires energy rather than releasing it, triggering stellar collapse."
    },
    discoveryStory: "Ancient humans first discovered pure iron from meteorites that fell from the sky, using it to craft daggers thousands of years before they learned how to smelt iron ore.",
    bodyConnection: "Iron sits at the very center of the hemoglobin molecule in your red blood cells. It acts like a magnet for oxygen, carrying it from your lungs to your muscles.",
    cosmicOrigin: "Iron is the heavy ash left over at the core of massive stars. Once a star's core turns completely to iron, fusion stops, gravity wins, and the star explodes."
  }
];
