# Observatory dome — JSON format (`p31-dome-v1`)

Used by `p31ca.org/dome.html` (viewer) and `p31ca.org/dome-generator.html` (builder).

## Shape

```json
{
  "schema": "p31-dome-v1",
  "title": "Visible in the dome UI when loaded",
  "vertices": {
    "unique-id": ["Label", 2, 1, 1, 0, "active", "ac", "optional notes"]
  },
  "edges": [
    ["from-id", "to-id", "relation-label"]
  ]
}
```

## Vertex tuple

Index | Field | Notes
-----|-------|------
0 | `label` | Shown on the panel detail card
1–4 | `a`, `b`, `c`, `d` | Non-negative weights (typically 0–4). Combined into direction on the dome and mixed into face color.
5 | `state` | Used for glow weighting and filters (e.g. `active`, `deployed`, `countdown`, `complete`, `missing`; unknown states get default styling).
6 | `bus` | Small label in UI (`vital`, `ac`, `dc`, or your own strings)
7 | `notes` | Optional string

## Limits

The mesh has **320** triangular faces. If you supply more than 320 nodes, extra nodes are **not** placed (assignment stops when faces run out).

## Loading

1. Use **Load .json** on the dome page, or  
2. Same-origin: generator **Download** then load the file.

Data is stored in `sessionStorage` under `p31-dome-dataset` until **Demo data** clears it.
