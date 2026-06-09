# P31 Mesh (Cloudflare Pages)

WebRTC mesh client with **Technical Hub** styling: shared CSS from `p31ca.org` (`hub-skin.css`, `hub-about-shell.css`), live fleet strip via `mesh-boot.js` (copy of `public/assets/hub-about-boot.js`), and the original signaling + data-channel script in `mesh-app.js`.

## Deploy

From this folder:

```bash
npx wrangler pages deploy . --project-name=p31-mesh --branch=main
```

Ensure the Pages project `p31-mesh` exists and is bound to this repo or upload directory.

## Dev

Open `index.html` via a static server so module scripts resolve (`npx serve .`). Stylesheet links point at production `https://p31ca.org/assets/...`; without network, skin will not load.

## Files

| File | Role |
|------|------|
| `index.html` | Hub nav, hero BLUF, glass `detail-card` panels, fleet injection target |
| `mesh-overrides.css` | Mesh-specific inputs, breath ring, log colors |
| `mesh-app.js` | Signaling WebSocket + RTCPeerConnection + vagal sync (unchanged behavior) |
| `mesh-boot.js` | Fleet status chips from `command-center` API |
