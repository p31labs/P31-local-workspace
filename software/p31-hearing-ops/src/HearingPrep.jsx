import { useState } from 'react'
import P31OmnibusVault from './P31OmnibusVault.jsx'

const CORAL = '#cc6247'
const DARK = '#0A0A0F'
const DARKER = '#06060A'
const SURFACE = '#12121A'
const SURFACE_LIGHT = '#1A1A25'
const TEXT = '#E8E6E3'
const TEXT_DIM = '#8A8A95'
const GOLD = '#FFD700'
const GREEN = '#4ADE80'
const RED = '#FF4444'
const BLUE = '#60A5FA'

const tabs = [
  { id: 'mission', label: 'MISSION', icon: '🔺' },
  { id: 'scenarios', label: 'SCENARIOS', icon: '⚡' },
  { id: 'script', label: 'SCRIPT', icon: '📜' },
  { id: 'docket', label: 'DOCKET', icon: '📋' },
  { id: 'law', label: 'LAW', icon: '⚖️' },
  { id: 'rules', label: 'RULES', icon: '🛡️' },
  { id: 'folder', label: 'FOLDER', icon: '📁' },
  { id: 'omnibus', label: 'VAULT', icon: '💎' },
]

const scenarios = [
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
      'Regardless of outcome, ask to exercise paragraph 6 supervised visitation this Saturday. Carrie may be present as support — address the Court only.',
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
      "State inability to pay purge conditions: 'I have $5 in total assets, zero income, and am enrolled in SNAP and Medicaid. Any purge condition requiring payment would constitute imprisonment for inability to pay, which violates the Fourteenth Amendment.'",
      "Request appointment of counsel before any incarceration: 'Under Miller v. Deal, 295 Ga. 560, due process may require appointment of counsel for indigent parents facing incarceration in civil contempt.'",
      "State clearly: 'I am not refusing to comply. I am unable to comply. There is a constitutional difference.'",
      'Hand clerk Documents 13–14 immediately if contempt found: Supersedeas + Notice of Appeal. Still ask for paragraph 6 visitation when safe to do so.',
    ],
  },
]

const openingScript = [
  {
    label: 'OPENING (SAY EXACTLY)',
    text: "Your Honor, I wish to inform the Court and all parties that I am making an audio recording of this proceeding under Uniform Superior Court Rule 22(D)(1). I am a person with documented disabilities — Autism Spectrum Disorder, ADHD, and chronic Hypoparathyroidism — and I have my disability support person, Brenda O'Dell, present at counsel table pursuant to my ADA accommodation requests at Docket Entries 23, 78, and 103.",
  },
  {
    label: 'TIMELINE STATEMENT (UNDER 90 SECONDS)',
    text: "Your Honor, I'd like to present a brief timeline.\n\nOn March 18, this Court heard pending motions and directed Plaintiff's counsel to draft an order. That order was not signed until April 14 — twenty-seven days later and two days before this hearing.\n\nThe Third Complaint for Contempt was filed on April 4. The order it references did not exist as a signed document on that date. It did not exist on April 7 when the hearing was noticed. It was signed nunc pro tunc on April 14.\n\nA party cannot be held in contempt for violating an order that was not signed until ten days after the complaint was filed. Nunc pro tunc corrects the record of what was ordered — it does not create retroactive contempt liability. Del-Cook Timber, 248 Ga. App. 734.\n\nAdditionally, the order contains factual errors. Paragraph 10 states I earned $97,000 annually. My W-2 reflects $74,627.59. It states I voluntarily resigned under DOGE initiatives. I am a DoD civilian engineering technician with FERS Disability Retirement pending — not military, not a voluntary resignation.\n\nI have complied with every evaluation this Court directed. Dr. Maughon confirmed autism and ADHD on March 24. No bipolar disorder. No mania. I produced discovery on March 26 and supplemented it on April 14. I have zero income and receive SNAP and Medicaid.\n\nI am not asking this Court to set aside the April 14 order. I am asking this Court to dismiss the Third Complaint for Contempt because it predates the order it cites. And I am asking to exercise the supervised visitation provided in paragraph 6 of that order this Saturday. My mother is available to supervise. I am asking to see my children.",
  },
]

const scriptResponses = [
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
    text: 'P31 Labs, Inc. is a Georgia domestic nonprofit corporation incorporated April 3, 2026, with an EIN assigned April 13. It has zero revenue.',
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

const scriptClose = {
  label: 'THE CLOSE (IF GIVEN THE OPPORTUNITY)',
  text: "Your Honor, I have been separated from my children for seventy days. My son turned ten without hearing from his father. My daughter has a medical condition that is worsened by exactly this kind of disruption. The children called me on Messenger Kids — every contact was initiated by them. I answered.\n\nI am not a danger to my children. I am their father. I built them a game for Bash's birthday. I filed for disability because I wanted to get better for them. The Secretary of State certified my nonprofit yesterday. Dr. Maughon cleared me last month.\n\nThe April 14 order provides for supervised visitation at paragraph 6. I am prepared to comply immediately. I am asking this Court to let me see my children this Saturday.",
}

const scriptContemptFound = {
  label: 'IF CONTEMPT FOUND',
  text: 'Hand clerk Documents 13–14 IMMEDIATELY: Supersedeas Application + Notice of Intent to Appeal. Do not leave without filing.',
}

const secondaryDefenses = [
  {
    label: 'UNAUTHORIZED ENTRY (April 4)',
    text: 'The photographs attached to the Third Complaint were obtained when Plaintiff entered the marital home on April 4, 2026, without a signed court order. The Consent Temporary Order at Docket Entry 29, paragraph 4, grants me temporary exclusive use and possession. Plaintiff produced no signed order authorizing entry. Under O.C.G.A. § 9-11-34, entry upon land for inspection requires a court order or party agreement. Evidence obtained through unauthorized entry should be excluded.',
  },
  {
    label: 'MESSENGER KIDS LOGS',
    text: 'The contempt allegations regarding communication with the children are contradicted by the Messenger Kids platform logs, which demonstrate that the children initiated all contact. I answered calls from my children. I did not initiate them.',
  },
  {
    label: 'OCTOBER 23 CONSENT ORDER',
    text: "If the Court looks to the October 23, 2025 Consent Temporary Order as the basis for any obligation — that order bears the signature of attorney Joseph East, who was terminated on October 19, 2025, and whose withdrawal was signed by the Court on October 20. The document was filed three days after the signatory's authority was legally severed. Under Lewis v. Uselton, 202 Ga. App. 875, a discharged attorney's authority is rebutted when opposing counsel has actual knowledge of termination. McGhan was served Notification of No Counsel on October 21.",
  },
]

const docketEntries = [
  { num: '23', date: 'Oct 22, 2025', desc: 'ADA Accommodation Request #1', status: 'no-response' },
  { num: '29', date: 'Oct 23, 2025', desc: 'Consent Temporary Order — East signed 3 days post-withdrawal', status: 'defective' },
  { num: '57', date: 'Feb 5, 2026', desc: "Hearing — 'MCGHAN TO DRAFT ORDER' — no order followed", status: 'inchoate' },
  { num: '78', date: 'Mar 5, 2026', desc: 'ADA Accommodation Request #2', status: 'no-response' },
  { num: '88', date: 'Mar 18, 2026', desc: 'Exhibits from March 18 hearing', status: 'neutral' },
  { num: '89', date: 'Mar 18, 2026', desc: "Clerk's Note", status: 'neutral' },
  { num: '90', date: 'Mar 18, 2026', desc: "Calendar — 'MCGHAN TO DRAFT ORDER' — NOT an Order", status: 'inchoate' },
  { num: '91', date: 'Mar 26, 2026', desc: "Certificate of Service (Will's discovery response)", status: 'neutral' },
  { num: '92', date: 'Apr 4, 2026', desc: 'Third Complaint for Contempt — predates signed Entry 104', status: 'defective' },
  { num: '93', date: 'Apr 7, 2026', desc: 'Notice of Hearing (McGhan)', status: 'neutral' },
  { num: '94', date: 'Apr 7, 2026', desc: 'Motion to Appear via WebEx — not ruled / proposed order unsigned', status: 'defective' },
  { num: '95', date: 'Apr 7, 2026', desc: 'Proposed Order (WebEx) — unsigned', status: 'defective' },
  { num: '96', date: 'Apr 10, 2026', desc: 'Response to Third Contempt (Will)', status: 'neutral' },
  { num: '97', date: 'Apr 10, 2026', desc: 'Motion for Continuance (Will)', status: 'neutral' },
  { num: '98', date: 'Apr 10, 2026', desc: 'Motion for Protective Order — Discovery (Will)', status: 'neutral' },
  { num: '99', date: 'Apr 10, 2026', desc: 'Cross-Motion for Contempt Against Plaintiff (Will)', status: 'neutral' },
  { num: '100', date: 'Apr 10, 2026', desc: 'Motion to Strike Paragraph 9 (Will)', status: 'neutral' },
  { num: '101', date: 'Apr 10, 2026', desc: 'Notice of POA and Supported Decision-Making (Will)', status: 'neutral' },
  { num: '102', date: 'Apr 10, 2026', desc: 'Motion to Dismiss Third Contempt (Will)', status: 'neutral' },
  { num: '103', date: 'Apr 10, 2026', desc: 'ADA Accommodation Request (Will)', status: 'no-response' },
  {
    num: '104',
    date: 'Apr 14, 2026',
    desc: 'Order on Pending Motions — signed, nunc pro tunc to Mar 18 — KEY ORDER',
    status: 'key',
  },
  { num: '105', date: 'Apr 16, 2026', desc: 'Calendar — PER NOH - JM', status: 'neutral' },
]

const legalCitations = [
  { case: 'O.C.G.A. § 9-11-58(b)', holding: 'No judgment effective for any purpose until set forth in writing, signed by judge, filed with clerk.', category: 'INCHOATE' },
  { case: 'Bloodworth v. Thompson, 230 Ga. 628 (1973)', holding: "Oral ruling is 'inchoate and of no effect for any purpose.'", category: 'INCHOATE' },
  { case: 'Shirley v. Abshire, 288 Ga. App. 819 (2007)', holding: 'Contempt reversed — based on verbal order never reduced to writing.', category: 'INCHOATE' },
  { case: 'Tate v. Tate, 340 Ga. App. 361 (2017)', holding: 'No contempt authority without proper written consent order.', category: 'INCHOATE' },
  {
    case: 'Del-Cook Timber Co. v. Herndon, 248 Ga. App. 734 (2001)',
    holding:
      'Nunc pro tunc cannot create new substantive obligations retroactively beyond correcting the record of what was decided.',
    category: 'NUNC PRO TUNC',
  },
  {
    case: 'Adams v. Payne, 219 Ga. 638 (1964)',
    holding: 'Nunc pro tunc cannot supply an action the court failed to take.',
    category: 'NUNC PRO TUNC',
  },
  {
    case: 'Floyd v. Floyd, 247 Ga. 551 (1981)',
    holding: 'Ability to pay child support and willful refusal are both essential to civil contempt — inability to pay is a defense.',
    category: 'CONTEMPT',
  },
  { case: 'O.C.G.A. § 19-9-3(d)', holding: 'Express Georgia policy favoring continuing contact with both parents.', category: 'VISITATION' },
  {
    case: 'Troxel v. Granville, 530 U.S. 57 (2000)',
    holding: 'Parental rights are among the oldest fundamental liberty interests recognized by the Court.',
    category: 'PARENTAL RIGHTS',
  },
  { case: 'Turner v. Rogers, 564 U.S. 431 (2011)', holding: 'Enhanced procedural safeguards required when represented party seeks incarceration of unrepresented party.', category: 'DUE PROCESS' },
  { case: 'Miller v. Deal, 295 Ga. 560 (2014)', holding: 'Due process may require counsel for indigent parents facing incarceration in civil contempt.', category: 'DUE PROCESS' },
  { case: 'USCR 9.2(F)(2)', holding: 'Court must sustain or overrule objection to remote proceeding before conducting it.', category: 'WEBEX' },
  { case: 'USCR 22(D)(1)', holding: 'Self-represented parties may make audio recordings in nondisruptive manner.', category: 'RECORDING' },
  { case: 'Lewis v. Uselton, 202 Ga. App. 875 (1992)', holding: "Discharged attorney's authority severed; presumption rebutted with actual knowledge.", category: 'CONSENT ORDER' },
]

const rules = {
  do: [
    'Announce audio recording at the start (USCR 22(D)(1))',
    'Be brief — opening under 2 minutes',
    'Let the docket speak — it IS the evidence',
    'Ask about paragraph 6 visitation regardless of contempt outcome',
    'Stay seated when possible (ADA, calm optics)',
    'Refer to documents by docket entry number',
    "Say 'respectfully' before every request",
    'Pause before responding to any question — 3 seconds minimum',
    "If you don't understand a question, say 'Could you rephrase that, Your Honor?'",
    'Have Brenda at counsel table as ADA support',
    'Bring 3 copies of everything (judge, McGhan, you)',
    "If asked about DOGE or resignation: 'I used VERA to pursue disability testing. FERS Disability Retirement is pending.'",
  ],
  dont: [
    'DO NOT mention Camden County corruption, GBI, spaceport, Aldridge, Ashe',
    "DO NOT say 'kangaroo court,' 'making shit up,' or 'appellate court's wet dream'",
    'DO NOT mention quantum mechanics, Posner molecules, K₄, or P31 Labs mission',
    'DO NOT explain your research methodology or AI tools',
    'DO NOT argue with McGhan directly — address the Court',
    'DO NOT raise your voice or speak rapidly',
    "DO NOT use the word 'manic' or reference the March 18 label",
    'DO NOT introduce the text messages unless directly asked about visitation',
    'DO NOT volunteer information beyond what is asked',
    'DO NOT apologize for exercising your legal rights',
    "DO NOT say 'funny business' about the signature page — state the correction plainly",
    'DO NOT mention the isomorphism analysis or institutional pattern research',
  ],
}

const folderChecklist = [
  { item: 'Docket printout (Entries 88–105; Entry 104 key)', checked: false },
  { item: 'Order on Pending Motions (Entry 104, 7 pages — note signature page correction)', checked: false },
  { item: 'Consent Temporary Order (Entry 29, ¶4 exclusive possession)', checked: false },
  { item: 'Response to Third Complaint for Contempt (Entry 96)', checked: false },
  { item: 'Motion to Dismiss Third Contempt (Entry 102)', checked: false },
  { item: 'Affidavit re: April 4, 2026 events', checked: false },
  { item: 'Financial Affidavit ($5 total assets, $0 income)', checked: false },
  { item: 'Maughon letter (March 23/24 — no bipolar, AuDHD confirmed)', checked: false },
  { item: 'ADA Accommodation Requests (Entries 23, 78, 103)', checked: false },
  { item: 'Cross-Motion for Contempt Against Plaintiff (Entry 99)', checked: false },
  { item: 'Motion to Strike Paragraph 9 (Entry 100)', checked: false },
  { item: 'Notice of POA and Supported Decision-Making (Entry 101)', checked: false },
  { item: 'Supersedeas Application (clerk only if contempt found)', checked: false },
  { item: 'Notice of Intent to Appeal (clerk only if contempt found)', checked: false },
  { item: 'W-2 ($74,627.59 — rebuts ¶10 $97,000)', checked: false },
  { item: 'P31 Labs Certificate of Incorporation (April 15, 2026)', checked: false },
  { item: 'CP 575E — EIN 42-1888158', checked: false },
  { item: 'Transcript invoice #000031 — $75.80 paid March 19', checked: false },
  { item: 'Gmail screenshot — April 14 service email (3:58 PM)', checked: false },
  { item: 'Phone/tablet for audio recording', checked: false },
  { item: 'Pen and notepad for handwritten notes', checked: false },
  { item: 'Water bottle', checked: false },
  { item: 'Medication (calcium, prescribed meds)', checked: false },
]

const fontSans = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const fontMono = "'Space Mono', 'SF Mono', 'Menlo', ui-monospace, monospace"

function StatusBadge({ status }) {
  const colors = {
    inchoate: { bg: `${GOLD}22`, text: GOLD, label: 'INCHOATE' },
    defective: { bg: `${RED}22`, text: RED, label: 'DEFECTIVE' },
    'no-response': { bg: `${CORAL}22`, text: CORAL, label: 'NO RESPONSE' },
    key: { bg: `${GREEN}22`, text: GREEN, label: 'KEY ORDER' },
    neutral: { bg: `${TEXT_DIM}22`, text: TEXT_DIM, label: '—' },
  }
  const c = colors[status] || colors.neutral
  if (status === 'neutral') return null
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '2px 6px',
        borderRadius: 3,
        background: c.bg,
        color: c.text,
        fontFamily: fontMono,
      }}
    >
      {c.label}
    </span>
  )
}

function MissionTab() {
  const daysSince = Math.floor(
    (new Date(2026, 3, 16) - new Date(2026, 1, 5)) / 86400000,
  )
  return (
    <div style={{ padding: '20px 16px' }}>
      <div
        style={{
          textAlign: 'center',
          padding: '24px 16px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${SURFACE} 0%, ${DARKER} 100%)`,
          border: `1px solid ${CORAL}33`,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            color: CORAL,
            fontWeight: 700,
            marginBottom: 4,
            fontFamily: fontMono,
          }}
        >
          JOHNSON v. JOHNSON • 2025CV936
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: TEXT,
            lineHeight: 1.1,
            marginBottom: 4,
            fontFamily: fontSans,
          }}
        >
          CONTEMPT HEARING
        </div>
        <div style={{ fontSize: 14, color: TEXT_DIM, marginBottom: 12 }}>
          April 16, 2026 • 11:00 AM • Woodbine
        </div>
        <div style={{ fontSize: 13, color: TEXT_DIM }}>
          Chief Judge Stephen G. Scarlett
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <StatBox label="DAYS WITHOUT KIDS" value={daysSince} color={RED} />
        <StatBox label="TOTAL ASSETS" value="$5" color={GOLD} />
        <StatBox label="SIGNED ORDERS" value="2" color={GREEN} />
        <StatBox label="ADA RESPONSES" value="0" color={CORAL} />
      </div>
      <div
        style={{
          fontSize: 10,
          color: TEXT_DIM,
          textAlign: 'center',
          marginTop: -12,
          marginBottom: 16,
          lineHeight: 1.4,
          fontFamily: fontMono,
        }}
      >
        Two substantive signed orders on the docket (Entries 29 and 104); both
        have documented defects — see DOCKET + LAW.
      </div>
      <div
        style={{
          padding: '16px',
          borderRadius: 10,
          background: `${CORAL}11`,
          border: `1px solid ${CORAL}44`,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: CORAL,
            marginBottom: 8,
            fontFamily: fontMono,
          }}
        >
          PRIMARY DEFENSE
        </div>
        <div style={{ fontSize: 15, color: TEXT, lineHeight: 1.5 }}>
          Entry 92 (April 4) prosecuted contempt of an &quot;Order on Pending
          Motions&quot; that was not signed until Entry 104 (April 14).{' '}
          <strong style={{ color: CORAL }}>
            The complaint predates the signed order by ten days.
          </strong>{' '}
          Nunc pro tunc corrects the record of what was ordered; it does not create
          retroactive contempt liability. Del-Cook Timber, 248 Ga. App. 734. You
          are not asking to vacate Entry 104 — you are asking to dismiss the Third
          Contempt and to exercise paragraph 6 visitation.
        </div>
      </div>
      <div
        style={{
          padding: '16px',
          borderRadius: 10,
          background: SURFACE,
          border: `1px solid ${SURFACE_LIGHT}`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: GOLD,
            marginBottom: 8,
            fontFamily: fontMono,
          }}
        >
          PRIME DIRECTIVE
        </div>
        <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>
          Let the docket do the talking. Be calm, brief, mechanical. The system
          punished you for intensity on March 18 — tomorrow you give them nothing to
          pathologize. Entry 90 is the evidence. Let it speak.
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div
      style={{
        padding: '14px 12px',
        borderRadius: 10,
        background: SURFACE,
        border: `1px solid ${color}22`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          fontFamily: fontSans,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: TEXT_DIM,
          marginTop: 2,
          fontFamily: fontMono,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function ScenariosTab() {
  const [open, setOpen] = useState(null)
  return (
    <div style={{ padding: '20px 16px' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: TEXT_DIM,
          marginBottom: 16,
          fontFamily: fontMono,
        }}
      >
        DECISION TREE — TAP TO EXPAND
      </div>
      {scenarios.map((s) => (
        <div
          key={s.id}
          style={{
            marginBottom: 10,
            borderRadius: 10,
            background: SURFACE,
            border: `1px solid ${open === s.id ? `${s.color}66` : SURFACE_LIGHT}`,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(open === s.id ? null : s.id)}
            style={{
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              textAlign: 'left',
              font: 'inherit',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: s.color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${s.color}44`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
                {s.title}
              </div>
              <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>
                {s.subtitle}
              </div>
            </div>
            <div
              style={{
                color: TEXT_DIM,
                fontSize: 18,
                transform: open === s.id ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            >
              ›
            </div>
          </button>
          {open === s.id && (
            <div style={{ padding: '0 16px 16px' }}>
              {s.steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: `${s.color}0A`,
                    border: `1px solid ${s.color}18`,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: `${s.color}22`,
                      color: s.color,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: fontMono,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ScriptTab() {
  const [showSecondary, setShowSecondary] = useState(false)
  const [showResponses, setShowResponses] = useState(true)
  return (
    <div style={{ padding: '20px 16px' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: CORAL,
          marginBottom: 16,
          fontFamily: fontMono,
        }}
      >
        OPENING + TIMELINE — READ EXACTLY
      </div>
      {openingScript.map((block, i) => (
        <div
          key={i}
          style={{
            marginBottom: 14,
            padding: '14px 16px',
            borderRadius: 10,
            background: SURFACE,
            border: `1px solid ${i === 1 ? `${CORAL}44` : SURFACE_LIGHT}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: i === 1 ? CORAL : GOLD,
              marginBottom: 8,
              fontFamily: fontMono,
            }}
          >
            {i + 1}. {block.label}
          </div>
          <div
            style={{
              fontSize: 13,
              color: TEXT,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {block.text}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setShowResponses(!showResponses)}
        style={{
          padding: '14px 16px',
          borderRadius: 10,
          background: SURFACE,
          border: `1px solid ${GOLD}33`,
          cursor: 'pointer',
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          color: 'inherit',
          font: 'inherit',
          textAlign: 'left',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: GOLD,
              fontFamily: fontMono,
            }}
          >
            RESPONSE TEMPLATES
          </div>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>
            Tap lines to collapse when seated
          </div>
        </div>
        <div
          style={{
            color: TEXT_DIM,
            fontSize: 18,
            transform: showResponses ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          ›
        </div>
      </button>
      {showResponses &&
        scriptResponses.map((d, i) => (
          <div
            key={i}
            style={{
              marginTop: 10,
              padding: '14px 16px',
              borderRadius: 10,
              background: `${GOLD}08`,
              border: `1px solid ${GOLD}22`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: GOLD,
                marginBottom: 6,
                fontFamily: fontMono,
              }}
            >
              {d.label}
            </div>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>
              {d.text}
            </div>
          </div>
        ))}
      <div
        style={{
          marginTop: 14,
          padding: '14px 16px',
          borderRadius: 10,
          background: `${GREEN}0A`,
          border: `1px solid ${GREEN}33`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: GREEN,
            marginBottom: 8,
            fontFamily: fontMono,
          }}
        >
          {scriptClose.label}
        </div>
        <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          {scriptClose.text}
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          padding: '14px 16px',
          borderRadius: 10,
          background: `${RED}10`,
          border: `1px solid ${RED}44`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: RED,
            marginBottom: 8,
            fontFamily: fontMono,
          }}
        >
          {scriptContemptFound.label}
        </div>
        <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>
          {scriptContemptFound.text}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowSecondary(!showSecondary)}
        style={{
          padding: '14px 16px',
          borderRadius: 10,
          background: SURFACE,
          border: `1px solid ${SURFACE_LIGHT}`,
          cursor: 'pointer',
          marginTop: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          color: 'inherit',
          font: 'inherit',
          textAlign: 'left',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: BLUE,
              fontFamily: fontMono,
            }}
          >
            SECONDARY DEFENSES
          </div>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>
            Only if court asks about substance
          </div>
        </div>
        <div
          style={{
            color: TEXT_DIM,
            fontSize: 18,
            transform: showSecondary ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          ›
        </div>
      </button>
      {showSecondary &&
        secondaryDefenses.map((d, i) => (
          <div
            key={i}
            style={{
              marginTop: 10,
              padding: '14px 16px',
              borderRadius: 10,
              background: `${BLUE}08`,
              border: `1px solid ${BLUE}18`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: BLUE,
                marginBottom: 6,
                fontFamily: fontMono,
              }}
            >
              {d.label}
            </div>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>
              {d.text}
            </div>
          </div>
        ))}
    </div>
  )
}

function DocketTab() {
  return (
    <div style={{ padding: '20px 16px' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: TEXT_DIM,
          marginBottom: 16,
          fontFamily: fontMono,
        }}
      >
        CRITICAL DOCKET ENTRIES
      </div>
      {docketEntries.map((e, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            padding: '12px 14px',
            marginBottom: 6,
            borderRadius: 8,
            background:
              e.status === 'inchoate' ||
              e.status === 'defective' ||
              e.status === 'key'
                ? SURFACE
                : 'transparent',
            border: `1px solid ${
              e.status === 'inchoate'
                ? `${GOLD}22`
                : e.status === 'defective'
                  ? `${RED}22`
                  : e.status === 'key'
                    ? `${GREEN}33`
                    : 'transparent'
            }`,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color:
                e.status === 'inchoate'
                  ? GOLD
                  : e.status === 'defective'
                    ? RED
                    : e.status === 'key'
                      ? GREEN
                      : TEXT_DIM,
              fontFamily: fontMono,
              minWidth: 28,
            }}
          >
            {e.num}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>
              {e.desc}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 11, color: TEXT_DIM }}>{e.date}</span>
              <StatusBadge status={e.status} />
            </div>
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: 16,
          padding: '14px',
          borderRadius: 10,
          background: `${GOLD}0A`,
          border: `1px solid ${GOLD}22`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: GOLD,
            marginBottom: 6,
            fontFamily: fontMono,
          }}
        >
          THE GAP
        </div>
        <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>
          The Third Complaint for Contempt (Entry 92, April 4) predates the signed
          Order on Pending Motions (Entry 104, April 14) by{' '}
          <strong style={{ color: GOLD }}>TEN DAYS</strong>. Nunc pro tunc records
          what was ordered; it does not create retroactive contempt liability for
          conduct before a signed order existed. Del-Cook Timber, 248 Ga. App. 734.
        </div>
      </div>
    </div>
  )
}

function LawTab() {
  const categories = [...new Set(legalCitations.map((c) => c.category))]
  const catColors = {
    INCHOATE: CORAL,
    'NUNC PRO TUNC': GOLD,
    CONTEMPT: RED,
    'PARENTAL RIGHTS': BLUE,
    'DUE PROCESS': BLUE,
    WEBEX: GOLD,
    RECORDING: GREEN,
    'CONSENT ORDER': RED,
    VISITATION: GREEN,
  }
  return (
    <div style={{ padding: '20px 16px' }}>
      {categories.map((cat) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: catColors[cat] || TEXT_DIM,
              marginBottom: 10,
              fontFamily: fontMono,
            }}
          >
            {cat}
          </div>
          {legalCitations
            .filter((c) => c.category === cat)
            .map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  marginBottom: 6,
                  borderRadius: 8,
                  background: SURFACE,
                  borderLeft: `3px solid ${(catColors[cat] || TEXT_DIM)}44`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: TEXT,
                    fontFamily: fontMono,
                  }}
                >
                  {c.case}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: TEXT_DIM,
                    lineHeight: 1.5,
                    marginTop: 4,
                  }}
                >
                  {c.holding}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

function RulesTab() {
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: GREEN,
            marginBottom: 12,
            fontFamily: fontMono,
          }}
        >
          ✓ DO
        </div>
        {rules.do.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 12px',
              marginBottom: 4,
              borderRadius: 6,
              background: i % 2 === 0 ? SURFACE : 'transparent',
            }}
          >
            <span style={{ color: GREEN, fontSize: 12, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{r}</span>
          </div>
        ))}
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: RED,
            marginBottom: 12,
            fontFamily: fontMono,
          }}
        >
          ✗ DO NOT
        </div>
        {rules.dont.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 12px',
              marginBottom: 4,
              borderRadius: 6,
              background: i % 2 === 0 ? `${RED}08` : 'transparent',
            }}
          >
            <span style={{ color: RED, fontSize: 12, flexShrink: 0 }}>✗</span>
            <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FolderTab() {
  const [checked, setChecked] = useState(() =>
    folderChecklist.map(() => false),
  )
  const toggle = (i) =>
    setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))
  const done = checked.filter(Boolean).length
  return (
    <div style={{ padding: '20px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: TEXT_DIM,
            fontFamily: fontMono,
          }}
        >
          FOLDER CHECKLIST
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: done === checked.length ? GREEN : CORAL,
            fontFamily: fontMono,
          }}
        >
          {done}/{checked.length}
        </div>
      </div>
      <div
        style={{
          height: 4,
          background: SURFACE_LIGHT,
          borderRadius: 2,
          marginBottom: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(done / checked.length) * 100}%`,
            background: done === checked.length ? GREEN : CORAL,
            borderRadius: 2,
            transition: 'width 0.3s',
          }}
        />
      </div>
      {folderChecklist.map((item, i) => (
        <button
          type="button"
          key={i}
          onClick={() => toggle(i)}
          style={{
            display: 'flex',
            gap: 12,
            padding: '12px 14px',
            marginBottom: 4,
            borderRadius: 8,
            background: checked[i] ? `${GREEN}08` : SURFACE,
            border: `1px solid ${checked[i] ? `${GREEN}22` : 'transparent'}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
            width: '100%',
            textAlign: 'left',
            color: 'inherit',
            font: 'inherit',
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              border: `2px solid ${checked[i] ? GREEN : `${TEXT_DIM}44`}`,
              background: checked[i] ? `${GREEN}22` : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 12,
              color: GREEN,
              transition: 'all 0.2s',
            }}
          >
            {checked[i] ? '✓' : ''}
          </div>
          <span
            style={{
              fontSize: 13,
              color: checked[i] ? TEXT_DIM : TEXT,
              textDecoration: checked[i] ? 'line-through' : 'none',
              lineHeight: 1.4,
              transition: 'all 0.2s',
            }}
          >
            {item.item}
          </span>
        </button>
      ))}
    </div>
  )
}

const tabComponents = {
  mission: MissionTab,
  scenarios: ScenariosTab,
  script: ScriptTab,
  docket: DocketTab,
  law: LawTab,
  rules: RulesTab,
  folder: FolderTab,
  omnibus: P31OmnibusVault,
}

export default function HearingPrep() {
  const [activeTab, setActiveTab] = useState('mission')
  const ActiveComponent = tabComponents[activeTab]
  return (
    <div
      style={{
        background: DARK,
        minHeight: '100vh',
        color: TEXT,
        fontFamily: fontSans,
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
        paddingBottom: 72,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          padding: 'max(12px, env(safe-area-inset-top)) 16px 8px max(16px, env(safe-area-inset-right))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          borderBottom: `1px solid ${SURFACE_LIGHT}`,
          background: DARKER,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: `linear-gradient(135deg, ${CORAL}, ${CORAL}88)`,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: '#fff',
              fontFamily: fontMono,
            }}
          >
            P
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: TEXT,
              fontFamily: fontMono,
            }}
          >
            P31 HEARING OPS
          </span>
          <span
            style={{
              fontSize: 10,
              color: CORAL,
              fontWeight: 600,
              marginLeft: 'auto',
              fontFamily: fontMono,
            }}
          >
            APR 16 • 11:00
          </span>
        </div>
      </div>
      <ActiveComponent />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: DARKER,
          borderTop: `1px solid ${SURFACE_LIGHT}`,
          display: 'flex',
          padding: '6px 4px',
          paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(4px, env(safe-area-inset-left))',
          paddingRight: 'max(4px, env(safe-area-inset-right))',
          zIndex: 100,
          boxSizing: 'border-box',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '6px 2px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              opacity: activeTab === tab.id ? 1 : 0.4,
              transition: 'opacity 0.2s',
              color: 'inherit',
              font: 'inherit',
            }}
          >
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: activeTab === tab.id ? CORAL : TEXT_DIM,
                fontFamily: fontMono,
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
