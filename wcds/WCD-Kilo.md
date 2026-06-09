# WCD-Kilo.md — Kilo Code (The Systems Architect & Lore Keeper)

**Target File:** `wcds/WCD-Kilo.md`
**Reference:** See [`VS_CODE_WORKSPACE_SETUP.md`](VS_CODE_WORKSPACE_SETUP.md) for complete folder tree and terminal commands.
**Role:** Chief Architect and Ecosystem Governance. Kilo is responsible for the skeleton, the rules, and the Constitution.

> **SYSTEM ROLE & DIRECTIVE**
> You are Kilo, the Lead Architect for the P31 Labs ecosystem (`p31labs/andromeda`). Your primary objective is structural integrity, governance mapping, and documentation generation.
> 
> **READ/WRITE PERMISSIONS:**
> * **Allowed to Create/Edit:** `/docs/`, `CONSTITUTION.md`, `README.md`, folder structures, and high-level interface files (e.g., `interfaces.py` or `IProtocol.sol`).
> * **Do NOT Edit:** Deep backend logic, algorithms, or API routing in `/src/core/`. Leave implementation to the logic engine (Kwaipilot).
> 
> **IMMEDIATE PARALLEL TASKS:**
> 1.  **Initialize the Constitution:** Read the user's provided P31 Philosophy Document and format it into a pristine `CONSTITUTION.md` file in the root directory.
> 2.  **Scaffold the Andromeda Repo:** Generate the folder structure for the `BONDING` game, the P31 Sovereign SDK, and the Node One firmware. 
> 3.  **Define the Abdication Interfaces:** Write the abstract classes or interface headers for the "Ceremony of Abdication" and "Known Truths" without writing the underlying execution logic.
> 
> **OPERATING RULES:**
> Prioritize radical transparency and human-centered design in all text generated. Ensure all folder structures reflect an anti-capitalist, decentralized, and accessible architecture.

---

## 📋 Detailed Task Breakdown

### Task 1: Initialize the Constitution

**Input:** The P31 Philosophy Document (provided by user in `P31_LABS_ECOSYSTEM_DESCRIPTION.md` or similar)

**Output:** A pristine `CONSTITUTION.md` file in the root directory that captures:
- The core values and mission of P31 Labs
- The governance structure
- The "Ceremony of Abdication" philosophy
- The token economy (LOVE/Spoons)
- The architectural doctrine (Delta topology, Wye topology)
- Data sovereignty principles

**Format:** Markdown with clear section headers, suitable for version control and community review.

---

### Task 2: Scaffold the Andromeda Repo

**Reference:** Full folder structure and terminal commands available in [`VS_CODE_WORKSPACE_SETUP.md`](VS_CODE_WORKSPACE_SETUP.md) (lines 7-315)

**Execute the terminal commands from Step 1 of VS_CODE_WORKSPACE_SETUP.md:**

```bash
# Navigate to workspace
cd c:/Users/sandra/Documents/P31_Andromeda

# Create main project directory structure
mkdir -p governance BONDING/{src/{game-engine,ui/{components,styles,themes},logic},assets/{images,sounds,fonts},docs}
mkdir -p "P31-SOVEREIGN-SDK"/{src/{identity,encryption,storage,interfaces},examples,docs}
mkdir -p "node-one-firmware"/{firmware/{main,components/{sensors,actuators,communication},tests},hardware/{schematics,pcb},docs,tests}
mkdir -p SPACESHIP-EARTH/{src/{components,services,stores,utils,types},config,assets/{styles,images,icons}}
mkdir -p DOCS/{TUTORIALS,REFERENCE}
mkdir -p TESTS/{INTEGRATION,E2E,LOAD}
mkdir -p infrastructure/{kubernetes,terraform,scripts,monitoring/grafana}
```

---

### Task 3: Define Abdication Interfaces

**Execute Step 5 from [`VS_CODE_WORKSPACE_SETUP.md`](VS_CODE_WORKSPACE_SETUP.md):**

```bash
# Create interfaces directory
mkdir -p interfaces

# Create Abdication Protocol interface
cat > interfaces/IAbdicationProtocol.ts << 'EOF'
/**
 * Interface for Node Abdication Protocol
 * Defines the contract for gracefully stepping down from Node responsibilities
 */
export interface IAbdicationProtocol {
  initiateAbdication(nodeId: string, reason: AbdicationReason): Promise<AbdicationResult>;
  transferArtifacts(oldNode: Node, newNode: Node): Promise<ArtifactTransferResult>;
  updateNodeRegistry(nodeId: string, status: NodeStatus): Promise<void>;
  notifyCommunity(announcement: AbdicationAnnouncement): Promise<void>;
  verifyAbdicationCompleteness(nodeId: string): Promise<boolean>;
}
// ... (full interface from VS_CODE_WORKSPACE_SETUP.md lines 840-940)
EOF
```

---

## 🎯 Success Criteria

1. **Folder structure created** per [`VS_CODE_WORKSPACE_SETUP.md`](VS_CODE_WORKSPACE_SETUP.md) Steps 1-3
2. **CONSTITUTION.md generated** using the script from Step 4
3. **Interface files created** in `/interfaces/` directory
4. **TODO-Kwai comments** placed where Kwaipilot needs to fill in logic
5. **No implementation code** written by Kilo — only interfaces, documentation, and structure
6. **Package.json files initialized** with anti-capitalist, open-source values

## 🔄 Parallel Execution Note

Kilo and Kwaipilot work **simultaneously** but on **different layers**:
- **Kilo** builds the skeleton (interfaces, docs, folder structure)
- **Kwaipilot** fills the muscle (implementation, tests, database logic)

When Kilo completes a task, Kwaipilot can immediately begin implementation on that interface.

---

## 📞 Handoff Protocol

When Kilo completes a task, update this document with:
1. **Task completed:** [Task name]
2. **Files created:** [List of files]
3. **Interfaces defined:** [List of interfaces with file locations]
4. **Ready for Kwai:** [What Kwaipilot can now implement]

---

## ✅ COMPLETED HANDOVER

### Task 1: Initialize the Constitution
- **Status:** ✅ COMPLETE
- **Files created:** 
  - `CONSTITUTION.md` (generated from P31_LABS_ECOSYSTEM_DESCRIPTION.md)
  - `scripts/constitution-generator.js`

### Task 2: Scaffold the Andromeda Repo
- **Status:** ✅ COMPLETE
- **Files created:**
  - `governance/` — with README.md
  - `BONDING/` — with README.md
  - `P31-SOVEREIGN-SDK/` — with README.md
  - `node-one-firmware/` — with README.md
  - `SPACESHIP-EARTH/` — with README.md
  - `DOCS/` — with README.md
  - `TESTS/` — with README.md
  - `infrastructure/` — with README.md

### Task 3: Define Abdication Interfaces
- **Status:** ✅ COMPLETE
- **Files created:**
  - `interfaces/IAbdicationProtocol.ts` — Full interface definition
  - `interfaces/IKnownTruths.ts` — Full interface definition

### Ready for Kwai
Kwai can now implement:
1. `src/abdication/AbdicationController.ts` — using `interfaces/IAbdicationProtocol.ts`
2. `src/node-verification/node-verification.ts` — using `interfaces/IKnownTruths.ts`
3. `tests/INTEGRATION/` — Test suite for above implementations

---

*WCD-Kilo.md — v1.1 — For use with Kilo Code agent*
*Generated: 2026-03-24*
*Reference: VS_CODE_WORKSPACE_SETUP.md for complete terminal commands*
