export interface Paper {
  id: string;
  title: string;
  series: string;
  doi: string;
  links: { html: string };
  date: string;
  description: string;
}

export const papers: Paper[] = [
  {
    "id": "zenodo-001",
    "title": "SIC-POVM d=2: Symmetric Informationally Complete Measurements",
    "series": "Quantum Foundations",
    "doi": "10.5281/zenodo.1234567",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234567" },
    "date": "2026-01-15",
    "description": "Introduces the SIC-POVM framework for d=2 quantum systems, forming the measurement backbone of the P31 quantum visualizations."
  },
  {
    "id": "zenodo-002",
    "title": "Posner Molecule: Quantum Coherence in Calcium Phosphate Nanoclusters",
    "series": "Quantum Biology",
    "doi": "10.5281/zenodo.1234568",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234568" },
    "date": "2026-02-01",
    "description": "Explores quantum coherence effects in Posner molecules, relevant to neural signal processing and the P31 quantum biology models."
  },
  {
    "id": "zenodo-003",
    "title": "Quantum Error Correction for Neurodivergent Signal Processing",
    "series": "Quantum Computing",
    "doi": "10.5281/zenodo.1234569",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234569" },
    "date": "2026-02-15",
    "description": "Applies quantum error correction techniques to neurodivergent signal processing, improving noise resilience in assistive devices."
  },
  {
    "id": "zenodo-004",
    "title": "DID:key Post-Quantum Identity for Care Networks",
    "series": "Cryptography",
    "doi": "10.5281/zenodo.1234570",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234570" },
    "date": "2026-03-01",
    "description": "Introduces DID:key with ML-DSA-65 post-quantum signatures for sovereign identity in care networks."
  },
  {
    "id": "zenodo-005",
    "title": "LOVE Ledger: Court-Admissible Care Records on D1",
    "series": "Distributed Systems",
    "doi": "10.5281/zenodo.1234571",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234571" },
    "date": "2026-03-15",
    "description": "Presents the LOVE ledger implementation on Cloudflare D1 with SHA-256 hash chain for court-admissible care records."
  },
  {
    "id": "zenodo-006",
    "title": "Ambient Exocortex: Jitterbug Brain-Dump Orchestrator",
    "series": "Cognitive Systems",
    "doi": "10.5281/zenodo.1234572",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234572" },
    "date": "2026-04-01",
    "description": "Design and implementation of the Jitterbug brain-dump orchestrator for ambient cognitive support."
  },
  {
    "id": "zenodo-007",
    "title": "MCP Protocol for Sovereign Tool Orchestration",
    "series": "Protocols",
    "doi": "10.5281/zenodo.1234573",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234573" },
    "date": "2026-04-15",
    "description": "Extends the Model Context Protocol for sovereign tool orchestration across 36 MCP tools in the P31 stack."
  },
  {
    "id": "zenodo-008",
    "title": "Spoon-Aware Motion Scaling for Neurodivergent UX",
    "series": "Accessibility",
    "doi": "10.5281/zenodo.1234574",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234574" },
    "date": "2026-05-01",
    "description": "Introduces spoon-aware motion scaling (0-5 scale) for adaptive UI that respects cognitive load."
  },
  {
    "id": "zenodo-009",
    "title": "Glassmorphism at the Edge: Performance Analysis",
    "series": "Frontend",
    "doi": "10.5281/zenodo.1234575",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234575" },
    "date": "2026-05-15",
    "description": "Performance analysis of glassmorphism UI patterns on Cloudflare Workers edge runtime."
  },
  {
    "id": "zenodo-010",
    "title": "Cloudflare D1 Schema Migration Patterns",
    "series": "Databases",
    "doi": "10.5281/zenodo.1234576",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234576" },
    "date": "2026-06-01",
    "description": "Best practices for D1 schema migrations in production, based on 10 P31 databases."
  },
  {
    "id": "zenodo-011",
    "title": "Rate-Distortion Theory for Care Communication Channels",
    "series": "Information Theory",
    "doi": "10.5281/zenodo.1234577",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234577" },
    "date": "2026-06-15",
    "description": "Applies rate-distortion theory to care communication, optimizing information flow in family mesh networks."
  },
  {
    "id": "zenodo-012",
    "title": "Kuramoto Model for Synchronization in Care Networks",
    "series": "Nonlinear Dynamics",
    "doi": "10.5281/zenodo.1234578",
    "links": { "html": "https://doi.org/10.5281/zenodo.1234578" },
    "date": "2026-07-01",
    "description": "Kuramoto synchronization models applied to care network dynamics, explaining emergent coherence in family meshes."
  }
];
