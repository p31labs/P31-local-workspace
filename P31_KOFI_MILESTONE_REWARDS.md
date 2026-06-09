# P31 Labs Ko-fi Node Count Milestone Rewards

**Shop URL:** ko-fi.com/trimtab69420/shop
**Updated:** 2026-03-24

---

## Node Count System

Every supporter = 1 node in the Delta mesh. Node Count tracks real-time supporter growth.

### Milestone Structure

| Nodes | Milestone | Significance | Reward Unlocked |
|-------|-----------|--------------|-----------------|
| **4** | First Tetrahedron | Maxwell rigidity achieved — the minimum stable structure | First Tetrahedron Badge + Early Spaceship Earth access |
| **39** | Posner Number | Ca₉(PO₄)₆ — calcium cage protecting phosphorus | Posner Cage Badge + Feature priority vote |
| **69** | Nice | Humor | Nice Badge + Discord access |
| **150** | Dunbar's Number | Maximum meaningful social connections | Dunbar Badge + Monthly community call |
| **420** | Tetrahedral Angle × 7 | Community multiplier | Tetrahedron Badge + Name in Spaceship Earth credits |
| **863** | Larmor Frequency | ³¹P resonance in Earth's field — the heartbeat | Larmor Badge + Node One prototype vote |
| **1776** | Abdication | Systems change — Crown ceded authority | Abdication Badge + Founding member status |

---

## Reward Details

### First Tetrahedron (4 nodes)
**Badge:** First Tetrahedron Badge
**Unlocked:** Immediately at 4 nodes
**Reward:** Early access to Spaceship Earth features
**Description:** "Maxwell rigidity achieved — the minimum stable structure."

### Posner Cage (39 nodes)
**Badge:** Posner Cage Badge
**Unlocked:** Immediately at 39 nodes
**Reward:** Vote on next feature priority
**Description:** "Ca₉(PO₄)₆ — calcium cage protecting phosphorus."

### Nice (69 nodes)
**Badge:** Nice Badge
**Unlocked:** Immediately at 69 nodes
**Reward:** Discord access to P31 Labs community
**Description:** "Humor."

### Dunbar (150 nodes)
**Badge:** Dunbar Badge
**Unlocked:** Immediately at 150 nodes
**Reward:** Monthly community call invitation
**Description:** "Maximum meaningful social connections one human can maintain."

### Tetrahedron (420 nodes)
**Badge:** Tetrahedron Badge
**Unlocked:** Immediately at 420 nodes
**Reward:** Name in Spaceship Earth credits
**Description:** "Tetrahedral angle in degrees × 7."

### Larmor (863 nodes)
**Badge:** Larmor Badge
**Unlocked:** Immediately at 863 nodes
**Reward:** Limited edition Node One prototype vote
**Description:** "³¹P resonance in Earth's magnetic field — the heartbeat of the system."

### Abdication (1776 nodes)
**Badge:** Abdication Badge
**Unlocked:** Immediately at 1776 nodes
**Reward:** Founding member status for P31 Labs
**Description:** "The year the Crown ceded authority — systems change."

---

## Integration Points

### Ko-fi Webhook Worker
**File:** `p31_kofi_webhook_worker.js`
**Features:**
- Real-time Node Count tracking via Cloudflare KV
- Milestone detection and reward unlocking
- GET endpoint for public Node Count status
- Support logging for analytics

### Public API Endpoints
```
GET /node-count
{
  "node_count": 42,
  "next_milestone": {
    "target": 69,
    "remaining": 27,
    "meaning": "Nice"
  },
  "rewards": [
    {"id": "first-tetrahedron", "unlocked": true, ...},
    {"id": "locked-69", "unlocked": false, "remaining": 27, ...}
  ],
  "milestone_meaning": "First tetrahedron — Maxwell rigidity achieved",
  "progress": 67
}
```

### Display Integration
**Target:** phosphorus31.org landing page
**Features:**
- Real-time Node Count display
- Progress bar to next milestone
- Unlocked rewards showcase
- Milestone significance tooltips

---

## Technical Implementation

### Node Count Storage
- **KV Namespace:** NODE_COUNT_KV
- **Key:** `node_count` (integer string)
- **Fallback:** In-memory for local development

### Milestone Logic
```javascript
const NODE_MILESTONES = [4, 39, 69, 150, 420, 863, 1776];

function getNextMilestone(count) {
  for (const milestone of NODE_MILESTONES) {
    if (milestone > count) {
      return { target: milestone, remaining: milestone - count };
    }
  }
  return null;
}
```

### Reward System
- **Badge IDs:** `first-tetrahedron`, `posner-cage`, `nice`, `dunbar`, `tetrahedron`, `larmor`, `abdication`
- **Unlock Logic:** `count >= milestone_target`
- **Locked Rewards:** Show next milestone with remaining count

---

## Public Display

### Landing Page Integration
**File:** `phosphorus31.org/index.html` (or React equivalent)
**Features:**
- Node Count counter with animation
- Progress bar to next milestone
- Milestone badges (unlocked/locked)
- Clickable milestones for significance
- Supporter count growth chart

### Real-time Updates
- **WebSocket:** Optional real-time Node Count updates
- **Polling:** Fallback polling every 30 seconds
- **Cache:** Service Worker caching for offline display

---

## Community Impact

### Social Proof
- **Node Count:** Public demonstration of community support
- **Milestone Celebrations:** Automatic milestone announcements
- **Badge System:** Visual recognition for supporters

### Growth Incentives
- **Milestone Rewards:** Tangible benefits for reaching milestones
- **Progress Tracking:** Clear visibility of growth trajectory
- **Community Building:** Shared goals and achievements

---

## Deployment

### Webhook Worker
```bash
wrangler deploy p31_kofi_webhook_worker.js
```

### Landing Page
```bash
# React/Next.js build
npm run build
# Deploy to Cloudflare Pages
```

---

## Support & Maintenance

### Monitoring
- **Node Count Accuracy:** Daily sync with Ko-fi API
- **Webhook Reliability:** Error logging and alerting
- **Performance:** Response time monitoring

### Updates
- **Milestone Additions:** Can add new milestones as needed
- **Reward Changes:** Update reward descriptions and benefits
- **Display Enhancements:** Improve visual presentation

---

## Legal & Compliance

### Data Handling
- **Supporter Data:** Email, name, timestamp stored
- **Privacy:** GDPR compliant data handling
- **Retention:** Support logs retained for analytics

### Tax Considerations
- **Donations:** Tax-deductible for US supporters
- **Digital Products:** Sales tax where applicable
- **International:** VAT handling for EU supporters

---

## Future Enhancements

### Advanced Features
- **Supporter Profiles:** Optional supporter pages
- **Milestone Events:** Special events at major milestones
- **Integration:** Connect with other P31 Labs systems

### Analytics
- **Growth Tracking:** Supporter acquisition trends
- **Milestone Impact:** Effect of milestones on growth
- **Geographic Distribution:** Supporter locations

---

## Contact

**P31 Labs Support:** support@p31labs.org
**Ko-fi Shop:** ko-fi.com/trimtab69420/shop

---

*Every node is a timestamped act of care. Every milestone is a step toward the Delta mesh.*
*It's okay to be a little wonky.* 🔺