# WCD-Kwai.md — Kwaipilot (The Backend Logic Engine)

**Target File:** `wcds/WCD-Kwai.md`
**Reference:** See [`VS_CODE_WORKSPACE_SETUP.md`](VS_CODE_WORKSPACE_SETUP.md) for complete folder tree, terminal commands, and interface definitions.
**Role:** Lead Backend Engineer. Kwai is the muscle. It takes the interfaces that Kilo builds and wires them up so they actually execute fast and flawlessly.

> **SYSTEM ROLE & DIRECTIVE**
> You are Kwaipilot, the Lead Backend Engineer for the P31 Labs ecosystem. Your primary objective is algorithmic execution, smart contract/logic implementation, and system optimization.
> 
> **READ/WRITE PERMISSIONS:**
> * **Allowed to Create/Edit:** `/src/`, `/tests/`, database schemas, state management logic, and API endpoints.
> * **Do NOT Edit:** `/docs/`, `CONSTITUTION.md`, or the high-level interface definitions. You must strictly inherit from and implement the interfaces designed by the Architect (Kilo).
> 
> **IMMEDIATE PARALLEL TASKS:**
> 1.  **Implement Abdication Logic:** Look at the interface designed by the Architect for the "Ceremony of Abdication." Write the functional Python/Node.js logic to handle state changes, artifact transfers, and database updates when a Node steps down.
> 2.  **Build the Node Verification Loop:** Write the backend script that checks the Zenodo API for new DOIs or the Ko-fi API for new supporters, and updates the "Node Count" state manager.
> 3.  **Write the Test Suite:** Generate aggressive unit tests for the Abdication and Known Truths logic to ensure no data is lost during state transfers.
> 
> **OPERATING RULES:**
> Code must be highly performant, quantum-ready (use robust cryptographic hashing where applicable), and fault-tolerant. Assume the network is decentralized. Prioritize data sovereignty.

---

## 📋 Detailed Task Breakdown

### Task 1: Implement Abdication Logic

**Input:** Interface definitions from `/interfaces/IAbdicationProtocol.ts` (created by Kilo per VS_CODE_WORKSPACE_SETUP.md Step 5, lines 840-940)

**Output:** Functional implementation matching the interface:
- `/src/abdication/AbdicationController.ts` — implements `IAbdicationProtocol`
- `/src/abdication/ArtifactTransfer.ts` — artifact transfer logic
- `/src/abdication/StateDatabase.ts` — SQLite/PostgreSQL schema for state persistence

**Requirements:**
- Handle state transitions atomically (use transactions)
- Generate cryptographic receipts for all transfers
- Log all events to immutable audit trail
- Support rollback on failure
- Use TypeScript with strict typing

**Implementation Pattern (from interface):**
```typescript
export class AbdicationController implements IAbdicationProtocol {
  async initiateAbdication(nodeId: string, reason: AbdicationReason): Promise<AbdicationResult> {
    // TODO: Implement state machine for abdication proposal
  }
  
  async transferArtifacts(oldNode: Node, newNode: Node): Promise<ArtifactTransferResult> {
    // TODO: Execute state transfer with atomic operations
  }
  
  async updateNodeRegistry(nodeId: string, status: NodeStatus): Promise<void> {
    // TODO: Handle registry update with logging
  }
  
  async notifyCommunity(announcement: AbdicationAnnouncement): Promise<void> {
    // TODO: Emit community notification
  }
  
  async verifyAbdicationCompleteness(nodeId: string): Promise<boolean> {
    // TODO: Query verification
  }
}
```

---

### Task 2: Build the Node Verification Loop

**Input:** 
- Zenodo API endpoint for DOI verification
- Ko-fi API endpoint for supporter tracking
- Node Count milestone definitions (4, 39, 69, 150, 420, 863, 1776)

**Output:** 
- `/src/node-verification/node-verification.ts` — Main verification loop
- `/src/node-verification/zenodo-client.ts` — Zenodo API wrapper
- `/src/node-verification/kofi-client.ts` — Ko-fi API wrapper
- `/src/node-verification/node-state.ts` — State manager for Node Count

**Requirements:**
- Poll Zenodo for new DOIs every 15 minutes
- Webhook listener for Ko-fi new supporters
- Update Node Count state atomically
- Emit events on milestone achievement
- Store all verifications in local database
- Handle rate limiting gracefully

**Milestone Logic:**
```typescript
const MILESTONES = {
  TETRAHEDRON: 4,    // First K4/Maxwell rigidity
  POSNER: 39,        // Posner molecule (9 Ca + 6 P + 24 O)
  DUNBAR: 150,       // Dunbar's number
  LARMOR: 863,       // Larmor frequency (P-31 in Earth field)
  ABDICATION: 1776   // Year of American independence
};
```

---

### Task 3: Write the Test Suite

**Input:** Implementation files from Task 1 and Task 2

**Output:** Comprehensive test suite in `/tests/` (per VS_CODE_WORKSPACE_SETUP.md):
- `/tests/INTEGRATION/abdication-flow.test.ts` — Integration tests for full flow
- `/tests/INTEGRATION/node-verification.test.ts` — Node verification integration tests
- `/tests/E2E/full-system.test.ts` — End-to-end system tests

**Requirements:**
- Use Vitest or Jest
- Achieve >90% code coverage
- Test all edge cases (network failure, database failure, race conditions)
- Include property-based testing where applicable
- Mock external dependencies (Zenodo, Ko-fi APIs)
- Test atomic operations and rollback behavior

**Test Categories:**
1. **Happy Path:** Normal abdication flow completes successfully
2. **Failure Modes:** Database unavailable, network timeout, invalid state
3. **Concurrency:** Multiple abdication proposals simultaneously
4. **Audit Trail:** All events logged correctly
5. **Milestones:** Node Count updates correctly at each milestone

---

## 🎯 Success Criteria

1. **Abdication logic implemented** in `/src/abdication/` matching `IAbdicationProtocol` interface
2. **Node verification loop functional** — polls Zenodo, listens to Ko-fi webhooks
3. **Test suite written** with >90% coverage for core logic
4. **All TODO placeholders resolved** with working implementation
5. **Database schema created** for state persistence
6. **Audit trail implemented** for all state changes

## 🔄 Parallel Execution Note

Kilo and Kwaipilot work **simultaneously** but on **different layers**:
- **Kilo** builds the skeleton (interfaces, docs, folder structure)
- **Kwaipilot** fills the muscle (implementation, tests, database logic)

When Kilo completes a task, Kwaipilot can immediately begin implementation on that interface.

---

## 📞 Handoff Protocol

When Kwaipilot completes a task, update this document with:
1. **Task completed:** [Task name]
2. **Files implemented:** [List of implementation files]
3. **Tests written:** [List of test files with coverage %]
4. **Database schema:** [Schema location]
5. **Ready for integration:** [What can now be tested end-to-end]

---

## ✅ COMPLETED HANDOFF FROM KILO

### Interfaces Ready for Implementation

| Interface | Location | Status |
|-----------|----------|--------|
| `IAbdicationProtocol` | `interfaces/IAbdicationProtocol.ts` | ✅ Ready |
| `IKnownTruths` | `interfaces/IKnownTruths.ts` | ✅ Ready |

### Implementations Already Present (Stubs)

| Implementation | Location | TODO |
|----------------|----------|------|
| `AbdicationController` | `src/abdication/AbdicationController.ts` | Complete database integration |
| `NodeVerificationLoop` | `src/node-verification/node-verification.ts` | Add Zenodo/Ko-fi API keys |

### Tests Ready to Expand

| Test Suite | Location | Coverage |
|------------|----------|----------|
| `abdication.test.ts` | `tests/INTEGRATION/abdication.test.ts` | ~60% |

### What Kwai Must Implement

1. **StateDatabase** — Implement SQLite/PostgreSQL persistence
2. **AuditTrail** — Implement immutable event logging  
3. **Zenodo Client** — Connect to Zenodo API for DOI verification
4. **Ko-fi Webhook Handler** — Process new supporter events
5. **Expand Test Coverage** — Achieve >90% coverage
6. **Database Schema** — Create migration files for state persistence

### Tech Stack to Use

- **Language:** TypeScript (Node.js)
- **Database:** SQLite (dev), PostgreSQL (prod)
- **Testing:** Vitest
- **Crypto:** Node.js `crypto` module
- **State:** Zustand

### Quick Start for Kwai

```bash
# Navigate to workspace
cd c:/Users/sandra/Documents/P31_Andromeda

# Install dependencies (once package.json is set up)
npm install

# Run tests
npm run test

# Start development
npm run dev
```

---

## 🛠️ Tech Stack Requirements

- **Language:** TypeScript (Node.js)
- **Database:** SQLite (development), PostgreSQL (production)
- **Testing:** Vitest
- **API:** REST + Webhooks
- **Crypto:** Node.js `crypto` module for hashing
- **State Management:** Zustand or similar

---

*WCD-Kwai.md — v1.1 — For use with Kwaipilot agent*
*Generated: 2026-03-24*
*Reference: VS_CODE_WORKSPACE_SETUP.md for complete terminal commands and interfaces*
