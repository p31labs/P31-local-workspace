# Mesh-Resilience Research Note

**Document ID:** P31-MR-RN-2026-001
**Status:** Live (auto-updated)
*This document is automatically updated every 6 hours with live pilot data.*
**Date:** 2026-07-11
**Author:** P31 Labs Research Division (W.R. Johnson)
**Related:** Zenodo 18627420, 19004485 (Tetrahedron Protocol, preprints)

---

## 1. Executive Summary

The Tetrahedron Protocol preprints propose that the regular tetrahedron (K₄) is a
universal design principle for resilient systems, appearing in quantum measurement
(SIC-POVMs), structural rigidity (isostatic frameworks), and network topology
(Ollivier-Ricci curvature). This note applies that geometric insight to the
mesh-node resilience of P31 Labs' `firmware/node-zero/` (ESP32-based LoRa/cellular
edge nodes).

**Key claim:** A tetrahedral (K₄) topology — where each node connects to exactly
three others — is the minimal rigid mesh that maximises resilience to node failure
while minimising communication overhead. The Ollivier-Ricci curvature of such a
mesh is strictly positive, implying synchronous convergence and strong fault tolerance.

**Practical implication:** By enforcing a K₄ connectivity rule in the node-zero
firmware, the mesh can maintain coherence under up to 33% node loss (one of four
vertices) without requiring a central coordinator.

---

## 2. Background: Isostatic Rigidity & K₄

Maxwell's criterion for a 3D rigid framework: a structure is *isostatic*
(minimally rigid) when `E = 3V - 6` for a free-floating structure, or `E = 3V`
for a statically determinate structure anchored to the ground. For a tetrahedron
(V=4, E=6), we have `E = 3V - 6`, which is exactly isostatic.

This property is the minimal edge count that prevents deformation — any fewer
edges (e.g., a triangle) is flexible; any more edges introduces redundancy. The
tetrahedron is the unique minimal rigid 3D framework.

The preprints apply this to network topology: a K₄ network (four nodes, six
bidirectional edges) is the smallest resilient mesh that can withstand any single
node failure (the remaining three nodes still form a triangle, which is rigid in
2D but flexible in 3D — however, in practical mesh networks, 3 nodes can still
function as a clique with reduced capacity).

For larger meshes, the K₄ topology can be tiled (tetrahedral-tessellated
networks) to produce scalable resilience.

---

## 3. The Mesh-Node Zero Architecture

The `firmware/node-zero/` targets ESP32-based edge nodes with:

- **LoRa** for low-bandwidth, long-range mesh communication
- **Cellular (4G/LTE)** for fallback connectivity
- **LVGL touch UI** for user interaction
- **Battery-powered, low-energy** operation

**Current state:** Nodes communicate via a flood-based routing protocol with a
central coordinator (gateway). Resilience is achieved via redundant paths, but
there is no formal guarantee of rigidity.

**Proposed enhancement:** Replace the flood-based protocol with a K₄-constrained
mesh, where each node maintains exactly three peers (based on signal strength /
geographic proximity). The mesh forms a tetrahedral tiling (triangulated 3D
network) that ensures every node belongs to at least one K₄ clique.

**Verification metric:** Ollivier-Ricci curvature of the mesh graph. Positive
curvature implies the mesh is expanding and synchronising — messages converge
quickly and the network is robust to edge failures.

---

## 4. Ollivier-Ricci Curvature as a Health Metric

Ollivier-Ricci curvature generalises Ricci curvature to discrete graphs. For an
edge `(x,y)`, the curvature is defined as:

```
κ(x,y) = 1 - W(μ_x, μ_y) / d(x,y)
```

where `μ_x` is a measure on the neighbourhood of `x` (e.g., uniform over
neighbours), `W` is the Wasserstein-1 distance, and `d(x,y)` is the distance
between nodes.

**Key result (from the preprints):** A K₄ graph has strictly positive
Ollivier-Ricci curvature for every edge. This implies:

- **Synchronisation:** nodes converge to consensus quickly (via Kuramoto coupling).
- **Fault tolerance:** removing one vertex leaves a triangle (still positive
  curvature in 2D, but curvature drops; the network remains functional).
- **Load balancing:** traffic is evenly distributed over the six edges.

**Implementation in node-zero firmware:**

- Each node computes its local curvature by measuring packet loss and latency to
  its three peers.
- If curvature drops below a threshold, the node initiates a peer-rotation event
  (seeking a new peer to restore K₄).
- The central gateway monitors the global curvature distribution and alerts if a
  region becomes hypoconvex (potential partition).

---

## 5. Engineering Path

| Phase | Task | Deliverable | Effort |
|-------|------|-------------|--------|
| 1 | Implement K₄ neighbour selection in node-zero firmware | Peer-discovery module with RSSI/latency sorting | 2 weeks |
| 2 | Add curvature computation (using packet loss + latency) | Health metric exposed via MQTT / LoRa | 1 week |
| 3 | Integrate peer-rotation logic (failover) | Self-healing mesh | 2 weeks |
| 4 | Test in lab: 4, 8, 12 node mesh with simulated failures | Resilience report | 2 weeks |
| 5 | Deploy to pilot family mesh (5 nodes) | Field data | 4 weeks |

---

## 6. Pilot Status (Live Data)

*This section is automatically updated every 6 hours by the live-docs pipeline.*

{{PILOT_TABLE}}

---

## 7. Node Registry (Live)

*This section is automatically updated every 6 hours by the live-docs pipeline.*

{{NODE_TABLE}}

---

## 8. Mesh Health Metrics (Auto‑updated)

*This section is automatically updated every 6 hours by the live-docs pipeline.*

- Average curvature: {{AVG_CURVATURE}}
- Worst node: {{WORST_NODE}}
- Last update: {{LAST_UPDATE}}

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| K₄ constraint too rigid (e.g., 3 peers not always available) | Network partitions | Allow dynamic fallback to 2-peer (triangle) for leaf nodes; monitor curvature |
| LoRa bandwidth insufficient for frequent curvature updates | Increased latency | Compress curvature data, send only on significant change (delta > 0.1) |
| Central coordinator single point of failure | Loss of curvature monitoring | Use a distributed consensus (Raft) among a subset of nodes to replace the gateway |

---

## 10. Relationship to LOVE/CBS

The K₄ topology is the classical analogue of the SIC-POVM geometry and the CBS
four-party attestation model (user, issuer, ledger, court). This note applies the
same geometric insight to physical-layer resilience — the mesh that underpins the
LOVE ledger's local-first care accounting.

**Shared principle:** Isostatic rigidity (E=6, V=4) is the minimal condition for
resilience without redundancy. This is the design heuristic that unites the
quantum, cryptographic, and network layers of P31 Labs.

---

## 11. References

- Johnson, W.R. (P31 Labs, Inc.). *The Tetrahedron Protocol: A Geometric
  Framework for Unified Systems Theory Connecting SIC-POVM Quantum Measurement,
  Structural Rigidity, and Biological Coherence.* Zenodo (2026).
  DOI: [10.5281/zenodo.18627420](https://doi.org/10.5281/zenodo.18627420).
- Johnson, W.R. (P31 Labs, Inc.). *The Tetrahedron Protocol: A Grand Unified
  Theory of Structural Resilience.* Zenodo (2026).
  DOI: [10.5281/zenodo.19004485](https://doi.org/10.5281/zenodo.19004485).
- Ollivier, Y. *A visual introduction to Riemannian curvatures and some discrete
  generalisations.* (2009).

---

## 12. Next Steps

- Review this research note with the firmware engineering team.
- Prototype the K₄ peer-selection logic in the node-zero test harness.
- Collect curvature data from the existing 5-node family pilot.
- Publish a follow-up note with empirical results.

---

## 13. Pilot Status (Live Data)

{{PILOT_TABLE}}

## 14. Node Registry (Live)

{{NODE_TABLE}}

## 15. Mesh Health Metrics (Auto-updated)

- Average curvature: {{AVG_CURVATURE}}
- Worst node: {{WORST_NODE}}
- Last update: {{LAST_UPDATE}}

*End of Research Note*
