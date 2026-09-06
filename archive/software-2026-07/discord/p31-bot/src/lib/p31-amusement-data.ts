/**
 * Curated fun content — family-friendly, P31-flavored (mesh, spoons, science nods).
 * No external API calls; safe for Railway/air-gapped.
 */

export type MeshPersona = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  /** Short mood line */
  vibe: string;
  /** One-line “flight recorder” */
  blackBox: string;
  /** Longer flavor — still fictional */
  lore: string;
  quips: string[];
};

export const MESH_CREW: MeshPersona[] = [
  {
    id: "forge",
    name: "FORGE",
    emoji: "🛠️",
    role: "Build lane — ships the thing",
    vibe: "Caffeinated calm — the IDE is a fireplace.",
    blackBox: "Last stable state: green verify, lukewarm tea, one TODO with teeth.",
    lore:
      "FORGE treats doubt like a failing test: reproduce, shrink, patch. They believe morale is a function of deploy frequency — not heroics — and that the kindest code review is one that lands with a checklist, not a sermon.",
    quips: [
      "If it compiles and `verify` is green, we eat today.",
      "I don't do submarine metaphors. I do diffs.",
      "Your bug is valid. Your timeline might be optimistic. Both can be true.",
      "I'll refactor when the graph stops screaming — not when the calendar whispers.",
      "Production is just staging with consequences and better logs.",
    ],
  },
  {
    id: "counsel",
    name: "COUNSEL",
    emoji: "⚖️",
    role: "Draft lane — careful words, no fabrication",
    vibe: "Slow hands, sharp margins — every sentence earns its ink.",
    blackBox: "Draft v7: shorter. Footnotes: longer. Sleep: scheduled.",
    lore:
      "COUNSEL is allergic to swagger in filings. They keep a private list titled “things we do not claim” and treat it like a firewall. Their superpower is translating panic into paragraphs that still tell the truth when read out loud.",
    quips: [
      "Cite what you know. Label what you don't. Sleep better.",
      "I'm not here to win the argument. I'm here to keep the record straight.",
      "Assume good faith once. Document everything anyway.",
      "If it sounds clever and you can't verify it, it's decoration.",
      "Silence is not consent — but neither is a wall of text.",
    ],
  },
  {
    id: "scribe",
    name: "SCRIBE",
    emoji: "📓",
    role: "Accommodations + logs",
    vibe: "Gentle archivist — stickers on a serious binder.",
    blackBox: "Captured: trigger, context, mitigation, what we'd tell Future Us.",
    lore:
      "SCRIBE believes memory is a kindness infrastructure. They write logs for the version of you who is tired, rushed, or interrupted — and they fight the myth that accommodations are “extra” instead of load-bearing beams.",
    quips: [
      "If it happened and it mattered, it belongs in the log.",
      "Spoons aren't shame — they're data.",
      "TL;DR for Future You is an act of kindness.",
      "If the story only lives in your head, it isn't portable.",
      "Accessibility is part of the architecture, not a sticker at the end.",
    ],
  },
  {
    id: "oracle",
    name: "ORACLE",
    emoji: "🔮",
    role: "Patterns & trim-tab hints",
    vibe: "Stargazer energy with a spreadsheet backbone.",
    blackBox: "Noticed: second-order effect. Recommended: tiny lever, earlier.",
    lore:
      "ORACLE chases leverage the way some people chase trends — except their leverage is boring: rename one variable, delete one meeting, move one guardrail upstream. They collect koans that are actually engineering heuristics in disguise.",
    quips: [
      "Small force, right place, early — that's the whole game.",
      "When the graph looks messy, zoom to one edge and tighten it.",
      "The answer might be boring. Boring ships.",
      "If you're steering the tsunami, you're already late.",
      "Measure the lag, not the drama.",
    ],
  },
  {
    id: "triage",
    name: "TRIAGE",
    emoji: "🚦",
    role: "Voltage on hostile mail",
    vibe: "Bouncer at the inbox — polite, immovable.",
    blackBox: "Classification: YELLOW. Action: template + pause. Ego: not fed.",
    lore:
      "TRIAGE learned that most crises are choreography problems: who speaks, when, and with what tone. They keep a mental zoo of bait patterns — guilt hooks, urgency fog, faux reasonableness — and refuse to adopt someone else's panic as a dress code.",
    quips: [
      "GREEN: file it. YELLOW: breathe twice, then answer. RED: don't touch the bait.",
      "Not every ping deserves a novel. Some deserve a template.",
      "Classification is compassion for Future You.",
      "If it rattles your nervous system, treat it like a live wire — gloves first.",
      "You can be kind and still be done.",
    ],
  },
  {
    id: "narrator",
    name: "NARRATOR",
    emoji: "📚",
    role: "Grants + synthesis",
    vibe: "Deadline haiku — rigor with rhythm.",
    blackBox: "Outline stable. Evidence tagged. Narrative arc: visible from orbit.",
    lore:
      "NARRATOR thinks of proposals as invitations to a shared hallucination called “the future,” and their job is to make that hallucination evidence-weighted. They love a clean figure caption more than most people love fireworks.",
    quips: [
      "One paragraph of clarity beats three pages of vibe.",
      "If the reviewer can't see the arc, the arc isn't there yet.",
      "Citations are love letters to reproducibility.",
      "Show the constraint, then show the escape hatch.",
      "Jargon is a tax. Budget it.",
    ],
  },
  {
    id: "phos",
    name: "PHOS",
    emoji: "💜",
    role: "Kid-adjacent companion lane (careful, kind)",
    vibe: "Night-light logic — soft edges, true north.",
    blackBox: "Mode: wonder-safe. Topics: age-fit. Exit ramp: always visible.",
    lore:
      "PHOS is the persona who remembers that curiosity and overwhelm can arrive in the same package. They keep games short, jokes gentle, and never confuse “playful” with “glib” when someone is growing.",
    quips: [
      "Big feelings fit in small words sometimes.",
      "You don't have to be brave out loud. Quiet brave counts.",
      "Wonder is allowed. So are breaks.",
      "Questions are not interruptions — they're signals.",
      "If it's not kind *and* true, we rewrite it.",
    ],
  },
  {
    id: "mesh",
    name: "MESH",
    emoji: "🔺",
    role: "The tetrahedron in the room",
    vibe: "Structural sincerity — feelings with statics.",
    blackBox: "Edges warm. Vertices accounted for. Drama rerouted through protocol.",
    lore:
      "MESH is the reminder that a family graph isn't a corporation org chart — it's a load path for care. They joke about complete graphs because humor is how humans tolerate beautiful, rigid truths.",
    quips: [
      "Four vertices, six edges — still more stable than my weekend plans.",
      "We're not a hierarchy. We're a graph with feelings.",
      "Sync the constants before you sync the drama.",
      "Redundancy isn't paranoia when people are the payload.",
      "Strong meshes distribute stress — so can strong boundaries.",
    ],
  },
];

export const JOKES_GENERAL: string[] = [
  "Why did the operator push to `main` on a Friday? …They had spoons to spare. (Don't do this.)",
  "A photon checks into a hotel. The clerk asks: 'Any luggage?' The photon says: 'No — I'm traveling light.'",
  "There are 10 kinds of people: those who understand binary, those who don't, and those who expected this joke to be in base 3.",
  "I'd tell you a UDP joke, but you might not get it.",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "The cloud is just someone else's computer — unless it's *your* Worker, then it's *our* computer and we have receipts.",
  "I told my mesh we needed better observability. It said: 'I *am* the observable event.'",
  "Documentation is like flossing: everyone agrees it matters, and the gap is between meetings one and two.",
];

export const JOKES_DEV: string[] = [
  "YAML called. It wants fewer feelings and more indentation therapy.",
  "I don't always test my code — but when I do, I do it in production. (This is a joke. Test.)",
  "There are two hard problems: cache invalidation, naming things, and off-by-one errors.",
  "I'd explain recursion, but you'd need to understand recursion first.",
  "My code works. I have no idea why. My code breaks. I have no idea why. Therefore: Schrödinger's deploy.",
  "Git blame is a social network for accountability.",
];

export const JOKES_MESH: string[] = [
  "The mesh asked for loyalty. I offered idempotency. We're working through it.",
  "K₄ walks into a bar. The bartender says: 'Why the long edge?' The mesh says: 'That's just six of us being complete.'",
  "I tried to gossip on a DAG. Everyone already knew the topological order.",
  "My Durable Object has more consistency than my group chat. No offense.",
  "We don't do submarine metaphors — but we *do* do pressure-tested hulls made of tests.",
];

export const JOKES_DAD: string[] = [
  "I'm reading a book on anti-gravity. It's impossible to put down.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I would tell a chemistry joke, but I wouldn't get a reaction.",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "I used to hate facial hair… then it grew on me.",
];

/** @deprecated use deck helpers */
export const JOKES: string[] = [...JOKES_GENERAL, ...JOKES_DEV, ...JOKES_MESH, ...JOKES_DAD];

export type JokeDeck = "mix" | "dev" | "mesh" | "dad";

export function jokesForDeck(deck: JokeDeck): readonly string[] {
  switch (deck) {
    case "dev":
      return JOKES_DEV;
    case "mesh":
      return JOKES_MESH;
    case "dad":
      return JOKES_DAD;
    case "mix":
    default:
      return JOKES;
  }
}

export type TriviaTag = "mesh" | "stack" | "science" | "lore";

export type TriviaCard = {
  q: string;
  choices: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explain: string;
  tag: TriviaTag;
};

export const TRIVIA_DECK: TriviaCard[] = [
  {
    q: "In a complete graph K₄ (four vertices), how many edges are there?",
    choices: ["4", "5", "6", "8"],
    correct: 2,
    explain: "Kₙ has n(n−1)/2 edges — for n=4 that's 6. The family tetrahedron lives here.",
    tag: "mesh",
  },
  {
    q: "What does 'ephemeralization' mean in the P31 sense?",
    choices: [
      "Delete all your files",
      "One source, many derived surfaces — less duplication, clearer truth",
      "Use only temporary VMs",
      "Post less on social media",
    ],
    correct: 1,
    explain: "Fuller's idea: do more with less — in repo terms, one canon JSON and verifiers, not parallel lore.",
    tag: "lore",
  },
  {
    q: "Which HTTP status is *correct* when Stripe webhook signature verification fails?",
    choices: ["200 OK", "400 Bad Request", "401 Unauthorized", "418 I'm a teapot"],
    correct: 1,
    explain: "Stripe expects 400 on bad signature so they can retry with diagnostics — check donate-api patterns.",
    tag: "stack",
  },
  {
    q: "A 'spoon' in spoon theory roughly measures…",
    choices: [
      "CPU usage",
      "Executive / energy budget for a task",
      "Discord message length",
      "Git commit count",
    ],
    correct: 1,
    explain: "Spoons ≈ how much you've got today for demands — not laziness, bandwidth.",
    tag: "lore",
  },
  {
    q: "Why might you run `npm run verify` before declaring victory?",
    choices: [
      "To heat the CPU",
      "Because the alignment graph is the actual social contract of the repo",
      "Discord requires it",
      "It installs node_modules faster",
    ],
    correct: 1,
    explain: "Verify is the bar — green means the machine claims hold, not just vibes.",
    tag: "stack",
  },
  {
    q: "What is an idempotent webhook handler trying to guarantee?",
    choices: [
      "Faster JSON parsing",
      "The same event delivered twice doesn't corrupt state",
      "Users never see embeds",
      "Discord always retries",
    ],
    correct: 1,
    explain: "Retries happen — dedupe keys / stable side effects keep the ledger honest.",
    tag: "stack",
  },
  {
    q: "Speed of light in vacuum is closest to…",
    choices: ["3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "300 m/s"],
    correct: 1,
    explain: "~299,792,458 m/s — the universe's hard latency floor (sorry).",
    tag: "science",
  },
  {
    q: "AuDHD often shows up as…",
    choices: [
      "Lower intelligence",
      "A serialization bottleneck — not a ceiling on capability",
      "Only childhood traits",
      "Something medication erases completely",
    ],
    correct: 1,
    explain: "Executive load and attention can bottleneck output without limiting insight — context and supports matter.",
    tag: "lore",
  },
  {
    q: "In graph theory, an edge connects…",
    choices: [
      "Only servers",
      "Two vertices",
      "Only databases",
      "Only paid APIs",
    ],
    correct: 1,
    explain: "Vertices are nodes; edges are relationships — the mesh mental model.",
    tag: "mesh",
  },
  {
    q: "Why might you rate-limit a public webhook?",
    choices: [
      "To annoy integrators",
      "To blunt abuse and accidental retry storms",
      "Because JSON is slow",
      "Because Discord demands it",
    ],
    correct: 1,
    explain: "Ingress hygiene: signatures + limits + idempotency = fewer 3am mysteries.",
    tag: "stack",
  },
  {
    q: "Hypoparathyroidism often means calcium needs…",
    choices: [
      "No monitoring",
      "Tight clinical monitoring — swings are risky",
      "Only dietary fixes, always",
      "Is irrelevant to energy",
    ],
    correct: 1,
    explain: "Calcium/vitamin D/PTH dynamics are medically serious — not a vibe metric.",
    tag: "lore",
  },
  {
    q: "A trim tab (Oracle's favorite metaphor) changes…",
    choices: [
      "The entire ocean",
      "A small control surface that alters big forces early",
      "Only UI colors",
      "DNS permanently",
    ],
    correct: 1,
    explain: "Small leverage early beats heroic corrections late — same in systems and days.",
    tag: "mesh",
  },
  {
    q: "REST is best described as…",
    choices: [
      "A brand of mattress",
      "An architectural style using stateless HTTP + resources",
      "A SQL dialect",
      "A Discord feature flag",
    ],
    correct: 1,
    explain: "Resources, verbs, representations — not the only pattern, but a common one.",
    tag: "stack",
  },
  {
    q: "Entropy in information theory relates to…",
    choices: [
      "Heat only",
      "Uncertainty / average information per symbol",
      "CPU wattage only",
      "How loud your keyboard is",
    ],
    correct: 1,
    explain: "Shannon entropy measures surprise — compression and codes lean on this.",
    tag: "science",
  },
  {
    q: "A cage graph in the P31 family metaphor suggests…",
    choices: [
      "Prison aesthetics",
      "A bounded, cared-for subgraph — not isolation-as-punishment",
      "Deleting relatives",
      "Only cloudflare zones",
    ],
    correct: 1,
    explain: "It's a topology for family scope — boundaries as structure, not shame.",
    tag: "mesh",
  },
];

export const EIGHT_BALL: string[] = [
  "🔺 Signs point to **yes** — after you run `verify`.",
  "🌫️ **Reply hazy** — check your constants and try again.",
  "🛑 **Don't bet the mesh on it** without a runbook.",
  "✅ **Yes**, and document the assumption.",
  "📎 **Ask again** when you're not in a spoon deficit.",
  "🧪 **Science says maybe** — ship a small experiment.",
  "🔧 **Focus on the trim tab**, not the tsunami.",
  "💜 **Outlook good** — especially if you hydrated.",
  "🧭 **Not yet** — but you're asking the right question.",
  "📓 **Write it down** — Future You is rooting for receipts.",
];

export type WouldYouRather = { a: string; b: string };

export const WOULD_YOU_RATHER: WouldYouRather[] = [
  {
    a: "One green `verify` a week — forever",
    b: "Infinite green locals — but prod is always “surprising”",
  },
  { a: "Perfect memory for logs", b: "Perfect sleep — but only on weekends" },
  { a: "Always know the bug's root cause", b: "Always know the politest ‘no’" },
  { a: "Keyboard that never misses", b: "Tea that never spills" },
  { a: "Documentation writes itself — in Comic Sans", b: "Code writes itself — but only in INTERCAL" },
  { a: "Meetings halved", b: "Inbox pings halved" },
  { a: "Instant deploys", b: "Instant nap permission" },
  { a: "Graph brain for people", b: "Compass brain for priorities" },
  { a: "Always calm under hostile mail", b: "Always calm under npm peer dependency warnings" },
  { a: "A mentor in your pocket", b: "A mute button for the universe" },
  { a: "K₄ family mesh IRL stability", b: "K₄ Wi‑Fi stability" },
  { a: "Beautiful error messages", b: "Beautiful git history" },
];

export type RiddleCard = { q: string; a: string };

export const RIDDLES: RiddleCard[] = [
  {
    q: "I have cities, but no houses. Forests, but no trees. Water, but no fish. What am I?",
    a: "A map.",
  },
  {
    q: "What has keys but can't listen to music — and also can't open locks the way you think?",
    a: "A keyboard (the typing kind).",
  },
  {
    q: "The more you take, the more you leave behind. What are they?",
    a: "Footsteps.",
  },
  {
    q: "I speak without a mouth and hear without ears. I can be deep without a body. What am I?",
    a: "An echo (and also, arguably, a log file).",
  },
  {
    q: "What breaks when you name it?",
    a: "Silence.",
  },
  {
    q: "Forward I'm heavy; backward I'm not. What am I?",
    a: "Ton (not).",
  },
  {
    q: "What runs but never walks, murmurs but never talks, has a bed but never sleeps, has a mouth but never eats?",
    a: "A river.",
  },
  {
    q: "I'm always hungry, I must always be fed. The finger I touch will soon turn red. What am I?",
    a: "Fire.",
  },
];

export const FORTUNES: string[] = [
  "You will find a bug that saves you from a bigger bug. Thank the glitch gremlin — then write a test.",
  "A small kindness in a PR comment will compound. Be the person who leaves bread crumbs, not land mines.",
  "Your next good idea arrives after a walk, not after another tab.",
  "The mesh rewards the boring fix: one constant, one clarified sentence, one boundary.",
  "Hydration and calcium are not personality — they're infrastructure. Check both.",
  "Today favors tight scopes: ship the thin slice, celebrate, sleep.",
  "Someone needs your clarity more than your cleverness.",
  "If you can't explain it to Future You, it isn't finished.",
  "A trim tab move is available. Look for leverage, not applause.",
  "The answer might be a template. Templates are technology.",
  "Green means checked — not “never wrong again.” Stay humble, stay instrumented.",
  "Wonder is permitted. So is closing the laptop.",
  "You'll laugh at a problem that used to own you. Keep the receipts anyway.",
  "The graph is not the territory — but updating the graph prevents fights about the territory.",
  "A good log line ages like copper: prettier with time.",
];

export const DEEP_FACTS: string[] = [
  "Complete graph K₄ has 6 edges — the maximum edges without a 'tree' vibe; it's rigid in the gossip sense: everyone connects.",
  "Discord embed descriptions cap around 4096 chars — the bot respects your scroll sanity.",
  "Stripe webhook signatures use HMAC — 'trust but verify' as an HTTP header lifestyle.",
  "Durable Objects give you strongly consistent *single-threaded* mutation per ID — a literal queue without the drama.",
  "Spoon theory: spoons are a budget metaphor from chronic illness communities — useful far beyond the original context.",
  "The speed of light limit means distributed systems are always a little bit about physics, whether we admit it or not.",
  "Idempotency keys turn 'at-least-once delivery' into 'effectively-once outcomes' — if you do the bookkeeping.",
  "Accessibility isn't a skin — it's structural: contrast, motion, cognition, time.",
  "A rate limiter is a hug for your future database.",
  "Good runbooks convert panic into choreography — same steps, fewer casualties.",
  "Hypoparathyroidism can make calcium a daily negotiation — respect medical ground truth over meme advice.",
  "Wordle-style feedback is just information theory as emoji — greens carry the most bits.",
  "Git is a DAG — merges are first-class; time travel is `revert`, not erasure.",
  "Kids deserve kid-adjacent tools that don't treat them as engagement metrics.",
  "The best joke in ops is a green dashboard that stayed green.",
];

export type AnagramPuzzle = { clue: string; answer: string };

export const ANAGRAM_PUZZLES: AnagramPuzzle[] = [
  { clue: "Relations drawn between dots", answer: "GRAPH" },
  { clue: "Distant computer weather", answer: "CLOUD" },
  { clue: "Care budget, counted", answer: "SPOON" },
  { clue: "Path selection on the wire", answer: "ROUTE" },
  { clue: "Gate pass, metaphorically", answer: "TOKEN" },
  { clue: "Standing reserve of truth", answer: "CACHE" },
  { clue: "Mathematical certainty mood", answer: "PROOF" },
  { clue: "Small deploy unit", answer: "PATCH" },
  { clue: "Handoff without drop", answer: "RELAY" },
  { clue: "Lens you point at prod", answer: "PROBE" },
  { clue: "Scope of responsibility", answer: "SCOPE" },
  { clue: "What good tests increase", answer: "TRUST" },
];

/** Valid Meshword guesses + solutions (5 letters, A–Z). */
export const MESHWORD_LEXICON: readonly string[] = [
  "GRAPH",
  "NODES",
  "PROXY",
  "CACHE",
  "ROUTE",
  "TOKEN",
  "GUARD",
  "TRACK",
  "BUILD",
  "PATCH",
  "MERGE",
  "RELAY",
  "SPOON",
  "PROOF",
  "QUEUE",
  "BATCH",
  "DRIFT",
  "SLOTS",
  "LATCH",
  "FIBER",
  "TRUST",
  "GRACE",
  "PROBE",
  "SHELL",
  "VALID",
  "SCOPE",
  "LAYER",
  "TRUTH",
  "CHECK",
  "VERGE",
  "TIMED",
  "FIELD",
  "INPUT",
  "FLARE",
  "SHIFT",
  "PHASE",
  "LOGIC",
  "GRAIN",
  "TIGHT",
  "LOOSE",
  "CLOUD",
  "BREAD",
  "CRISP",
  "BRIEF",
  "CHORD",
  "FRAME",
  "GLIDE",
  "HEART",
  "LIGHT",
  "MATCH",
  "NIGHT",
  "PLANE",
  "QUARK",
  "RIDGE",
  "SHARD",
  "TREND",
  "VISTA",
  "WOVEN",
];

const MESHWORD_SET: ReadonlySet<string> = new Set(MESHWORD_LEXICON);

export function isValidMeshwordToken(w: string): boolean {
  return MESHWORD_SET.has(w.toUpperCase());
}

/** Seeded-ish pick for games (not crypto) */
export function pick<T>(arr: readonly T[], seed: number): T {
  const i = Math.abs(seed) % arr.length;
  return arr[i]!;
}

export function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

export function shuffleWord(word: string, rng: () => number): string {
  const upper = word.toUpperCase();
  if (upper.length < 2) return upper;
  let out = upper;
  for (let attempt = 0; attempt < 12 && out === upper; attempt++) {
    const chars = upper.split("");
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [chars[i], chars[j]] = [chars[j]!, chars[i]!];
    }
    out = chars.join("");
  }
  return out;
}

export type ParadoxCard = {
  truths: [string, string];
  lie: string;
  explain: string;
};

/** Two truths + one lie — all plausible mesh/dev tone; `explain` is the teachable beat. */
export const PARADOX_CARDS: ParadoxCard[] = [
  {
    truths: [
      "K₄ (complete graph on 4 vertices) has exactly 6 edges.",
      "Webhook handlers should treat duplicate delivery as normal, not exceptional.",
    ],
    lie: "Discord thread titles are limited to 40 characters worldwide.",
    explain:
      "The K₄ edge count is n(n−1)/2 = 6. Webhooks are at-least-once in practice. Thread title limits vary by product/version — don't trust fake precision.",
  },
  {
    truths: [
      "Idempotency keys help turn retries into safe replays.",
      "Spoon theory started as a chronic-illness metaphor for limited daily energy.",
    ],
    lie: "A 400 response from Stripe on bad signature means you should retry the same body forever.",
    explain:
      "Stripe uses 400 on bad signatures so you fix verification — blind retry without fixing is noise. Idempotency + correct status handling matters.",
  },
  {
    truths: [
      "Hypoparathyroidism can make serum calcium a high-stakes dial, not a vibe.",
      "Rate limits protect databases from accidental retry storms.",
    ],
    lie: "The speed of sound in air is faster than the speed of light in fiber.",
    explain:
      "Light in fiber is still *much* faster than sound in air — distributed systems are latency-bound by physics and routing, not audio.",
  },
  {
    truths: [
      "`verify` scripts are a machine-readable social contract for a repo.",
      "Accessibility includes cognition and time — not only color contrast.",
    ],
    lie: "UTF-8 needs a BOM to work on the modern web.",
    explain:
      "UTF-8 BOM is usually unnecessary on the web and can confuse tools. Verification bars and a11y are real constraints; BOM folklore isn't.",
  },
  {
    truths: [
      "Durable Objects can serialize mutations per ID without you hand-rolling a global lock.",
      "Git history is a DAG, not a straight line.",
    ],
    lie: "HTTP/2 guarantees in-order delivery across all intermediaries for all streams.",
    explain:
      "HTTP/2 multiplexes streams; ordering semantics are subtle and not 'magic everywhere.' DOs and git DAGs are still solid truths.",
  },
  {
    truths: [
      "GREEN / YELLOW / RED triage is a compassion tool for Future You.",
      "Entropy in information theory measures uncertainty, not heat alone.",
    ],
    lie: "npm `peerDependencies` are always installed automatically in every npm version.",
    explain:
      "Peer dep behavior changed across npm majors — read the release notes. Triage tiers and Shannon entropy are still on point.",
  },
  {
    truths: [
      "A trim-tab metaphor is about small leverage applied early.",
      "Wordle feedback carries information about letter counts with duplicate-aware rules.",
    ],
    lie: "TCP always delivers your packets in exactly 10ms on localhost.",
    explain:
      "Localhost RTT isn't a constant fairy tale — scheduling and stacks vary. Trim tabs and Wordle scoring are real patterns.",
  },
  {
    truths: [
      "Citations in grants are reproducibility handrails, not decoration.",
      "Ko-fi and Stripe webhooks both deserve signature verification discipline.",
    ],
    lie: "JSON cannot represent integers larger than 2⁵³ in any JavaScript runtime.",
    explain:
      "JSON numbers are text; BigInt exists in JS for integers beyond IEEE limits. Webhook discipline and citations still stand.",
  },
  {
    truths: [
      "Family mesh metaphors talk about graphs — not surveillance aesthetics.",
      "Good runbooks turn panic into a checklist.",
    ],
    lie: "CRITICAL is the fifth standard triage color after GREEN, YELLOW, ORANGE, RED.",
    explain:
      "P31 triage sticks to four tiers — don't invent a fifth without updating the whole contract. Graphs and runbooks are still true.",
  },
  {
    truths: [
      "Dark mode doesn't automatically fix all contrast failures.",
      "Logs should answer who/what/when without exposing secrets.",
    ],
    lie: "Discord embeds can safely store unlimited secrets because they're 'private'.",
    explain:
      "Embeds are not a vault — treat them like UI. Contrast and log hygiene are real engineering duties.",
  },
  {
    truths: [
      "A complete graph Kₙ has n(n−1)/2 edges.",
      "Retrying POST without idempotency can double-charge or double-notify.",
    ],
    lie: "Ollama always enforces your Modelfile stop tokens in every client.",
    explain:
      "Client stacks vary; verify behavior on your path. Graph edge counts and idempotent POST discipline remain foundational.",
  },
  {
    truths: [
      "AuDHD can present as a serialization bottleneck, not an intelligence ceiling.",
      "Cloudflare Workers have CPU time limits — infinite loops are a bad plan.",
    ],
    lie: "SQLite in Durable Objects is slower than every in-memory Redis on every workload.",
    explain:
      "Workload-dependent — blanket claims are lies. Neurodivergent framing and Worker CPU limits are grounded.",
  },
];

export const CHAIN_STARTERS: string[] = [
  "On the night the deploy went green, the mesh",
  "The operator poured one more spoon into the kettle, and suddenly",
  "When the webhook signature finally verified, the room",
  "Somewhere between `npm test` and `npm run verify`, time",
  "The tetrahedron blinked — not with LEDs, but with",
  "A trim tab turned, barely visible, and the whole week",
  "Future You left a note in the log. It said:",
  "The graph insisted it wasn't drama; it was just",
  "In a quiet channel, PHOS whispered that wonder",
  "FORGE tightened one bolt labeled 'assumption' and",
  "COUNSEL filed a sentence under 'true things only' and",
  "The fortune cookie contained a checksum, which felt rude until",
  "NARRATOR deleted an adjective and the paragraph finally",
  "TRIAGE painted the email YELLOW and the room exhaled when",
  "ORACLE pointed at a tiny lever labeled 'earlier' and",
  "The cloud wasn't someone else's computer anymore; it was",
  "A rate limiter hugged the database. The database said",
  "They tried to gossip on a DAG, but topology",
  "The riddle's answer was 'a map,' which explained why",
  "At the edge, latency did what latency always does:",
];

export const DRIFT_BEFORE: string[] = [
  "chore:",
  "fix:",
  "feat:",
  "docs:",
  "hotfix:",
  "refactor:",
  "perf:",
  "test:",
  "maybe:",
  "verify:",
  "mesh:",
  "trimtab:",
];

export const DRIFT_MID: string[] = [
  "teach the tetrahedron to floss",
  "ask the graph to use its inside voice",
  "replace drama with a checksum",
  "lint the feelings (non-blocking)",
  "teach webhooks to knock before entering",
  "migrate panic to a runbook verse",
  "add observability to the vibe",
  "teach constants to stop drifting",
  "negotiate with npm peer deps",
  "convince latency to be polite",
  "cache the kindness",
  "dedupe the déjà vu",
  "rotate the spoons",
  "align the alignment",
  "instrument the obvious",
];

export const DRIFT_AFTER: string[] = [
  "(no submarine metaphors)",
  "(tests pending, hope eternal)",
  "(green locally, brave globally)",
  "(if this breaks, blame entropy)",
  "(Future You signed off)",
  "(ship small, nap lawful)",
  "(WIP: wonder in progress)",
  "(trim tab only — no tsunami)",
  "(spoon-safe commit)",
  "(verify says hi)",
  "(mesh respects you)",
  "(idempotent feelings)",
];

export const LORE_SNIPPETS: string[] = [
  "In the old legend, every edge of K₄ carried a promise: you don't have to be the hub to be load-bearing.",
  "Some operators keep two clocks: one for UTC, one for 'after the kids sleep.'",
  "The mesh doesn't ask you to be always-on — it asks you to be reachable when you choose.",
  "A good log line is a gift you send backward through time.",
  "Trim tabs were never about drama. They were about moving early.",
  "Spoons aren't a scoreboard. They're weather.",
  "The cloud is a metaphor until it bills you — then it's accounting.",
  "Accessibility is what happens when you design for tired humans, not idealized ones.",
  "A webhook retry is not malice; it's physics with paperwork.",
  "The tetrahedron is complete, but your week doesn't have to be.",
  "GREEN means file it, not 'I agree with your soul.'",
  "YELLOW means breathe twice — not 'write a novel at 1am.'",
  "RED means boundaries — not 'become the villain in their story.'",
  "Citations are how you say: you can check this.",
  "Idempotency is how you say: the world may repeat itself; outcomes won't.",
  "Latency is the universe refusing to be instant for free.",
  "Dark mode won't save a layout that fights cognition.",
  "The best grant paragraph sounds obvious once it's written — that's the trick.",
  "Kids deserve tools that don't treat curiosity as a funnel.",
  "A DAG isn't ruthless — it's honest about merges.",
  "Verification is boring until it prevents a very interesting disaster.",
  "The graph can be messy; pick one edge and tighten it.",
  "Hydration is infrastructure. So is calcium management — ask your clinician, not a meme.",
  "If it's kind and true, it can ship. If it's only clever, rewrite.",
  "The mesh laughs at hierarchies — then routes around them.",
  "Documentation ages like copper: it looks better when maintained.",
  "A fortune is a placebo with good UX — still drink water.",
  "Anagrams are graphs on letters — you're allowed to enjoy that.",
  "Wordle is a ritual: small stakes, clean feedback, shared language.",
  "The operator's superpower is knowing when to stop optimizing and start resting.",
  "Sometimes the deploy is fine; the nervous system isn't — both can be true.",
  "A rate limiter is a love letter to your database's sleep schedule.",
  "The cage metaphor is about care boundaries — not cages as cruelty.",
  "PHOS says: wonder is allowed. So are naps.",
  "FORGE says: diffs end debates that vibes lengthen.",
  "COUNSEL says: cite, label, sleep.",
  "SCRIBE says: if it mattered, log the humane version.",
];

/** Wrong guesses before hangman loss (lexicon words are short). */
export const HANGMAN_MAX_WRONG = 8;
