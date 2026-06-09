#!/usr/bin/env node
/**
 * P31 FORGE — Document Generation Engine
 * =======================================
 * Single-pipeline, content-driven document generation.
 *
 *   CONTENT PACK (JSON)  →  brand.js primitives  →  .docx  →  .pdf
 *
 * Content packs live under content/<domain>/... and specify:
 *   - kind: court | letter | resolution | memo | grant | social
 *   - metadata (title, date, case no, etc.)
 *   - body: typed items (h1, h2, para, field, bullet, numbered, affects, timeline)
 *
 * Usage:
 *   node forge.js compile <path/to/content-pack.json>   # Content-driven
 *   node forge.js court "TITLE" "16th day of April, 2026" [--subtitle "..."]
 *   node forge.js letter "RE: Subject" "April 14, 2026"
 *   node forge.js paper --paper <id>     # Generate omnibus paper by ID (01-25)
 *   node forge.js grant gates|nlnet|asan
 *   node forge.js social "Post content" bluesky|mastodon|linkedin|all
 *   node forge.js social-post <post-id>   # Generate docs from social post
 *   node forge.js brand                  # Print brand constants
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, PageBreak,
  AlignmentType, ShadingType, BorderStyle, WidthType
} = require('docx');
const B = require('./brand');
const { publish, publishPack, CHANNELS } = require('./channels');

// ═══════════════════════════════════════════════════════════════════
// TYPED-BODY DISPATCHER — iterates content-pack body[] items
// ═══════════════════════════════════════════════════════════════════

/**
 * Render a content-pack body[] into docx Paragraph/Table children.
 * Supported item types:
 *   { type: 'h1', text }                 — section heading
 *   { type: 'h2', text }                 — subsection heading
 *   { type: 'para', text }               — body paragraph
 *   { type: 'field', label, value }      — indented label: value line
 *   { type: 'bullet', text }             — coral bullet list item
 *   { type: 'numbered', text }           — auto-numbered list item (per sibling run)
 *   { type: 'affects', text }            — gray italic "Affects: ..." line
 *   { type: 'timeline', entries: [...] } — date/event mini-table
 *
 * Options:
 *   headingColor: override for h1 (dark for court filings, coral for grants)
 */
function renderBody(items, opts = {}) {
  const out = [];
  const headingColor = opts.headingColor || B.COLORS.coral;
  let numberedCounter = 0;
  let lastType = null;

  for (const item of items) {
    // Reset numbered counter when non-numbered item appears between runs
    if (item.type !== 'numbered' && lastType === 'numbered') {
      numberedCounter = 0;
    }

    switch (item.type) {
      case 'h1':
        out.push(B.heading1(item.text, { color: headingColor }));
        break;
      case 'h2':
        out.push(B.heading2(item.text, { color: B.COLORS.dark }));
        break;
      case 'para':
        out.push(B.para(item.text));
        break;
      case 'field':
        out.push(B.field(item.label, item.value));
        break;
      case 'bullet':
        out.push(B.bullet(item.text));
        break;
      case 'numbered':
        numberedCounter += 1;
        out.push(B.numbered(item.text, numberedCounter));
        break;
      case 'affects':
        out.push(B.affects(item.text));
        break;
      case 'timeline':
        out.push(B.timeline(item.entries));
        // Add spacing paragraph after tables so next para breathes
        out.push(new Paragraph({ spacing: { after: 120 } }));
        break;
      default:
        console.warn(`[forge] Unknown body item type: ${item.type}`);
    }
    lastType = item.type;
  }

  return out;
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT-PACK RENDERERS (kind → Document)
// ═══════════════════════════════════════════════════════════════════

function renderCourt(pack) {
  const children = [
    ...B.courtCaption(pack.title, pack.subtitle),
    ...(pack.preamble ? [B.para(pack.preamble)] : []),
    // Court filings use dark headings (restrained, per SAMPLE_Court_Filing)
    ...renderBody(pack.body || [], { headingColor: B.COLORS.dark }),
    ...B.signatureBlock(pack.date),
    ...(pack.cert_of_service
      ? B.certOfService(pack.date, pack.cert_of_service.extra)
      : [])
  ];
  return new Document({ sections: [B.makeSection(children, { style: 'legal' })] });
}

function renderLetter(pack) {
  const children = [];

  // Date
  children.push(B.para(pack.date, { after: 200 }));

  // Via line
  if (pack.via) {
    children.push(B.para(pack.via, {
      size: B.TYPE.small, color: B.COLORS.gray, italics: true, after: 0
    }));
  }

  // Recipient block
  (pack.recipient || []).forEach((line, i) => {
    children.push(B.para(line, { after: i === pack.recipient.length - 1 ? 200 : 0 }));
  });

  // RE block (bold, dark)
  if (pack.re && pack.re.length) {
    pack.re.forEach((line, i) => {
      children.push(B.para(line, {
        bold: i === 0,
        color: B.COLORS.dark,
        after: i === pack.re.length - 1 ? 200 : 0
      }));
    });
  }

  // Salutation
  if (pack.salutation) {
    children.push(B.para(pack.salutation, { after: 160 }));
  }

  // Body — letters also use dark headings
  children.push(...renderBody(pack.body || [], { headingColor: B.COLORS.dark }));

  // Closing
  if (pack.closing) {
    children.push(new Paragraph({
      spacing: { before: 300, after: 60 },
      children: [B.text(pack.closing)]
    }));
  }

  // Signature
  if (pack.signature) {
    children.push(new Paragraph({ children: [B.text("_______________________________")] }));
    children.push(new Paragraph({
      spacing: { after: 20 },
      children: [B.text(pack.signature.name, { bold: true, color: B.COLORS.dark })]
    }));
    (pack.signature.lines || []).forEach(line => {
      children.push(new Paragraph({
        spacing: { after: 0 },
        children: [B.text(line, { size: B.TYPE.small, color: B.COLORS.gray })]
      }));
    });
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // CC
  (pack.cc || []).forEach(name => {
    children.push(new Paragraph({
      spacing: { after: 0 },
      children: [B.text(`cc: ${name}`, {
        size: B.TYPE.tiny, color: B.COLORS.gray, italics: true
      })]
    }));
  });

  return new Document({ sections: [B.makeSection(children, { style: 'legal' })] });
}

function renderResolution(pack) {
  const children = [
    B.para("P31 LABS, INC.", {
      size: B.TYPE.h1, bold: true, color: B.COLORS.coral,
      align: AlignmentType.CENTER, after: 40
    }),
    B.para(pack.title || "BOARD RESOLUTION", {
      size: B.TYPE.h2, bold: true, color: B.COLORS.dark,
      align: AlignmentType.CENTER, after: 40
    }),
    B.para(`Adopted: ${pack.date}`, {
      size: B.TYPE.small, color: B.COLORS.gray,
      align: AlignmentType.CENTER, after: 200
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: B.COLORS.coral, space: 8 } },
      spacing: { after: 300 }
    }),
    ...renderBody(pack.body || [], { headingColor: B.COLORS.coral }),
    new Paragraph({ spacing: { before: 400, after: 60 }, children: [B.text("CERTIFICATION")] }),
    B.para(`I, ${B.ENTITY.name}, Sole Incorporator of P31 Labs, Inc., hereby certify that the foregoing resolution was duly adopted on ${pack.date}.`),
    new Paragraph({ spacing: { before: 200 }, children: [B.text("_______________________________")] }),
    new Paragraph({
      children: [B.text(B.ENTITY.name + ", Sole Incorporator", { bold: true, color: B.COLORS.dark })]
    })
  ];
  return new Document({ sections: [B.makeSection(children, { style: 'org' })] });
}

function renderMemo(pack) {
  const children = [
    B.para("P31 LABS, INC.", {
      size: B.TYPE.h1, bold: true, color: B.COLORS.coral,
      align: AlignmentType.CENTER, after: 200
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: B.COLORS.coral, space: 8 } },
      spacing: { after: 200 }
    }),
    B.field("TO", pack.to || "[Recipient]"),
    B.field("FROM", pack.from || B.ENTITY.name),
    B.field("DATE", pack.date),
    B.field("RE", pack.subject || pack.title || "[Subject]"),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: B.COLORS.rule, space: 8 } },
      spacing: { after: 200 }
    }),
    ...renderBody(pack.body || [], { headingColor: B.COLORS.coral })
  ];
  return new Document({ sections: [B.makeSection(children, { style: 'org' })] });
}

function renderPaper(pack) {
  return new Document({
    sections: [
      B.makeSection(
        [
          { type: "h1", text: pack.title },
          { type: "para", text: pack.abstract },
          ...(pack.body || [])
        ],
        { style: "org" }
      ),
    ],
  });
}


function renderGrant(pack) {
  const children = [
    B.para("P31 LABS, INC.", {
      size: B.TYPE.h1, bold: true, color: B.COLORS.coral,
      align: AlignmentType.CENTER, after: 20
    }),
    B.para("GRANT APPLICATION", {
      size: B.TYPE.h2, bold: true, color: B.COLORS.dark,
      align: AlignmentType.CENTER, after: 40
    }),
    B.para(pack.title || pack.program, {
      size: B.TYPE.small, color: B.COLORS.gray, italics: true,
      align: AlignmentType.CENTER, after: 200
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: B.COLORS.coral, space: 8 } },
      spacing: { after: 200 }
    }),
    B.field("Program", pack.title || pack.program),
    ...(pack.amount ? [B.field("Amount", pack.amount)] : []),
    ...(pack.deadline ? [B.field("Deadline", pack.deadline)] : []),
    B.field("Applicant", B.ENTITY.org),
    B.field("EIN", B.ENTITY.ein),
    B.field("Contact", `${B.ENTITY.name} \u2022 ${B.ENTITY.orgEmail}`),
    new Paragraph({ spacing: { after: 200 } }),
    ...renderBody(pack.body || [], { headingColor: B.COLORS.coral })
  ];
  return new Document({ sections: [B.makeSection(children, { style: 'org' })] });
}

const RENDERERS = {
  paper:      renderPaper,
  court:      renderCourt,
  letter:     renderLetter,
  resolution: renderResolution,
  memo:       renderMemo,
  grant:      renderGrant
};

// ═══════════════════════════════════════════════════════════════════
// COMPILE — content pack → Document
// ═══════════════════════════════════════════════════════════════════

function compile(pack) {
  const render = RENDERERS[pack.kind];
  if (!render) {
    throw new Error(
      `Unknown content-pack kind: "${pack.kind}". ` +
      `Valid: ${Object.keys(RENDERERS).join(', ')}`
    );
  }
  return render(pack);
}

async function compileFile(packPath) {
  const resolved = path.resolve(packPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Content pack not found: ${resolved}`);
  }
  const pack = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const doc = compile(pack);
  const filename = pack.filename || path.basename(resolved, '.json') + '.docx';
  const outDir = path.resolve(__dirname, 'out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

// ═══════════════════════════════════════════════════════════════════
// AD-HOC SCAFFOLD GENERATORS (for blank templates)
// ═══════════════════════════════════════════════════════════════════

function court(title, date, opts = {}) {
  const children = [
    ...B.courtCaption(title, opts.subtitle),
    B.para("COMES NOW Defendant, " + B.ENTITY.nameFull + ", pro se, and respectfully submits the following:"),
    B.heading1("I. [SECTION HEADING]", { color: B.COLORS.dark }),
    B.para("[Body text goes here. Replace this placeholder with the substance of your filing.]"),
    ...B.signatureBlock(date),
    ...B.certOfService(date)
  ];
  return new Document({ sections: [B.makeSection(children, { style: 'legal' })] });
}

function letter(subject, date, opts = {}) {
  const to = opts.to || {
    name:    B.ENTITY.opposing,
    firm:    B.ENTITY.opposingFirm,
    address: "575 E. King Avenue",
    city:    "Kingsland, Georgia 31548",
    email:   B.ENTITY.opposingEmail
  };
  const children = [
    B.para(date, { after: 200 }),
    B.para(`Via Email: ${to.email}`, { size: B.TYPE.small, color: B.COLORS.gray, italics: true, after: 0 }),
    B.para(to.name, { after: 0 }),
    ...(to.firm ? [B.para(to.firm, { after: 0 })] : []),
    B.para(to.address, { after: 0 }),
    B.para(to.city, { after: 200 }),
    B.para(`RE: ${subject}`, { bold: true, color: B.COLORS.dark, after: 200 }),
    B.para(`Dear ${to.name.split(',')[0].split(' ').pop()},`),
    B.para("[Letter body goes here.]"),
    new Paragraph({ spacing: { before: 300, after: 60 }, children: [B.text("Respectfully,")] }),
    new Paragraph({ children: [B.text("_______________________________")] }),
    new Paragraph({ spacing: { after: 20 }, children: [B.text("William R. Johnson, Pro Se", { bold: true, color: B.COLORS.dark })] }),
    ...[B.ENTITY.address, B.ENTITY.city, B.ENTITY.phone, B.ENTITY.email].map(
      l => new Paragraph({ spacing: { after: 0 }, children: [B.text(l, { size: B.TYPE.small, color: B.COLORS.gray })] })
    ),
    new Paragraph({ spacing: { after: 200 } }),
    ...(opts.cc || []).map(
      name => new Paragraph({ spacing: { after: 0 }, children: [B.text(`cc: ${name}`, { size: B.TYPE.tiny, color: B.COLORS.gray, italics: true })] })
    )
  ];
  return new Document({ sections: [B.makeSection(children, { style: 'legal' })] });
}

function corporate(type, date, opts = {}) {
  if (type === 'resolution') {
    return renderResolution({
      title: "BOARD RESOLUTION",
      date,
      body: [
        { type: "para", text: `WHEREAS, P31 Labs, Inc. is a Georgia domestic nonprofit corporation (EIN ${B.ENTITY.ein}); and` },
        { type: "para", text: "WHEREAS, [state the reason for the resolution]; and" },
        { type: "para", text: "NOW, THEREFORE, BE IT RESOLVED, that [state what is being resolved];" },
        { type: "para", text: "FURTHER RESOLVED, that [additional resolved clauses as needed]." }
      ]
    });
  }
  if (type === 'memo') {
    return renderMemo({
      to: opts.to || "[Recipient]",
      from: B.ENTITY.name,
      date,
      subject: opts.subject || "[Subject]",
      body: [{ type: "para", text: "[Memo body goes here.]" }]
    });
  }
  throw new Error(`Unknown corporate type: ${type}. Use: resolution, memo`);
}

function grant(program, opts = {}) {
  const scaffolds = {
    gates: {
      program: "gates",
      title: "Gates Foundation Grand Challenges: AI to Accelerate Charitable Giving",
      deadline: "April 28, 2026, 11:30 AM PDT",
      amount: "Up to $150,000",
      sections: [
        "Relevance to Challenge Area",
        "Expected Impact",
        "Feasibility and Methodology",
        "Measurement of Success",
        "Scalability Potential",
        "Responsible AI Practices"
      ]
    },
    nlnet: {
      program: "nlnet",
      title: "NLnet NGI Zero Commons Fund",
      deadline: "June 1, 2026, 12:00 CEST",
      amount: "\u20AC5,000\u2013\u20AC50,000",
      sections: [
        "Abstract",
        "Requested Amount and Budget Justification",
        "Comparison with Existing Efforts",
        "Technical Challenges",
        "Ecosystem Engagement"
      ]
    },
    asan: {
      program: "asan",
      title: "ASAN Teighlor McGee Grassroots Mini-Grants",
      deadline: "July 31, 2026 (opens May 15)",
      amount: "Up to $6,250",
      sections: [
        "Project Description",
        "Community Impact",
        "Budget",
        "Self-Advocate Leadership"
      ]
    }
  };
  const s = scaffolds[program];
  if (!s) throw new Error(`Unknown grant: ${program}. Use: gates, nlnet, asan`);

  return renderGrant({
    program: s.program,
    title: s.title,
    amount: s.amount,
    deadline: s.deadline,
    body: [
      { type: "h1", text: "ELEVATOR PITCH" },
      { type: "para", text: B.grantElevator() },
      { type: "h1", text: "WHITESPACE" },
      { type: "para", text: B.grantWhitespace() },
      ...s.sections.flatMap(sec => [
        { type: "h1", text: sec.toUpperCase() },
        { type: "para", text: `[Complete this section for ${s.title}. See grant requirements.]` }
      ])
    ]
  });
}

function social(content, platform) {
  const result = B.formatSocial(content, platform);
  console.log(`\n--- ${platform.toUpperCase()} (${result.length}/${result.maxLength}) ---`);
  console.log(result.text);
  console.log(`--- ${result.remaining} chars remaining ---\n`);
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
P31 FORGE \u2014 Document Generation Engine
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

CONTENT-DRIVEN (preferred):
  node forge.js compile content/legal/2025CV936/supplemental_notice.json
  node forge.js compile content/grants/gates.json

PUBLISH (requires channel secrets in env):
  node forge.js publish <channel> <content>   # channels: ${Object.keys(CHANNELS).join('|')}
  node forge.js publish-pack content/social/posts.json [--ids id1,id2] [--targets bluesky,mastodon]
  node forge.js scan-grants                   # grants.gov Search2 API scan
  node forge.js scan-substack [--feed URL] [--targets bluesky,mastodon]  # RSS scan + optional fan-out

AD-HOC SCAFFOLDS:
  node forge.js court "MOTION TITLE" "16th day of April, 2026"
  node forge.js letter "RE: Subject" "April 14, 2026"
  node forge.js corporate resolution|memo "April 14, 2026"
  node forge.js grant gates|nlnet|asan
  node forge.js social "Post content" bluesky|mastodon|linkedin|all
  node forge.js brand                     # Print brand constants

Entity: ${B.ENTITY.org} | EIN: ${B.ENTITY.ein}
Colors: coral #${B.COLORS.coral} | teal #${B.COLORS.teal} | dark #${B.COLORS.dark}
Font:   ${B.TYPE.serif} (body) | ${B.TYPE.mono} (code)
`);
    return;
  }

  const cmd = args[0];
  let doc, filename;

  switch (cmd) {
    case 'compile': {
      const packPath = args[1];
      if (!packPath) {
        console.error("Usage: forge.js compile <path/to/content-pack.json>");
        process.exit(1);
      }
      const outPath = await compileFile(packPath);
      console.log(`\u2705 ${outPath}`);
      return;
    }

    case 'court':
      doc = court(args[1] || "UNTITLED MOTION", args[2] || "_____ day of __________, 20__", {
        subtitle: args.includes('--subtitle') ? args[args.indexOf('--subtitle') + 1] : null
      });
      filename = `Court_${(args[1] || 'Filing').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)}.docx`;
      break;

    case 'letter':
      doc = letter(args[1] || "Subject", args[2] || new Date().toLocaleDateString(), {
        cc: ["Brenda O'Dell, Designated ADA Support Person"]
      });
      filename = `Letter_${new Date().toISOString().slice(0, 10)}.docx`;
      break;

    case 'corporate':
      doc = corporate(args[1] || 'resolution', args[2] || new Date().toLocaleDateString());
      filename = `P31_${(args[1] || 'Document').charAt(0).toUpperCase() + (args[1] || 'document').slice(1)}_${new Date().toISOString().slice(0, 10)}.docx`;
      break;

    case 'grant':
      doc = grant(args[1] || 'gates');
      filename = `P31_Grant_${(args[1] || 'Application').charAt(0).toUpperCase() + (args[1] || 'app').slice(1)}_Scaffold.docx`;
      break;
    case 'paper': {
      const paperId = args[args.indexOf('--paper') + 1];
      if (!paperId) {
        console.error("Usage: forge.js paper --paper <id>");
        process.exit(1);
      }
      const packPath = `content/omnibus/paper${paperId.padStart(2, '0')}.json`;
      const outPath = await compileFile(packPath);
      console.log(`u2705 ${outPath}`);
      return;
    }

    case 'social': {
      const content = args[1] || "P31 Labs update";
      const platform = args[2] || 'all';
      if (platform === 'all') {
        ['bluesky', 'mastodon', 'linkedin'].forEach(p => social(content, p));
      } else {
        social(content, platform);
      }
      return;
    }

    case 'publish': {
      const channel = args[1];
      const contentArg = args[2];
      if (!channel || !contentArg) {
        console.error(`Usage: forge.js publish <channel> <content|@file.json>\nChannels: ${Object.keys(CHANNELS).join(', ')}`);
        process.exit(1);
      }
      let content;
      if (contentArg.startsWith('@')) {
        const p = path.resolve(contentArg.slice(1));
        if (!fs.existsSync(p)) {
          console.error(`Content file not found: ${p}`);
          process.exit(1);
        }
        const raw = fs.readFileSync(p, 'utf8');
        try { content = JSON.parse(raw); } catch { content = raw; }
      } else {
        content = contentArg;
      }
      const result = await publish(channel, content, process.env);
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    case 'publish-pack': {
      const packPath = args[1];
      if (!packPath) {
        console.error("Usage: forge.js publish-pack <path/to/pack.json> [--ids id1,id2] [--targets bluesky,mastodon]");
        process.exit(1);
      }
      const resolved = path.resolve(packPath);
      if (!fs.existsSync(resolved)) {
        console.error(`Pack not found: ${resolved}`);
        process.exit(1);
      }
      const pack = JSON.parse(fs.readFileSync(resolved, 'utf8'));
      const opts = {};
      const idsIdx = args.indexOf('--ids');
      if (idsIdx !== -1 && args[idsIdx + 1]) opts.postIds = args[idsIdx + 1].split(',').map(s => s.trim());
      const tgtIdx = args.indexOf('--targets');
      if (tgtIdx !== -1 && args[tgtIdx + 1]) opts.targets = args[tgtIdx + 1].split(',').map(s => s.trim());
      const results = await publishPack(pack, process.env, opts);
      console.log(JSON.stringify(results, null, 2));
      const ok = results.filter(r => r.success !== false).length;
      const fail = results.length - ok;
      console.log(`\n\u2014 ${ok} succeeded, ${fail} failed across ${results.length} post\u00D7platform firings`);
      return;
    }

    case 'scan-substack': {
      const content = {};
      const feedArg = args.indexOf('--feed');
      if (feedArg !== -1 && args[feedArg + 1]) content.feed = args[feedArg + 1];
      const limitArg = args.indexOf('--limit');
      if (limitArg !== -1 && args[limitArg + 1]) content.limit = parseInt(args[limitArg + 1], 10);

      const result = await publish('substack', content, process.env);
      console.log(`\nsubstack scan \u2014 ${result.newCount} new / ${result.count} total`);
      console.log(`feed: ${result.feed}`);
      console.log("\u2550".repeat(60));
      for (const p of result.newPosts) {
        console.log(`\n  [NEW] ${p.meta.title}`);
        console.log(`  ${p.meta.link}`);
        console.log(`  ${p.meta.pubDate || ''}`);
        console.log(`  ${p.meta.excerpt.slice(0, 120)}\u2026`);
      }
      if (result.newCount === 0) console.log("(no new posts since last scan)");

      // Optional fan-out: --targets bluesky,mastodon
      const tgtArg = args.indexOf('--targets');
      if (tgtArg !== -1 && args[tgtArg + 1] && result.newCount > 0) {
        const targets = args[tgtArg + 1].split(',').map(s => s.trim());
        console.log(`\n\u2500\u2500 fanning ${result.newCount} new post(s) to: ${targets.join(', ')}`);
        const pack = { posts: result.newPosts, defaultTargets: targets };
        const fanResults = await publishPack(pack, process.env, { targets });
        console.log(JSON.stringify(fanResults, null, 2));
        const ok = fanResults.filter(r => r.success !== false).length;
        console.log(`\n\u2014 ${ok} succeeded, ${fanResults.length - ok} failed`);
      }
      console.log();
      return;
    }


    case 'social-post': {
      const postId = args[1];
      if (!postId) {
        console.error('Usage: forge.js social-post <post-id>');
        process.exit(1);
      }
      
      // Load social posts
      const postsPath = path.resolve(__dirname, 'content/social/posts.json');
      const postsData = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
      const post = postsData.posts.find(p => p.id === postId);
      
      if (!post) {
        console.error(`Post not found: ${postId}`);
        console.error('Available posts:', postsData.posts.map(p => p.id).join(', '));
        process.exit(1);
      }
      
      console.log(`\n📄 Generating documents from social post: ${post.occasion}`);
      console.log("═".repeat(60));
      
      // Generate all document types
      const grantDoc = renderGrant({
        ...post,
        body: [
          { type: 'h1', text: post.occasion },
          { type: 'para', text: post.content },
          { type: 'h2', text: 'Project Overview' },
          { type: 'para', text: 'This initiative aligns with P31 Labs mission to build open-source cognitive infrastructure for neurodivergent individuals.' },
          { type: 'field', label: 'Date', value: new Date().toLocaleDateString() },
          { type: 'field', label: 'Organization', value: 'P31 Labs, Inc.' },
          { type: 'field', label: 'EIN', value: '42-1888158' }
        ]
      });
      
      const boardDoc = renderResolution({
        date: new Date().toLocaleDateString(),
        title: `Board Resolution: ${post.occasion}`,
        body: [
          { type: 'h1', text: `Board Resolution: ${post.occasion}` },
          { type: 'para', text: `WHEREAS, P31 Labs seeks to advance its mission through the following initiative;` },
          { type: 'para', text: post.content },
          { type: 'h2', text: 'RESOLVED' },
          { type: 'bullet', text: 'That the Board approves this initiative and authorizes necessary resources.' },
          { type: 'bullet', text: 'That the President is authorized to execute related documents.' },
          { type: 'bullet', text: 'That this resolution shall be effective immediately.' }
        ]
      });
      
      const legalDoc = renderCourt(
        `Legal Filing: ${post.occasion}`,
        new Date().toLocaleDateString() + ' ' + post.occasion,
        {
          ...post,
          body: [
            { type: 'h1', text: 'COMPLAINT FOR DECLARATORY RELIEF' },
            { type: 'para', text: post.content },
            { type: 'h2', text: 'JURISDICTION AND VENUE' },
            { type: 'para', text: 'This Court has jurisdiction pursuant to Georgia law and federal question jurisdiction.' },
            { type: 'field', label: 'Case', value: '2025CV936' },
            { type: 'field', label: 'Filing Date', value: new Date().toLocaleDateString() }
          ]
        }
      );
      
      // Write files
      const outDir = path.resolve(__dirname, 'out');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      
      const { Packer } = require('docx');
      
      const grantPath = path.join(outDir, `grant-${postId}.docx`);
      const boardPath = path.join(outDir, `resolution-${postId}.docx`);
      const legalPath = path.join(outDir, `legal-${postId}.docx`);
      
      await Promise.all([
        Packer.toBuffer(grantDoc).then(b => fs.writeFileSync(grantPath, b)),
        Packer.toBuffer(boardDoc).then(b => fs.writeFileSync(boardPath, b)),
        Packer.toBuffer(legalDoc).then(b => fs.writeFileSync(legalPath, b))
      ]);
      
      console.log(`\n✅ Documents generated:`);
      console.log(`   ${grantPath}`);
      console.log(`   ${boardPath}`);
      console.log(`   ${legalPath}`);
      console.log();
      return;
    }

    case 'brand':
      console.log("\nP31 FORGE — BRAND CONSTANTS");
      console.log("═".repeat(40) + "\n");
      console.log("COLORS:");
      Object.entries(B.COLORS).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} #${v}`));
      console.log("\nTYPOGRAPHY:");
      Object.entries(B.TYPE).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} ${typeof v === 'number' ? v/2 + 'pt' : v}`));
      console.log("\nENTITY:");
      Object.entries(B.ENTITY).forEach(([k, v]) => console.log(`  ${k.padEnd(16)} ${v}`));
      console.log("\nSOCIAL:");
      console.log(`  Tagline:  ${B.SOCIAL.tagline}`);
      console.log(`  Hashtags: ${B.SOCIAL.hashtags}`);
      console.log(`  CTA:      ${B.SOCIAL.cta}`);
      console.log();
      return;

    default:
      console.error(`Unknown command: ${cmd}. Run forge.js without args for help.`);
      process.exit(1);
  }

  // Write ad-hoc scaffold output
  const outDir = path.resolve(__dirname, 'out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ ${outPath}`);
}

if (require.main === module) {
  main().catch(e => {
    if (process.env.DEBUG) console.error(e);
    else console.error(`❌ ${e.message}`);
    process.exit(1);
  });
}

// Export for programmatic use (Worker/API, tests, build scripts)
module.exports = {
  compile, compileFile, renderBody,
  renderCourt, renderLetter, renderResolution, renderMemo, renderGrant,
  court, letter, corporate, grant, social,
  publish, publishPack, CHANNELS
};
