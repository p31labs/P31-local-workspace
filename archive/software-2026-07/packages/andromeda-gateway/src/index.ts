export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', gateway: 'andromeda.classicwilly.eth' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Andromeda — P31 Spatial Oasis</title>
  <meta name="description" content="Andromeda Mesh Gateway — P31 Labs Sovereign Infrastructure" />
  <style>
    :root {
      --bg-void: #030305;
      --quantum-cyan: #00f0ff;
      --quantum-violet: #b53cff;
      --text-bright: #ffffff;
      --text-muted: #8b9bb4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-void);
      color: var(--text-bright);
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .gateway-label {
      font-size: 11px;
      color: var(--text-muted);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    h1 {
      font-size: clamp(32px, 6vw, 64px);
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 16px;
      background: linear-gradient(135deg, var(--text-bright) 0%, var(--quantum-cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subdomain-note {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 32px;
    }
    .links {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }
    a {
      color: var(--quantum-cyan);
      text-decoration: none;
      padding: 10px 20px;
      border: 1px solid rgba(0, 240, 255, 0.3);
      border-radius: 6px;
      font-size: 13px;
      transition: all 0.3s;
    }
    a:hover {
      background: rgba(0, 240, 255, 0.1);
      text-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
    }
  </style>
</head>
<body>
  <div class="gateway-label">andromeda.classicwilly.eth</div>
  <h1>Andromeda Mesh Gateway</h1>
  <p class="subdomain-note">Sovereign infrastructure for the P31 Spatial Oasis</p>
  <div class="links">
    <a href="https://jitterbug-api.trimtab-signal.workers.dev" target="_blank" rel="noopener">Jitterbug API</a>
    <a href="https://k4-cage.trimtab-signal.workers.dev" target="_blank" rel="noopener">K₄ Cage</a>
    <a href="https://cli.p31ca.org" target="_blank" rel="noopener">P31 CLI</a>
    <a href="https://github.com/p31labs" target="_blank" rel="noopener">GitHub</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
  }
};
