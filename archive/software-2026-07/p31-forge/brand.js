/**
 * P31 FORGE — BRAND SYSTEM
 * ========================
 * Single source of truth for P31 Labs visual identity.
 * Every document, every channel, every pixel flows from here.
 * 
 * Ca₉(PO₄)₆ — The calcium cage protects at all angles.
 * This file IS the cage for visual consistency.
 */

const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber
} = require('docx');

// ═══════════════════════════════════════════════════════════════════
// COLOR SYSTEM — Derived from the Posner molecule
// ═══════════════════════════════════════════════════════════════════
const COLORS = {
  // Primary
  coral:      "D94F3B",   // P31 signature — phosphorus glow
  coralDark:  "C0392B",   // Urgent/alert variant
  teal:       "2A9D8F",   // Success/confirmed
  
  // Neutrals
  black:      "0A0A0A",   // Pure dark
  dark:       "1A1A1A",   // Headings, primary text
  med:        "333333",   // Body text
  gray:       "666666",   // Secondary text
  lightGray:  "999999",   // Tertiary/metadata
  border:     "AAAAAA",   // Borders
  rule:       "CCCCCC",   // Light rules
  subtle:     "DDDDDD",   // Table borders
  
  // Backgrounds
  warmBg:     "F5F0EB",   // Warm paper
  lightBg:    "FAFAFA",   // Near-white
  alertBg:    "FFF3F0",   // Alert callout
  white:      "FFFFFF",
};

// ═══════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════
const TYPE = {
  serif:      "Georgia",        // Body, legal, narrative
  mono:       "JetBrains Mono", // Code, technical, dashboards
  
  // Sizes (half-points: 22 = 11pt)
  h1:         28,   // 14pt — document titles
  h2:         24,   // 12pt — section headings
  h3:         22,   // 11pt — subsection headings
  body:       22,   // 11pt — body text
  small:      20,   // 10pt — captions, metadata
  tiny:       18,   // 9pt — footer, header secondary
  micro:      16,   // 8pt — legal fine print
  caption:    15,   // 7.5pt — header tertiary
};

// ═══════════════════════════════════════════════════════════════════
// PAGE LAYOUTS
// ═══════════════════════════════════════════════════════════════════
const PAGES = {
  letter: {
    size: { width: 12240, height: 15840 },
    margin: { top: 1440, right: 1350, bottom: 1200, left: 1350 },
    contentWidth: 9540,  // width - left - right margins
  },
  legal: {
    size: { width: 12240, height: 20160 },  // 8.5 x 14
    margin: { top: 1440, right: 1350, bottom: 1200, left: 1350 },
    contentWidth: 9540,
  }
};

// ═══════════════════════════════════════════════════════════════════
// ENTITY CONSTANTS — The calcium cage
// ═══════════════════════════════════════════════════════════════════
const ENTITY = {
  // Operator
  name:           "William R. Johnson",
  nameFull:       "WILLIAM RODGER JOHNSON",
  title:          "Pro Se Defendant",
  address:        "401 Powder Horn Rd",
  city:           "Saint Marys, Georgia 31558",
  phone:          "(912) 227-4980",
  email:          "willyj1587@gmail.com",
  orgEmail:       "will@p31ca.org",
  
  // Organization
  org:            "P31 Labs, Inc.",
  ein:            "42-1888158",
  einDate:        "April 13, 2026",
  incDate:        "April 3, 2026",
  entityType:     "Georgia Domestic Nonprofit Corporation",
  
  // Case
  caseNo:         "2025CV936",
  caseName:       "Johnson v. Johnson",
  court:          "Camden County Superior Court",
  courtFull:      "IN THE SUPERIOR COURT OF CAMDEN COUNTY",
  state:          "STATE OF GEORGIA",
  judge:          "Chief Judge Scarlett",
  
  // Opposing
  opposing:       "Jennifer L. McGhan, Esq.",
  opposingFirm:   "McGhan Law, LLC",
  opposingAddr:   "575 E. King Avenue, Kingsland, Georgia 31548",
  opposingEmail:  "jenn@mcghanlaw.com",
  
  // Parties
  plaintiff:      "CHRISTYN ELIZABETH JOHNSON",
  defendant:      "WILLIAM RODGER JOHNSON",
  
  // ADA
  adaPerson:      "Brenda O'Dell",
  adaEmail:       "brendaodell54@gmail.com",
  
  // Web
  website:        "phosphorus31.org",
  appSite:        "p31ca.org",
  github:         "github.com/p31labs",
  orcid:          "0009-0002-2492-9079",
};

// ═══════════════════════════════════════════════════════════════════
// SOCIAL MEDIA TEMPLATES
// ═══════════════════════════════════════════════════════════════════
const SOCIAL = {
  hashtags: "#P31Labs #AssistiveTech #OpenSource #AuDHD #Neurodivergent #CognitiveProsthetics",
  bio: "Open-source assistive technology for neurodivergent minds. Founded by a late-diagnosed AuDHD former DoD civilian systems engineer. 🔺",
  tagline: "Phosphorus alone burns. Inside the cage, it's stable.",
  cta: "Learn more at phosphorus31.org",
  
  // Platform-specific lengths
  maxLength: {
    twitter: 280,
    bluesky: 300,
    mastodon: 500,
    linkedin: 3000,
    facebook: 63206,
  }
};

// ═══════════════════════════════════════════════════════════════════
// BORDER PRESETS
// ═══════════════════════════════════════════════════════════════════
const noBorder = { style: BorderStyle.NONE, size: 0 };
const BORDERS = {
  none: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
  subtle: (() => {
    const b = { style: BorderStyle.SINGLE, size: 1, color: COLORS.subtle };
    return { top: b, bottom: b, left: b, right: b };
  })(),
  accent: (() => {
    const b = { style: BorderStyle.SINGLE, size: 1, color: COLORS.coral };
    return { top: b, bottom: b, left: b, right: b };
  })(),
};

// ═══════════════════════════════════════════════════════════════════
// SHARED DOCUMENT BUILDERS
// ═══════════════════════════════════════════════════════════════════

function makeHeader(opts = {}) {
  const style = opts.style || 'legal';  // legal | org | minimal
  
  if (style === 'legal') {
    return new Header({ children: [
      new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: ENTITY.name.toUpperCase(), font: TYPE.serif, size: TYPE.tiny, bold: true, color: COLORS.dark })
      ]}),
      new Paragraph({ spacing: { after: 0 }, children: [
        new TextRun({ text: ENTITY.title, font: TYPE.serif, size: TYPE.micro, color: COLORS.gray, italics: true })
      ]}),
      new Paragraph({ spacing: { after: 20 }, children: [
        new TextRun({ text: `${ENTITY.address} \u2022 ${ENTITY.city} \u2022 ${ENTITY.phone} \u2022 ${ENTITY.email}`, font: TYPE.serif, size: TYPE.caption, color: COLORS.gray })
      ]}),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.coral, space: 6 } }, spacing: { after: 200 } })
    ]});
  }
  
  if (style === 'org') {
    return new Header({ children: [
      new Paragraph({ spacing: { after: 20 }, children: [
        new TextRun({ text: "P31 LABS, INC.", font: TYPE.serif, size: TYPE.tiny, bold: true, color: COLORS.coral }),
        new TextRun({ text: `  \u2022  EIN ${ENTITY.ein}  \u2022  ${ENTITY.city}`, font: TYPE.serif, size: TYPE.caption, color: COLORS.gray })
      ]}),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.coral, space: 6 } }, spacing: { after: 200 } })
    ]});
  }
  
  // minimal
  return new Header({ children: [
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.rule, space: 6 } }, spacing: { after: 200 } })
  ]});
}

function makeFooter(opts = {}) {
  const style = opts.style || 'legal';
  
  if (style === 'legal') {
    return new Footer({ children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border, space: 4 } },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${ENTITY.caseName} \u2022 Civil Action No. ${ENTITY.caseNo} \u2022 ${ENTITY.court} \u2022 Page `, font: TYPE.serif, size: 14, color: COLORS.gray }),
          new TextRun({ children: [PageNumber.CURRENT], font: TYPE.serif, size: 14, color: COLORS.gray })
        ]
      })
    ]});
  }
  
  if (style === 'org') {
    return new Footer({ children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.rule, space: 4 } },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${ENTITY.org} \u2022 ${ENTITY.website} \u2022 Page `, font: TYPE.serif, size: 14, color: COLORS.gray }),
          new TextRun({ children: [PageNumber.CURRENT], font: TYPE.serif, size: 14, color: COLORS.gray })
        ]
      })
    ]});
  }
  
  return new Footer({ children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Page ", font: TYPE.serif, size: 14, color: COLORS.lightGray }),
        new TextRun({ children: [PageNumber.CURRENT], font: TYPE.serif, size: 14, color: COLORS.lightGray })
      ]
    })
  ]});
}

function makeSection(children, opts = {}) {
  const layout = opts.layout || 'letter';
  const style = opts.style || 'legal';
  return {
    properties: { page: { size: PAGES[layout].size, margin: PAGES[layout].margin } },
    headers: { default: makeHeader({ style }) },
    footers: { default: makeFooter({ style }) },
    children
  };
}

// ─── TEXT BUILDERS ────────────────────────────────────────────────

function text(content, opts = {}) {
  return new TextRun({
    text: content,
    font: opts.font || TYPE.serif,
    size: opts.size || TYPE.body,
    color: opts.color || COLORS.med,
    bold: opts.bold,
    italics: opts.italics,
    underline: opts.underline ? {} : undefined
  });
}

function para(content, opts = {}) {
  const children = typeof content === 'string'
    ? [text(content, opts)]
    : content;
  return new Paragraph({
    spacing: { before: opts.before || 0, after: opts.after || 160 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    alignment: opts.align || AlignmentType.JUSTIFIED,
    border: opts.border || undefined,
    children
  });
}

function heading1(content, opts = {}) {
  // Court filings override to dark (restrained). Grants/memos default to coral.
  return para(content, {
    size: TYPE.h2,
    bold: true,
    color: opts.color || COLORS.coral,
    after: opts.after ?? 120,
    before: opts.before ?? 280,
    align: AlignmentType.LEFT
  });
}

function heading2(content, opts = {}) {
  return para(content, {
    size: TYPE.body,
    bold: true,
    color: opts.color || COLORS.dark,
    after: opts.after ?? 100,
    before: opts.before ?? 200,
    align: AlignmentType.LEFT
  });
}

function field(label, value) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [
      text(label + ": ", { bold: true, color: COLORS.dark }),
      text(value)
    ]
  });
}

// ─── LIST BUILDERS ────────────────────────────────────────────────

function bullet(content, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 80 },
    indent: { left: 720, hanging: 240 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      text("\u2022  ", { bold: true, color: COLORS.coral }),
      text(content, opts)
    ]
  });
}

function numbered(content, n, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 100 },
    indent: { left: 720, hanging: 360 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      text(`${n}.  `, { bold: true, color: COLORS.dark }),
      text(content, opts)
    ]
  });
}

function affects(content) {
  // Italic gray "Affects: ..." indicator — sits under a section heading
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: 360 },
    children: [
      text("Affects: ", { size: TYPE.small, bold: true, italics: true, color: COLORS.gray }),
      text(content, { size: TYPE.small, italics: true, color: COLORS.gray })
    ]
  });
}

function timeline(entries) {
  // Two-column date | event mini-table, no visible borders
  return new Table({
    width: { size: PAGES.letter.contentWidth - 720, type: WidthType.DXA },
    columnWidths: [2500, 6320],
    rows: entries.map(e => new TableRow({
      children: [
        new TableCell({
          borders: BORDERS.none,
          width: { size: 2500, type: WidthType.DXA },
          children: [new Paragraph({
            spacing: { after: 60 },
            children: [text(e.date, { bold: true, color: COLORS.dark, size: TYPE.small })]
          })]
        }),
        new TableCell({
          borders: BORDERS.none,
          width: { size: 6320, type: WidthType.DXA },
          children: [new Paragraph({
            spacing: { after: 60 },
            children: [text(e.text, { size: TYPE.small })]
          })]
        })
      ]
    }))
  });
}

// ─── COURT CAPTION ────────────────────────────────────────────────

function courtCaption(title, subtitle) {
  return [
    para(ENTITY.courtFull, { size: TYPE.small, color: COLORS.dark, align: AlignmentType.CENTER, after: 60 }),
    para(ENTITY.state, { size: TYPE.small, color: COLORS.dark, align: AlignmentType.CENTER, after: 200 }),
    new Table({
      width: { size: PAGES.letter.contentWidth, type: WidthType.DXA },
      columnWidths: [5400, 4140],
      rows: [new TableRow({ children: [
        new TableCell({ borders: BORDERS.none, width: { size: 5400, type: WidthType.DXA }, children: [
          para(ENTITY.plaintiff + ",", { after: 40, align: AlignmentType.LEFT }),
          para("Plaintiff,", { italics: true, indent: 720, after: 120, align: AlignmentType.LEFT }),
          para("-vs-", { after: 120, align: AlignmentType.LEFT }),
          para(ENTITY.defendant + ",", { after: 40, align: AlignmentType.LEFT }),
          para("Defendant.", { italics: true, indent: 720, align: AlignmentType.LEFT })
        ]}),
        new TableCell({ borders: BORDERS.none, width: { size: 4140, type: WidthType.DXA }, verticalAlign: "center", children: [
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [
            text(`Civil Action No. ${ENTITY.caseNo}`, { bold: true, color: COLORS.dark })
          ]})
        ]})
      ]})]
    }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border, space: 8 } }, spacing: { after: 200 } }),
    para(title, { size: TYPE.h2, bold: true, color: COLORS.dark, align: AlignmentType.CENTER, after: 40 }),
    subtitle
      ? para(subtitle, { size: TYPE.small - 1, color: COLORS.gray, italics: true, align: AlignmentType.CENTER, after: 200 })
      : new Paragraph({ spacing: { after: 200 } })
  ];
}

// ─── SIGNATURE & CERTIFICATE OF SERVICE ───────────────────────────

function signatureBlock(date) {
  date = date || "_____ day of __________, 20__";
  return [
    para(`Respectfully submitted this ${date}.`, { before: 400, after: 60 }),
    para("_______________________________", { after: 0, align: AlignmentType.LEFT }),
    new Paragraph({ spacing: { after: 20 }, children: [text(`${ENTITY.nameFull}, Pro Se`, { bold: true, color: COLORS.dark })] }),
    ...[ ENTITY.address, ENTITY.city, ENTITY.phone, ENTITY.email ].map(
      line => new Paragraph({ spacing: { after: 0 }, children: [text(line, { size: TYPE.small, color: COLORS.gray })] })
    ),
    new Paragraph({ spacing: { after: 300 } })
  ];
}

function certOfService(date, extra) {
  date = date || "_____ day of __________, 20__";
  return [
    para("CERTIFICATE OF SERVICE", { bold: true, color: COLORS.dark, align: AlignmentType.CENTER, before: 200, after: 120 }),
    para(`I hereby certify that I have this day served a copy of the foregoing upon Plaintiff\u2019s counsel of record, ${ENTITY.opposing}, ${ENTITY.opposingFirm}, ${ENTITY.opposingAddr}, via electronic mail to ${ENTITY.opposingEmail}.`),
    para(`This ${date}.`, { after: 200 }),
    para("_______________________________", { after: 0, align: AlignmentType.LEFT }),
    para("William R. Johnson, Pro Se", { align: AlignmentType.LEFT }),
    ...(extra || [])
  ];
}

// ─── SOCIAL MEDIA FORMATTER ───────────────────────────────────────

function formatSocial(content, platform = 'bluesky') {
  const max = SOCIAL.maxLength[platform] || 300;
  let post = content;
  
  // Add hashtags if space allows
  if (post.length + SOCIAL.hashtags.length + 2 <= max) {
    post += "\n\n" + SOCIAL.hashtags;
  }
  
  // Truncate if needed
  if (post.length > max) {
    post = post.substring(0, max - 3) + "...";
  }
  
  return {
    text: post,
    length: post.length,
    maxLength: max,
    platform,
    remaining: max - post.length
  };
}

// ─── GRANT NARRATIVE BLOCKS ───────────────────────────────────────

function grantElevator() {
  return "P31 Labs engineers open-source cognitive infrastructure for neurodivergent minds. Founded by a 16-year DoD civilian systems engineer diagnosed AuDHD at 39, we build the structural encapsulation that biology couldn\u2019t \u2014 turning reactive phosphorus into the most stable molecule in existence.";
}

function grantWhitespace() {
  return "No existing entity is building fully open-source, neurodivergent-designed, research-grounded, wearable hardware dedicated to autonomic regulation and cognitive sensory gating.";
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  COLORS, TYPE, PAGES, ENTITY, SOCIAL, BORDERS,
  makeHeader, makeFooter, makeSection,
  text, para, heading1, heading2, field,
  bullet, numbered, affects, timeline,
  courtCaption, signatureBlock, certOfService,
  formatSocial, grantElevator, grantWhitespace
};
