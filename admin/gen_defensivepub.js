const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, LevelFormat, PageBreak, TabStopType
} = require('docx');

// ─── Constants ────────────────────────────────────────────────────
const PAGE_W = 12240;
const PAGE_H = 15840;
const MARGIN = 1440;
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9360

const PHOSPHORUS = "2DFF A0";
const FONT = "Arial";

// ─── Helpers ──────────────────────────────────────────────────────
const t = (text, opts = {}) => new TextRun({ text, font: FONT, size: 22, ...opts });
const tb = (text, opts = {}) => t(text, { bold: true, ...opts });
const ti = (text, opts = {}) => t(text, { italics: true, ...opts });
const mono = (text, opts = {}) => new TextRun({ text, font: "Courier New", size: 20, ...opts });
const monob = (text) => mono(text, { bold: true });

const para = (children, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 276 },
  children: Array.isArray(children) ? children : [children],
  ...opts
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 200 },
  children: [tb(text, { size: 28 })]
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 160 },
  children: [tb(text, { size: 24 })]
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 120 },
  children: [tb(text, { size: 22, italics: true })]
});

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function makeCell(children, opts = {}) {
  const items = Array.isArray(children) ? children : [children];
  const paras = items.map(c => {
    if (c instanceof Paragraph) return c;
    if (c instanceof TextRun) return para([c], { spacing: { after: 0 } });
    return para([t(String(c))], { spacing: { after: 0 } });
  });
  return new TableCell({
    borders,
    margins: cellMargins,
    children: paras,
    ...opts
  });
}

function headerCell(text, width) {
  return new TableCell({
    borders,
    margins: cellMargins,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "2C3E50", type: ShadingType.CLEAR },
    children: [para([tb(text, { color: "FFFFFF", size: 20 })], { spacing: { after: 0 } })]
  });
}

function dataCell(children, width) {
  const items = Array.isArray(children) ? children : [typeof children === 'string' ? t(children, { size: 20 }) : children];
  return new TableCell({
    borders,
    margins: cellMargins,
    width: { size: width, type: WidthType.DXA },
    children: [para(items, { spacing: { after: 0 } })]
  });
}

// ─── Document ─────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: FONT },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: FONT },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, italics: true, font: FONT },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbering",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [t("P31 Labs \u2014 Defensive Publication", { size: 16, color: "999999", italics: true })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            t("phosphorus31.org", { size: 16, color: "999999" }),
            t("  |  ", { size: 16, color: "CCCCCC" }),
            t("AGPL-3.0", { size: 16, color: "999999" }),
            t("  |  ", { size: 16, color: "CCCCCC" }),
            t("February 2026", { size: 16, color: "999999" }),
          ]
        })]
      })
    },
    children: [

      // ═══════════════════════════════════════════════════════════════
      // TITLE
      // ═══════════════════════════════════════════════════════════════

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [tb("DEFENSIVE PUBLICATION", { size: 36 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [t("\u2500".repeat(50), { color: "CCCCCC", size: 16 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [tb("Method and Apparatus for Out-of-Band Cognitive Load Management via OS-Level Digital Intercepts and Serial Hardware Feedback", { size: 26 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [t("\u2500".repeat(50), { color: "CCCCCC", size: 16 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [t("Inventor: William Rodger Johnson", { size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [t("Organization: P31 Labs (Georgia 501(c)(3), pending)", { size: 20 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [t("Website: phosphorus31.org  |  GitHub: github.com/p31labs", { size: 20 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [t("Date: February 25, 2026", { size: 20 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [t("Publication Type: Defensive (prior art establishment)", { size: 20, italics: true })]
      }),

      // ═══════════════════════════════════════════════════════════════
      // ABSTRACT
      // ═══════════════════════════════════════════════════════════════

      h1("1. Abstract"),

      para([
        t("This publication details a localized, sovereign computing architecture designed to manage operator cognitive load through an "),
        tb("out-of-band hardware feedback loop"),
        t(". Unlike existing neuroadaptive systems that measure biological outputs (EEG, heart rate, galvanic skin response) to modify visual interfaces, this system "),
        tb("intercepts digital inputs"),
        t(" (OS-level API firehoses from IMAP, Slack, GitHub, and similar platforms) and "),
        tb("triggers physical responses"),
        t(" via a dedicated serial hardware peripheral."),
      ]),

      para([
        t("The system comprises three novel components operating in concert: (1) a Cognitive Shield that scores incoming digital communications for urgency, emotional load, and cognitive demand; (2) a constrained 4-axis taxonomy that normalizes heterogeneous life data into a unified state representation; and (3) a hardware Totem that receives framed serial commands to provide haptic and visual feedback outside the operator\u2019s primary visual interface."),
      ]),

      para([
        t("This architecture is specifically designed as "),
        tb("assistive technology for neurodivergent individuals"),
        t(" with executive function challenges, providing a somatic anchor that externalizes cognitive state management to physical sensation rather than adding to screen-based information overload."),
      ]),

      // ═══════════════════════════════════════════════════════════════
      // NOVELTY
      // ═══════════════════════════════════════════════════════════════

      h1("2. Statement of Novelty"),

      para([t("The following table contrasts the described system with the current state of the art in adaptive user experience technology as of February 2026:")]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [2200, 3580, 3580],
        rows: [
          new TableRow({ children: [
            headerCell("Design Axis", 2200),
            headerCell("2025\u20132026 Academic Standard (XR/BCI)", 3580),
            headerCell("P31 Sovereign Terminal", 3580),
          ]}),
          new TableRow({ children: [
            dataCell("Data Source", 2200),
            dataCell("Biometric sensors (EEG, HR, GSR)", 3580),
            dataCell("OS-level digital intercepts (IMAP, Slack, GitHub APIs)", 3580),
          ]}),
          new TableRow({ children: [
            dataCell("Mitigation", 2200),
            dataCell("In-band UI simplification (screen modification)", 3580),
            dataCell("Out-of-band haptic/visual cue via serial hardware", 3580),
          ]}),
          new TableRow({ children: [
            dataCell("State Model", 2200),
            dataCell("Unbounded physiological strain metrics", 3580),
            dataCell([t("Constrained 4-axis taxonomy ", { size: 20 }), mono("A+B+C+D")], 3580),
          ]}),
          new TableRow({ children: [
            dataCell("Feedback Path", 2200),
            dataCell("Visual: same screen the user is already watching", 3580),
            dataCell("Physical: separate hardware peripheral (Totem)", 3580),
          ]}),
          new TableRow({ children: [
            dataCell("Target User", 2200),
            dataCell("General population in VR/XR environments", 3580),
            dataCell("Neurodivergent operators (AuDHD, executive function)", 3580),
          ]}),
        ]
      }),

      para([]),

      // ═══════════════════════════════════════════════════════════════
      // VOLTAGE SCORING
      // ═══════════════════════════════════════════════════════════════

      h1("3. Algorithmic Neuro-Translation: Voltage Scoring"),

      h2("3.1 Cognitive Shield"),

      para([
        t("The system employs a \u201CCognitive Shield\u201D component that intercepts raw incoming communications from digital platforms (IMAP email, Slack, GitHub notifications, and similar API endpoints). This shield functions as a synthetic neuro-translator, quantifying the impact of external digital signals on the operator\u2019s cognitive capacity."),
      ]),

      h2("3.2 Voltage Score Formula"),

      para([
        t("Impact is calculated as a \u201CVoltage Score\u201D using the following weighted formula, operating on a "),
        tb("0\u201310 scale"),
        t(":"),
      ]),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        children: [
          ti("V"),
          t(" = ("),
          ti("w"),
          t("\u2081 \u00D7 "),
          ti("U"),
          t(") + ("),
          ti("w"),
          t("\u2082 \u00D7 "),
          ti("E"),
          t(") + ("),
          ti("w"),
          t("\u2083 \u00D7 "),
          ti("C"),
          t(")"),
        ]
      }),

      para([t("Where:")]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [1500, 2000, 5860],
        rows: [
          new TableRow({ children: [
            headerCell("Variable", 1500),
            headerCell("Name", 2000),
            headerCell("Description", 5860),
          ]}),
          new TableRow({ children: [
            dataCell([ti("V", { size: 20 })], 1500),
            dataCell("Voltage Score", 2000),
            dataCell("Composite cognitive load (0\u201310)", 5860),
          ]}),
          new TableRow({ children: [
            dataCell([ti("U", { size: 20 })], 1500),
            dataCell("Urgency", 2000),
            dataCell("Time-pressure keywords: urgent, asap, blocker, critical, deadline, emergency (0\u201310)", 5860),
          ]}),
          new TableRow({ children: [
            dataCell([ti("E", { size: 20 })], 1500),
            dataCell("Emotional Load", 2000),
            dataCell("Affective intensity keywords: angry, frustrated, unacceptable, disappointed, furious, terrible (0\u201310)", 5860),
          ]}),
          new TableRow({ children: [
            dataCell([ti("C", { size: 20 })], 1500),
            dataCell("Cognitive Demand", 2000),
            dataCell("Complexity keywords: review, architecture, refactor, redesign, migrate, complex (0\u201310)", 5860),
          ]}),
          new TableRow({ children: [
            dataCell([ti("w", { size: 20 }), t("\u2081", { size: 20 })], 1500),
            dataCell("Urgency weight", 2000),
            dataCell([monob("0.4")], 5860),
          ]}),
          new TableRow({ children: [
            dataCell([ti("w", { size: 20 }), t("\u2082", { size: 20 })], 1500),
            dataCell("Emotional weight", 2000),
            dataCell([monob("0.3")], 5860),
          ]}),
          new TableRow({ children: [
            dataCell([ti("w", { size: 20 }), t("\u2083", { size: 20 })], 1500),
            dataCell("Cognitive weight", 2000),
            dataCell([monob("0.3")], 5860),
          ]}),
        ]
      }),

      para([]),

      h2("3.3 Voltage Thresholds and Spoon Cost"),

      para([
        t("The composite voltage score maps to discrete severity levels, each carrying a defined \u201Cspoon cost\u201D (energy deduction from the operator\u2019s cognitive capacity pool):"),
      ]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [2000, 2500, 2500, 2360],
        rows: [
          new TableRow({ children: [
            headerCell("Level", 2000),
            headerCell("Composite Range", 2500),
            headerCell("Spoon Cost", 2500),
            headerCell("Hex Indicator", 2360),
          ]}),
          new TableRow({ children: [
            dataCell([t("GREEN", { size: 20, color: "27AE60" })], 2000),
            dataCell([mono("V < 3.0")], 2500),
            dataCell("0.5 spoons", 2500),
            dataCell([mono("0x00")], 2360),
          ]}),
          new TableRow({ children: [
            dataCell([t("YELLOW", { size: 20, color: "F39C12" })], 2000),
            dataCell([mono("3.0 \u2264 V < 6.0")], 2500),
            dataCell("1.0 spoons", 2500),
            dataCell([mono("0x01")], 2360),
          ]}),
          new TableRow({ children: [
            dataCell([t("RED", { size: 20, color: "E74C3C" })], 2000),
            dataCell([mono("6.0 \u2264 V < 8.0")], 2500),
            dataCell("2.0 spoons", 2500),
            dataCell([mono("0x02")], 2360),
          ]}),
          new TableRow({ children: [
            dataCell([t("CRITICAL", { size: 20, color: "8E44AD" })], 2000),
            dataCell([mono("V \u2265 8.0")], 2500),
            dataCell("3.0 spoons", 2500),
            dataCell([mono("0x03")], 2360),
          ]}),
        ]
      }),

      para([]),

      h2("3.4 Spoon Theory Model"),

      para([
        t("The system uses a constrained energy model based on \u201CSpoon Theory\u201D (Miserandino, 2003), a widely-adopted framework in the disability community for quantifying limited cognitive and physical energy:"),
      ]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [4000, 5360],
        rows: [
          new TableRow({ children: [
            headerCell("Parameter", 4000),
            headerCell("Value", 5360),
          ]}),
          new TableRow({ children: [
            dataCell("Daily baseline", 4000),
            dataCell([monob("12.0"), t(" spoons", { size: 20 })], 5360),
          ]}),
          new TableRow({ children: [
            dataCell("Context switch cost", 4000),
            dataCell([monob("\u22121.5"), t(" spoons", { size: 20 })], 5360),
          ]}),
          new TableRow({ children: [
            dataCell("Social masking cost", 4000),
            dataCell([monob("\u22123 to \u22125"), t(" spoons per hour", { size: 20 })], 5360),
          ]}),
          new TableRow({ children: [
            dataCell("Conflict resolution cost", 4000),
            dataCell([monob("\u22125"), t(" spoons", { size: 20 })], 5360),
          ]}),
          new TableRow({ children: [
            dataCell("Breathing exercise restore", 4000),
            dataCell([monob("+0.5"), t(" spoons", { size: 20 })], 5360),
          ]}),
          new TableRow({ children: [
            dataCell("Deep work (30 min) restore", 4000),
            dataCell([monob("+1.0"), t(" spoons", { size: 20 })], 5360),
          ]}),
          new TableRow({ children: [
            dataCell("Hardware totem click restore", 4000),
            dataCell([monob("+0.5"), t(" spoons", { size: 20 })], 5360),
          ]}),
        ]
      }),

      para([]),

      // ═══════════════════════════════════════════════════════════════
      // TAXONOMY
      // ═══════════════════════════════════════════════════════════════

      h1("4. Multi-Axis Taxonomy (P31 IVM Graph)"),

      para([
        t("The system organizes all operator data into a 4-axis taxonomy. Each incoming data node is classified into exactly one axis. The system maintains a normalized state representation where relative attention across axes can be expressed in barycentric coordinates:"),
      ]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [800, 2000, 1800, 4760],
        rows: [
          new TableRow({ children: [
            headerCell("Axis", 800),
            headerCell("Domain", 2000),
            headerCell("Color", 1800),
            headerCell("Scope", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("A")], 800),
            dataCell("Identity", 2000),
            dataCell([t("#ff6b6b", { size: 20, color: "FF6B6B" })], 1800),
            dataCell("Authentication, profiles, personal data, social identity", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("B")], 800),
            dataCell("Health", 2000),
            dataCell([t("#4ecdc4", { size: 20, color: "4ECDC4" })], 1800),
            dataCell("Spoons, breathing, wellness, medical, sensory regulation", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("C")], 800),
            dataCell("Legal", 2000),
            dataCell([t("#ffe66d", { size: 20, color: "BBA800" })], 1800),
            dataCell("Licenses, compliance, contracts, fiscal, court", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("D")], 800),
            dataCell("Technical", 2000),
            dataCell([t("#a29bfe", { size: 20, color: "7B73D9" })], 1800),
            dataCell("Code, infrastructure, firmware, protocols, architecture", 4760),
          ]}),
        ]
      }),

      para([]),

      // ═══════════════════════════════════════════════════════════════
      // HARDWARE BRIDGE
      // ═══════════════════════════════════════════════════════════════

      h1("5. Hardware Bridge and Out-of-Band Feedback"),

      h2("5.1 Serial Protocol Specification"),

      para([
        t("Rather than altering the operator\u2019s visual interface, the system bridges the digital cognitive state to a dedicated physical hardware peripheral designated the \u201CTotem.\u201D Communication is established via USB CDC (Native USB on GPIO19/20, NOT UART0) using the following protocol:"),
      ]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [3500, 5860],
        rows: [
          new TableRow({ children: [
            headerCell("Parameter", 3500),
            headerCell("Value (Canonical)", 5860),
          ]}),
          new TableRow({ children: [
            dataCell("Magic byte", 3500),
            dataCell([monob("0x31"), t(" (Phosphorus-31, atomic number)", { size: 20 })], 5860),
          ]}),
          new TableRow({ children: [
            dataCell("Baud rate", 3500),
            dataCell([monob("115200")], 5860),
          ]}),
          new TableRow({ children: [
            dataCell("Frame encoding", 3500),
            dataCell("COBS (Consistent Overhead Byte Stuffing)", 5860),
          ]}),
          new TableRow({ children: [
            dataCell("Frame delimiter", 3500),
            dataCell([monob("0x00")], 5860),
          ]}),
          new TableRow({ children: [
            dataCell("Integrity check", 3500),
            dataCell([t("CRC8-MAXIM: polynomial ", { size: 20 }), monob("0x31"), t(", init ", { size: 20 }), monob("0xFF")], 5860),
          ]}),
          new TableRow({ children: [
            dataCell("Max frame size", 3500),
            dataCell([monob("256"), t(" bytes", { size: 20 })], 5860),
          ]}),
          new TableRow({ children: [
            dataCell("USB interface", 3500),
            dataCell("Native USB CDC (GPIO19/20 on ESP32-S3)", 5860),
          ]}),
          new TableRow({ children: [
            dataCell("Authentication (specified)", 3500),
            dataCell([t("HMAC-SHA256 (first 16 bytes), 8-byte random nonce", { size: 20 })], 5860),
          ]}),
        ]
      }),

      para([]),

      h2("5.2 Frame Structure"),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [mono("COBS_ENCODE( MAGIC | CMD | PAYLOAD | CRC8 ) + 0x00")]
      }),

      para([
        t("Every frame is constructed by prepending the magic byte "),
        mono("0x31"),
        t(", followed by a command byte, optional payload, and a CRC8-MAXIM checksum computed over all preceding bytes. The assembled frame is then COBS-encoded to eliminate "),
        mono("0x00"),
        t(" bytes from the payload, allowing "),
        mono("0x00"),
        t(" to serve as an unambiguous frame delimiter."),
      ]),

      h2("5.3 Command Table"),

      para([
        t("The following commands are defined in the protocol (sourced from "),
        mono("firmware/include/protocol.h"),
        t("):"),
      ]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [1400, 3200, 4760],
        rows: [
          new TableRow({ children: [
            headerCell("Hex", 1400),
            headerCell("Command", 3200),
            headerCell("Payload", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0x01")], 1400),
            dataCell("CMD_HEARTBEAT", 3200),
            dataCell("None (keepalive)", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0x02")], 1400),
            dataCell("CMD_HAPTIC", 3200),
            dataCell("1 byte: DRV2605L waveform effect ID", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0x03")], 1400),
            dataCell("CMD_LED", 3200),
            dataCell("1 byte: PWM brightness (0\u2013255)", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0x10")], 1400),
            dataCell([tb("CMD_SPOON_REPORT", { size: 20 })], 3200),
            dataCell([tb("2 bytes: big-endian uint16, spoons \u00D7 10 (fixed-point, 1 decimal)", { size: 20 })], 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0x20")], 1400),
            dataCell("CMD_CLICK_EVENT", 3200),
            dataCell("None (Totem \u2192 host: physical click occurred)", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0x30")], 1400),
            dataCell("CMD_BREATHING_SYNC", 3200),
            dataCell("Breathing pacer synchronization", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0xA0")], 1400),
            dataCell("CMD_ACK", 3200),
            dataCell("None (acknowledgment)", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0xA1")], 1400),
            dataCell("CMD_NACK", 3200),
            dataCell("None (negative acknowledgment)", 4760),
          ]}),
        ]
      }),

      para([]),

      h2("5.4 CRC8-MAXIM Verification"),

      para([
        t("The CRC8-MAXIM algorithm (polynomial "),
        mono("0x31"),
        t(", initial value "),
        mono("0xFF"),
        t(", MSB-first, no reflection, no XOR-out) is implemented identically in the firmware (C), the frontend serial bridge (TypeScript), and validated by automated tests. Canonical verification vector:"),
      ]),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [
          mono("CRC8([0x31, 0x01, 0x00]) = "),
          monob("0x24"),
        ]
      }),

      para([
        t("This value was verified by compiling and executing the C implementation on 2025-02-24."),
      ]),

      h2("5.5 Bidirectional Feedback Loop"),

      para([
        t("The system implements a "),
        tb("closed feedback loop"),
        t(" between the host and the Totem. Data flows in both directions:"),
      ]),

      para([
        tb("Host \u2192 Totem (downstream commands): "),
        t("When the Cognitive Shield processes a high-voltage communication, the host backend transmits "),
        mono("CMD_HAPTIC"),
        t(" ("),
        mono("0x02"),
        t(") to the Totem with a DRV2605L waveform effect ID as payload. The Totem provides a calibrated physical cue proportional to severity, alerting the operator without requiring visual attention."),
      ]),

      para([
        tb("Totem \u2192 Host (upstream reports): "),
        t("The Totem independently tracks operator energy and periodically transmits "),
        mono("CMD_SPOON_REPORT"),
        t(" ("),
        mono("0x10"),
        t(") to the host. The payload is a 2-byte big-endian unsigned integer representing the spoon count multiplied by 10 (fixed-point, one decimal). The firmware defines "),
        mono("SPOON_BASELINE = 120"),
        t(" (representing 12.0 spoons). When the operator physically interacts with the Totem (a deliberate tactile action), the firmware transmits "),
        mono("CMD_CLICK_EVENT"),
        t(" ("),
        mono("0x20"),
        t(") to the host, restoring 0.5 spoons and closing the feedback loop: digital stress triggers physical warning; physical interaction restores digital capacity."),
      ]),

      para([
        tb("Current implementation note: "),
        t("The host (Python) and Totem (C) each maintain independent spoon state. Bidirectional spoon synchronization (where the host pushes updated spoon counts downstream after deductions) is a described architecture component not yet implemented in firmware. The independent tracking model provides baseline functionality; synchronization will unify the two state representations."),
      ]),

      // ═══════════════════════════════════════════════════════════════
      // PROGRESSIVE DISCLOSURE
      // ═══════════════════════════════════════════════════════════════

      h1("6. Progressive Disclosure (Adaptive Interface Complexity)"),

      para([
        t("The system dynamically adjusts user interface complexity based on the operator\u2019s current spoon level, providing a graduated response that reduces cognitive demand as energy depletes:"),
      ]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [1000, 1600, 2000, 4760],
        rows: [
          new TableRow({ children: [
            headerCell("Layer", 1000),
            headerCell("Name", 1600),
            headerCell("Spoon Range", 2000),
            headerCell("Visible Interface", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("0")], 1000),
            dataCell("Breathe", 1600),
            dataCell([mono("< 3")], 2000),
            dataCell("Void palette, breathing pacer only (4\u20132\u20136 pattern)", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("1")], 1000),
            dataCell("Focus", 1600),
            dataCell([mono("3\u20136")], 2000),
            dataCell("Editor + AI chat only", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("2")], 1000),
            dataCell("Build", 1600),
            dataCell([mono("6\u20139")], 2000),
            dataCell("Full IDE (default state)", 4760),
          ]}),
          new TableRow({ children: [
            dataCell([monob("3")], 1000),
            dataCell("Command", 1600),
            dataCell([mono("9\u201312")], 2000),
            dataCell("All systems, passphrase-gated", 4760),
          ]}),
        ]
      }),

      para([]),

      // ═══════════════════════════════════════════════════════════════
      // HARDWARE
      // ═══════════════════════════════════════════════════════════════

      h1("7. Hardware Implementation"),

      para([
        t("The Totem hardware peripheral is based on the "),
        tb("ESP32-S3 DevKitC-1"),
        t(" microcontroller running Arduino framework firmware. Key components:"),
      ]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [3000, 6360],
        rows: [
          new TableRow({ children: [
            headerCell("Component", 3000),
            headerCell("Specification", 6360),
          ]}),
          new TableRow({ children: [
            dataCell("MCU", 3000),
            dataCell("ESP32-S3 (240MHz dual-core, 16MB flash)", 6360),
          ]}),
          new TableRow({ children: [
            dataCell("Framework", 3000),
            dataCell("Arduino (NOT ESP-IDF)", 6360),
          ]}),
          new TableRow({ children: [
            dataCell("USB", 3000),
            dataCell("Native USB CDC (GPIO19/20), ARDUINO_USB_CDC_ON_BOOT=1", 6360),
          ]}),
          new TableRow({ children: [
            dataCell("Haptic driver", 3000),
            dataCell("DRV2605L via I2C (addr 0x5A), Adafruit library", 6360),
          ]}),
          new TableRow({ children: [
            dataCell("Haptic motor type", 3000),
            dataCell("LRA (Linear Resonant Actuator), feedback register 0x1A = 0xB6", 6360),
          ]}),
          new TableRow({ children: [
            dataCell("Build system", 3000),
            dataCell("PlatformIO (board: esp32-s3-devkitc-1)", 6360),
          ]}),
          new TableRow({ children: [
            dataCell("Future: mesh networking", 3000),
            dataCell("LoRa via Meshtastic (peer-to-peer, no cloud dependency)", 6360),
          ]}),
        ]
      }),

      para([]),

      // ═══════════════════════════════════════════════════════════════
      // CLAIMS
      // ═══════════════════════════════════════════════════════════════

      h1("8. Claims of Prior Art"),

      para([
        t("This defensive publication establishes prior art for the following specific technical claims:"),
      ]),

      para([
        tb("Claim 1: "),
        t("A method of managing operator cognitive load by intercepting digital communications at the OS/API level, scoring them for urgency, emotional load, and cognitive demand using a weighted formula, and transmitting the resulting state to a dedicated out-of-band hardware peripheral via a framed serial protocol."),
      ], { spacing: { after: 160 } }),

      para([
        tb("Claim 2: "),
        t("A serial communication protocol using COBS framing with a magic byte identifier, CRC8-MAXIM integrity checking, and a defined command vocabulary for transmitting cognitive state (spoon reports), requesting haptic feedback, and synchronizing breathing exercises between a host computer and a peripheral device."),
      ], { spacing: { after: 160 } }),

      para([
        tb("Claim 3: "),
        t("A progressive disclosure interface that dynamically adjusts the complexity of a development environment based on a quantified cognitive energy model (spoon theory), transitioning between discrete layers from minimal (breathing pacer only) to full system access."),
      ], { spacing: { after: 160 } }),

      para([
        tb("Claim 4: "),
        t("The combination of digital-input voltage scoring (as opposed to biometric measurement) with out-of-band haptic hardware feedback (as opposed to in-band screen modification) as an integrated assistive technology system for neurodivergent individuals."),
      ], { spacing: { after: 160 } }),

      // ═══════════════════════════════════════════════════════════════
      // IMPLEMENTATION
      // ═══════════════════════════════════════════════════════════════

      h1("9. Implementation Status"),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [4000, 2000, 3360],
        rows: [
          new TableRow({ children: [
            headerCell("Component", 4000),
            headerCell("Status", 2000),
            headerCell("Repository Path", 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Voltage scoring engine", 4000),
            dataCell([t("Implemented", { size: 20, color: "27AE60" })], 2000),
            dataCell([mono("backend/buffer_agent.py", { size: 18 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Serial protocol (TypeScript)", 4000),
            dataCell([t("Implemented", { size: 20, color: "27AE60" })], 2000),
            dataCell([mono("frontend/src/lib/serial.ts", { size: 18 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Serial protocol (C/firmware)", 4000),
            dataCell([t("Implemented", { size: 20, color: "27AE60" })], 2000),
            dataCell([mono("firmware/include/protocol.h", { size: 18 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("ESP32-S3 firmware", 4000),
            dataCell([t("Implemented", { size: 20, color: "27AE60" })], 2000),
            dataCell([mono("firmware/src/main.cpp", { size: 18 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Progressive disclosure", 4000),
            dataCell([t("Implemented", { size: 20, color: "27AE60" })], 2000),
            dataCell([mono("frontend/src/App.jsx", { size: 18 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("WebSocket real-time bridge", 4000),
            dataCell([t("Implemented", { size: 20, color: "27AE60" })], 2000),
            dataCell([mono("backend/buffer_agent.py", { size: 18 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("HMAC-SHA256 authentication", 4000),
            dataCell([t("Specified", { size: 20, color: "F39C12" })], 2000),
            dataCell([mono("CONVERGENCE_PROMPT.md", { size: 18 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("LoRa mesh networking", 4000),
            dataCell([t("Planned", { size: 20, color: "95A5A6" })], 2000),
            dataCell("Future iteration", 3360),
          ]}),
        ]
      }),

      para([]),

      // ═══════════════════════════════════════════════════════════════
      // LICENSE
      // ═══════════════════════════════════════════════════════════════

      h1("10. Open-Source Declaration"),

      para([
        t("All described implementations are released under the "),
        tb("GNU Affero General Public License v3.0 (AGPL-3.0)"),
        t(" and are publicly available at "),
        mono("github.com/p31labs/p31"),
        t(". This defensive publication and the accompanying source code are intended to establish prior art in the public domain, preventing any party from obtaining patent protection over the described methods and apparatus."),
      ]),

      para([
        t("Organization: P31 Labs, a Georgia 501(c)(3) nonprofit (pending). Fiscal sponsor: HCB (Hack Club Bank). Website: phosphorus31.org."),
      ]),

      // ═══════════════════════════════════════════════════════════════
      // ERRATA
      // ═══════════════════════════════════════════════════════════════

      h1("Appendix A: Errata from Prior Drafts"),

      para([
        t("An earlier draft of this publication (produced via multi-agent synthesis) contained the following errors, which are corrected in this version:"),
      ]),

      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [3000, 3000, 3360],
        rows: [
          new TableRow({ children: [
            headerCell("Item", 3000),
            headerCell("Error (Prior Draft)", 3000),
            headerCell("Correction (This Version)", 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Spoon report command", 3000),
            dataCell([mono("0x04"), t(" (nonexistent)", { size: 20 })], 3000),
            dataCell([monob("0x10"), t(" (CMD_SPOON_REPORT)", { size: 20 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Voltage scale", 3000),
            dataCell("0\u2013100", 3000),
            dataCell([tb("0\u201310", { size: 20 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Spoon payload", 3000),
            dataCell("1-byte integer (0\u201312)", 3000),
            dataCell([tb("2-byte big-endian uint16, value \u00D710", { size: 20 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("CRC8 integrity", 3000),
            dataCell("Not mentioned", 3000),
            dataCell([tb("CRC8-MAXIM on every frame", { size: 20 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Auth mechanism", 3000),
            dataCell("Described as implemented", 3000),
            dataCell([tb("Specified, not yet implemented", { size: 20 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Mesh networking", 3000),
            dataCell("\"Reticulum Network Stack\"", 3000),
            dataCell([tb("LoRa via Meshtastic", { size: 20 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("Framework", 3000),
            dataCell("ESP-IDF assumed", 3000),
            dataCell([tb("Arduino framework", { size: 20 })], 3360),
          ]}),
          new TableRow({ children: [
            dataCell("CMD_SPOON_REPORT direction", 3000),
            dataCell("Host transmits to Totem", 3000),
            dataCell([tb("Totem transmits to Host (upstream); Host sends CMD_HAPTIC downstream. Bidirectional closed loop.", { size: 20 })], 3360),
          ]}),
        ]
      }),

    ]
  }]
});

// ─── Write ────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/claude/P31_Defensive_Publication_v1.0.docx", buffer);
  console.log("✓ Written: P31_Defensive_Publication_v1.0.docx");
});
