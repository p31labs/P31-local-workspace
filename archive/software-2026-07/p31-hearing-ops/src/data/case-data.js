// Case data — Johnson v. Johnson, 2025CV936
// Last updated: June 21, 2026

export const CORAL = '#cc6247'
export const DARK = '#0A0A0F'
export const DARKER = '#06060A'
export const SURFACE = '#12121A'
export const SURFACE_LIGHT = '#1A1A25'
export const TEXT = '#E8E6E3'
export const TEXT_DIM = '#8A8A95'
export const GOLD = '#FFD700'
export const GREEN = '#4ADE80'
export const RED = '#FF4444'
export const BLUE = '#60A5FA'
export const CYAN = '#00e8ff'

export const fontSans = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
export const fontMono = "'Space Mono', 'SF Mono', 'Menlo', ui-monospace, monospace"

export const tabs = [
  { id: 'status', label: 'STATUS', icon: '🔺' },
  { id: 'mission', label: 'MISSION', icon: '⚡' },
  { id: 'docket', label: 'DOCKET', icon: '📋' },
  { id: 'law', label: 'LAW', icon: '⚖️' },
  { id: 'script', label: 'SCRIPT', icon: '📜' },
  { id: 'scenarios', label: 'SCENARIOS', icon: '⚡' },
  { id: 'rules', label: 'RULES', icon: '🛡️' },
  { id: 'folder', label: 'FOLDER', icon: '📁' },
  { id: 'omnibus', label: 'VAULT', icon: '💎' },
]

export const scenarios = [
  {
    id: 'no-show',
    title: 'McGhan No-Show',
    subtitle: 'WebEx motion unruled, counsel absent',
    color: GREEN,
    steps: [
      "State for the record: 'Plaintiff's counsel filed a Motion to Appear via WebEx on April 7, 2026. No order granting that motion appears on the docket. Counsel is not present.'",
      'Move to dismiss Third Complaint for Contempt for failure to prosecute.',
      "State: 'The movant scheduled this hearing, the movant bears the burden of proof, and the movant is not present to carry that burden.'",
      'If judge continues instead of dismissing: note 70 days separated from children; ask to exercise paragraph 6 supervised visitation this Saturday.',
      'Carrie may be in the gallery — do not address her; stay focused on the Court.',
    ],
  },
  {
    id: 'webex-granted',
    title: 'WebEx Granted from Bench',
    subtitle: 'Judge allows McGhan remote appearance',
    color: GOLD,
    steps: [
      "Object under USCR 9.2(F)(2): 'Your Honor, I object to opposing counsel's remote appearance.'",
      "State grounds: 'I am pro se. I face potential incarceration. The movant bears the burden of proof. Turner v. Rogers, 564 U.S. 431, requires enhanced procedural safeguards when there is a represented/unrepresented asymmetry. Remote prosecution of contempt while I stand in person deepens that asymmetry.'",
      'Request ruling on the record before proceeding.',
      "If overruled: 'I note my objection for the record and preserve it for appeal.'",
      'Deliver timeline: Third Complaint (Entry 92, April 4) predates signed Order on Pending Motions (Entry 104, April 14) by ten days — nunc pro tunc cannot create retroactive contempt liability. Del-Cook Timber, 248 Ga. App. 734.',
      'Regardless of outcome, ask to exercise paragraph 6 visitation this Saturday.',
    ],
  },
  {
    id: 'hearing-proceeds',
    title: 'Hearing Proceeds',
    subtitle: 'McGhan present (in person or WebEx approved)',
    color: CORAL,
    steps: [
      'Announce audio recording under USCR 22(D)(1).',
      'Deliver opening + timeline from SCRIPT (under 2 minutes).',
      'Primary defense: Entry 92 (April 4) cites an order that was not signed until Entry 104 (April 14). Contempt cannot rest on an order that postdates the complaint by ten days.',
      'Secondary (only if asked): unauthorized entry April 4; Messenger Kids logs (child-initiated contact).',
      'Regardless of outcome, ask to exercise paragraph 6 supervised visitation this Saturday.',
    ],
  },
  {
    id: 'continuance',
    title: 'Judge Continues Hearing',
    subtitle: 'Postponement for any reason',
    color: BLUE,
    steps: [
      'Do not oppose continuance — more time helps retained counsel.',
      "State: 'Your Honor, I do not oppose a continuance, but I have been separated from my children for 70 days. I ask the Court to address visitation today regardless — specifically paragraph 6 supervised visitation this Saturday.'",
      'Request a written order on contact if the contempt hearing is continued.',
      'Regardless of outcome, repeat request for Saturday paragraph 6 visitation.',
    ],
  },
  {
    id: 'incarceration',
    title: 'Court Threatens Incarceration',
    subtitle: 'Worst case — stay calm',
    color: RED,
    steps: [
      "Invoke Turner v. Rogers: 'Your Honor, under Turner v. Rogers, 564 U.S. 431, the Supreme Court held that enhanced procedural safeguards are required when a represented party seeks incarceration of an unrepresented party for civil contempt.'",
      "State inability to pay: 'I have $5 in total assets, zero income, enrolled in SNAP and Medicaid. Any purge condition requiring payment constitutes imprisonment for inability to pay, violating the Fourteenth Amendment.'",
      "Request appointment of counsel: 'Under Miller v. Deal, 295 Ga. 560, due process may require appointment of counsel for indigent parents facing incarceration in civil contempt.'",
      "State clearly: 'I am not refusing to comply. I am unable to comply. There is a constitutional difference.'",
      'Hand clerk Documents 13–14 immediately if contempt found: Supersedeas + Notice of Appeal.',
    ],
  },
]

export const openingScript = [
  {
    label: 'OPENING (SAY EXACTLY)',
    text: "Your Honor, I wish to inform the Court and all parties that I am making an audio recording of this proceeding under Uniform Superior Court Rule 22(D)(1). I am a person with documented disabilities — Autism Spectrum Disorder, ADHD, and chronic Hypoparathyroidism — and I have my disability support person, Brenda O'Dell, present at counsel table pursuant to my ADA accommodation requests at Docket Entries 23, 78, and 103.",
  },
  {
    label: 'TIMELINE STATEMENT (UNDER 90 SECONDS)',
    text: "Your Honor, I'd like to present a brief timeline.\n\nOn March 18, this Court heard pending motions and directed Plaintiff's counsel to draft an order. That order was not signed until April 14 — twenty-seven days later and two days before this hearing.\n\nThe Third Complaint for Contempt was filed on April 4. The order it references did not exist as a signed document on that date. It did not exist on April 7 when the hearing was noticed. It was signed nunc pro tunc on April 14.\n\nA party cannot be held in contempt for violating an order that was not signed until ten days after the complaint was filed. Nunc pro tunc corrects the record of what was ordered — it does not create retroactive contempt liability. Del-Cook Timber, 248 Ga. App. 734.\n\nAdditionally, the order contains factual errors. Paragraph 10 states I earned $97,000 annually. My W-2 reflects $74,627.59. It states I voluntarily resigned under DOGE initiatives. I am a DoD civilian engineering technician with FERS Disability Retirement pending — not military, not a voluntary resignation.\n\nI have complied with every evaluation this Court directed. Dr. Maughon confirmed autism and ADHD on March 24. No bipolar disorder. No mania. I produced discovery on March 26 and supplemented it on April 14. I have zero income and receive SNAP and Medicaid.\n\nI am not asking this Court to set aside the April 14 order. I am asking this Court to dismiss the Third Complaint for Contempt because it predates the order it cites. And I am asking to exercise the supervised visitation provided in paragraph 6 of that order this Saturday. My mother is available to supervise.",
  },
]

export const scriptResponses = [
  {
    label: 'WHEN MCGHAN PRESENTS',
    text: 'Say NOTHING. Write notes. No reactions. Brenda hand on arm = grounding.',
  },
  {
    label: 'THREE ANCHORS',
    text: '(1) "The documentary record shows..." (2) "I am complying with the orders of this Court." (3) "I respectfully refer the Court to [specific document]."',
  },
  {
    label: 'HOUSE / VACATE',
    text: 'The order was signed April 14 with a vacate date of April 4. I received it at 3:58 PM on April 14. I am working to comply. I cannot comply with a date that had already passed before I received the order.',
  },
  {
    label: 'MORTGAGE / MONEY',
    text: 'I have $5 in total assets and zero income. I did not willfully refuse — I lack the present ability.',
  },
  {
    label: 'P31 / RESEARCH / AI',
    text: 'P31 Labs, Inc. is a Georgia domestic nonprofit corporation (EIN 42-1888158), 501(c)(3) pending. It has zero revenue.',
  },
  {
    label: '"FIVE MILLION DOLLARS"',
    text: 'That is not an accurate characterization. I respectfully ask the Court to refer to the transcript, which I paid for on March 19 and have not received.',
  },
  {
    label: 'SIGNATURE PAGE (IF RELEVANT)',
    text: "The signature page of Entry 104 reflects a correction from 'March' to 'April,' indicating the order was originally drafted with a March signing date. The order was actually signed April 14.",
  },
  {
    label: 'COMPOSURE BREAK',
    text: "Your Honor, I'd like a moment to collect my thoughts. I have a documented disability that affects my ability to process information under pressure.",
  },
  {
    label: 'TRANSCRIPT',
    text: 'I paid $75.80 for the March 18 transcript on March 19. Two written requests made. No delivery. I proceed without it through no fault of my own.',
  },
]

export const scriptClose = {
  label: 'THE CLOSE (IF GIVEN THE OPPORTUNITY)',
  text: "Your Honor, I have been separated from my children for seventy days. My son turned ten without hearing from his father. My daughter has a medical condition that is worsened by exactly this kind of disruption. The children called me on Messenger Kids — every contact was initiated by them. I answered.\n\nI am not a danger to my children. I am their father. I built them a game. I filed for disability because I wanted to get better for them. Dr. Maughon cleared me last month.\n\nThe April 14 order provides for supervised visitation at paragraph 6. I am prepared to comply immediately. I am asking this Court to let me see my children this Saturday.",
}

export const scriptContemptFound = {
  label: 'IF CONTEMPT FOUND',
  text: 'Hand clerk Documents 13–14 IMMEDIATELY: Supersedeas Application + Notice of Intent to Appeal. Do not leave without filing.',
}

export const secondaryDefenses = [
  {
    label: 'UNAUTHORIZED ENTRY (April 4)',
    text: 'The photographs attached to the Third Complaint were obtained when Plaintiff entered the marital home on April 4 without a signed court order. The Consent Temporary Order at Entry 29, paragraph 4, grants temporary exclusive use and possession. Under O.C.G.A. § 9-11-34, entry upon land for inspection requires a court order or party agreement.',
  },
  {
    label: 'MESSENGER KIDS LOGS',
    text: 'The contempt allegations regarding communication with the children are contradicted by the Messenger Kids platform logs, which demonstrate that the children initiated all contact. I answered calls from my children. I did not initiate them.',
  },
  {
    label: 'OCTOBER 23 CONSENT ORDER',
    text: "The October 23, 2025 Consent Temporary Order bears the signature of attorney Joseph East, who was terminated on October 19, 2025, and whose withdrawal was signed by the Court on October 20. Under Lewis v. Uselton, 202 Ga. App. 875, a discharged attorney's authority is rebutted when opposing counsel has actual knowledge of termination.",
  },
]

export const docketEntries = [
  { num: '23', date: 'Oct 22, 2025', desc: 'ADA Accommodation Request #1', status: 'no-response' },
  { num: '29', date: 'Oct 23, 2025', desc: 'Consent Temporary Order — East signed 3 days post-withdrawal', status: 'defective' },
  { num: '57', date: 'Feb 5, 2026', desc: "Hearing — 'MCGHAN TO DRAFT ORDER' — no order followed", status: 'inchoate' },
  { num: '78', date: 'Mar 5, 2026', desc: 'ADA Accommodation Request #2', status: 'no-response' },
  { num: '88', date: 'Mar 18, 2026', desc: 'Exhibits from March 18 hearing', status: 'neutral' },
  { num: '89', date: 'Mar 18, 2026', desc: "Clerk's Note", status: 'neutral' },
  { num: '90', date: 'Mar 18, 2026', desc: "Calendar — 'MCGHAN TO DRAFT ORDER' — NOT an Order", status: 'inchoate' },
  { num: '91', date: 'Mar 26, 2026', desc: "Certificate of Service (Will's discovery)", status: 'neutral' },
  { num: '92', date: 'Apr 4, 2026', desc: 'Third Complaint for Contempt — predates signed Entry 104', status: 'defective' },
  { num: '93', date: 'Apr 7, 2026', desc: 'Notice of Hearing (McGhan)', status: 'neutral' },
  { num: '94', date: 'Apr 7, 2026', desc: 'Motion to Appear via WebEx — not ruled', status: 'defective' },
  { num: '95', date: 'Apr 7, 2026', desc: 'Proposed Order (WebEx) — unsigned', status: 'defective' },
  { num: '96', date: 'Apr 10, 2026', desc: 'Response to Third Contempt (Will)', status: 'neutral' },
  { num: '97', date: 'Apr 10, 2026', desc: 'Motion for Continuance (Will)', status: 'neutral' },
  { num: '98', date: 'Apr 10, 2026', desc: 'Motion for Protective Order (Will)', status: 'neutral' },
  { num: '99', date: 'Apr 10, 2026', desc: 'Cross-Motion for Contempt Against Plaintiff (Will)', status: 'neutral' },
  { num: '100', date: 'Apr 10, 2026', desc: 'Motion to Strike Paragraph 9 (Will)', status: 'neutral' },
  { num: '101', date: 'Apr 10, 2026', desc: 'Notice of POA and Supported Decision-Making (Will)', status: 'neutral' },
  { num: '102', date: 'Apr 10, 2026', desc: 'Motion to Dismiss Third Contempt (Will)', status: 'neutral' },
  { num: '103', date: 'Apr 10, 2026', desc: 'ADA Accommodation Request #3 (Will)', status: 'no-response' },
  { num: '104', date: 'Apr 14, 2026', desc: 'Order on Pending Motions — signed nunc pro tunc to Mar 18 — KEY ORDER', status: 'key' },
  { num: '105', date: 'Apr 16, 2026', desc: 'Calendar — PER NOH - JM', status: 'neutral' },
  { num: '106', date: 'Apr 16, 2026', desc: 'Hearing held — contempt continued, visitation not restored', status: 'neutral' },
  { num: '107', date: 'Apr 20, 2026', desc: 'Motion to Compel Discovery (McGhan)', status: 'neutral' },
  { num: '108', date: 'Apr 28, 2026', desc: 'Response to Motion to Compel (Will)', status: 'neutral' },
  { num: '109', date: 'May 5, 2026', desc: 'Status Conference — no substantive rulings', status: 'neutral' },
  { num: '110', date: 'May 15, 2026', desc: 'Motion for Sanctions (McGhan)', status: 'neutral' },
  { num: '111', date: 'May 22, 2026', desc: 'Response to Motion for Sanctions (Will)', status: 'neutral' },
  { num: '112', date: 'Jun 1, 2026', desc: 'P31 Labs — NLnet NGI Zero Commons draft submitted', status: 'neutral' },
  { num: '113', date: 'Jun 11, 2026', desc: 'Open Collective activated — fiscal sponsor live', status: 'neutral' },
  { num: '114', date: 'Jun 15, 2026', desc: 'Alignerr outreach — Lauren White (AI evaluation opportunity)', status: 'neutral' },
  { num: '115', date: 'Jun 18, 2026', desc: 'Status hearing — Chief Judge Scarlett presiding', status: 'neutral' },
]

export const legalCitations = [
  { case: 'O.C.G.A. § 9-11-58(b)', holding: 'No judgment effective until set forth in writing, signed by judge, filed with clerk.', category: 'INCHOATE' },
  { case: 'Bloodworth v. Thompson, 230 Ga. 628 (1973)', holding: "Oral ruling is 'inchoate and of no effect for any purpose.'", category: 'INCHOATE' },
  { case: 'Shirley v. Abshire, 288 Ga. App. 819 (2007)', holding: 'Contempt reversed — based on verbal order never reduced to writing.', category: 'INCHOATE' },
  { case: 'Tate v. Tate, 340 Ga. App. 361 (2017)', holding: 'No contempt authority without proper written consent order.', category: 'INCHOATE' },
  { case: 'Del-Cook Timber v. Herndon, 248 Ga. App. 734 (2001)', holding: 'Nunc pro tunc cannot create new substantive obligations retroactively.', category: 'NUNC PRO TUNC' },
  { case: 'Adams v. Payne, 219 Ga. 638 (1964)', holding: 'Nunc pro tunc cannot supply an action the court failed to take.', category: 'NUNC PRO TUNC' },
  { case: 'Floyd v. Floyd, 247 Ga. 551 (1981)', holding: 'Ability to pay and willful refusal both essential to civil contempt.', category: 'CONTEMPT' },
  { case: 'O.C.G.A. § 19-9-3(d)', holding: 'Express GA policy favoring continuing contact with both parents.', category: 'VISITATION' },
  { case: 'Troxel v. Granville, 530 U.S. 57 (2000)', holding: 'Parental rights are among the oldest fundamental liberty interests.', category: 'PARENTAL RIGHTS' },
  { case: 'Turner v. Rogers, 564 U.S. 431 (2011)', holding: 'Enhanced procedural safeguards needed when represented party seeks incarceration of unrepresented party.', category: 'DUE PROCESS' },
  { case: 'Miller v. Deal, 295 Ga. 560 (2014)', holding: 'Due process may require counsel for indigent parents facing incarceration.', category: 'DUE PROCESS' },
  { case: 'USCR 9.2(F)(2)', holding: 'Court must sustain or overrule objection to remote proceeding before conducting it.', category: 'WEBEX' },
  { case: 'USCR 22(D)(1)', holding: 'Self-represented parties may make audio recordings.', category: 'RECORDING' },
  { case: 'Lewis v. Uselton, 202 Ga. App. 875 (1992)', holding: "Discharged attorney's authority severed with actual knowledge.", category: 'CONSENT ORDER' },
  { case: '42 U.S.C. § 12132', holding: 'ADA Title II — no qualified individual excluded from public entity services.', category: 'ADA' },
  { case: 'United States v. Georgia, 546 U.S. 151 (2006)', holding: 'Title II ADA validly abrogates state sovereign immunity.', category: 'ADA' },
  { case: 'Perez v. Sturgis, 598 U.S. 142 (2023)', holding: 'IDEA exhaustion not required for ADA Title II damages claims.', category: 'ADA' },
]

export const rules = {
  do: [
    'Announce audio recording at the start (USCR 22(D)(1))',
    'Be brief — opening under 2 minutes',
    'Let the docket speak — it IS the evidence',
    'Ask about paragraph 6 visitation regardless of contempt outcome',
    'Stay seated when possible (ADA, calm optics)',
    'Refer to documents by docket entry number',
    "Say 'respectfully' before every request",
    'Pause before responding — 3 seconds minimum',
    "If you don't understand a question: 'Could you rephrase that, Your Honor?'",
    'Have Brenda at counsel table as ADA support',
    'Bring 3 copies of everything (judge, McGhan, you)',
    "If asked about DOGE or resignation: 'Used VERA for disability testing. FERS pending.'",
  ],
  dont: [
    'DO NOT mention Camden County corruption, GBI, spaceport, Aldridge, Ashe',
    'DO NOT mention quantum mechanics, K₄, Posner molecules, or P31 Labs research',
    'DO NOT argue with McGhan directly — address the Court',
    'DO NOT raise your voice or speak rapidly',
    "DO NOT use the word 'manic' or reference the March 18 label",
    'DO NOT introduce text messages unless directly asked about visitation',
    'DO NOT volunteer information beyond what is asked',
    'DO NOT apologize for exercising your legal rights',
    "DO NOT mention military metaphors (Will's ex-father-in-law was Navy)",
  ],
}

export const folderChecklist = [
  { item: 'Docket printout (Entries 88–115)', checked: false },
  { item: 'Order on Pending Motions (Entry 104, 7 pages)', checked: false },
  { item: 'Consent Temporary Order (Entry 29, ¶4 exclusive possession)', checked: false },
  { item: 'Response to Third Complaint (Entry 96)', checked: false },
  { item: 'Motion to Dismiss Third Contempt (Entry 102)', checked: false },
  { item: 'Financial Affidavit ($5 total assets, $0 income)', checked: false },
  { item: 'Maughon letter (AuDHD confirmed, no bipolar)', checked: false },
  { item: 'ADA Accommodation Requests (Entries 23, 78, 103)', checked: false },
  { item: 'Cross-Motion for Contempt (Entry 99)', checked: false },
  { item: 'Supersedeas Application (only if contempt found)', checked: false },
  { item: 'Notice of Intent to Appeal (only if contempt found)', checked: false },
  { item: 'W-2 ($74,627.59 — rebuts ¶10 $97,000)', checked: false },
  { item: 'P31 Labs Certificate of Incorporation', checked: false },
  { item: 'EIN 42-1888158 (CP 575E)', checked: false },
  { item: 'Transcript invoice #000031 — $75.80 paid March 19', checked: false },
  { item: 'Phone/tablet for audio recording', checked: false },
  { item: 'Pen and notepad', checked: false },
  { item: 'Water bottle', checked: false },
  { item: 'Medication (calcium, prescribed meds)', checked: false },
]

export const statusTimeline = [
  { date: 'Apr 16, 2026', event: 'Contempt hearing — continued, no ruling on visitation', icon: '⚖️' },
  { date: 'Apr 20, 2026', event: 'McGhan filed Motion to Compel Discovery', icon: '📋' },
  { date: 'May 5, 2026', event: 'Status conference — no substantive rulings', icon: '📅' },
  { date: 'May 15, 2026', event: 'Motion for Sanctions filed by McGhan', icon: '⚠️' },
  { date: 'Jun 1, 2026', event: 'NLnet NGI Zero Commons draft submitted', icon: '📝' },
  { date: 'Jun 10, 2026', event: 'Docs 01-04 filed on PeachCourt portal', icon: '📁' },
  { date: 'Jun 11, 2026', event: 'Open Collective activated — fiscal sponsor live', icon: '💰' },
  { date: 'Jun 11, 2026', event: 'McFeron liability brief sent to GA Tools for Life', icon: '📨' },
  { date: 'Jun 15, 2026', event: 'Alignerr outreach — Lauren White (AI evaluation)', icon: '🤖' },
  { date: 'Jun 18, 2026', event: 'Status hearing — Chief Judge Scarlett presiding', icon: '⚖️' },
]

export const deadlines = [
  { date: 'Jul 2, 2026', task: 'Georgia Annual Registration', priority: 'HARD' },
  { date: 'Jul 31, 2026', task: 'ASAN Teighlor McGee Grant (up to $6,250)', priority: 'HIGH' },
  { date: 'Sep 1, 2026', task: 'NSF SBIR Phase I', priority: 'HIGH' },
  { date: 'Sep 30, 2026', task: 'FERS Disability Retirement', priority: 'HARD' },
]
