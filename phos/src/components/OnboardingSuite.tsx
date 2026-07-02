import React, { useState } from 'react';
import {
  Terminal, ShieldCheck, BookOpen, Users,
  Scale, FileText, Activity, LifeBuoy,
  Copy, Check, Battery, BatteryMedium,
  BatteryFull, AlertTriangle
} from 'lucide-react';

const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-emerald-500/20 bg-[#05070a]">
      <div className="flex justify-between items-center px-4 py-2 bg-emerald-950/30 border-b border-emerald-500/20">
        <span className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-widest">{language}</span>
        <button
          onClick={handleCopy}
          className="text-emerald-400/50 hover:text-emerald-400 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
};

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const DocArchitecture = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">1. Architecture Overview</h2>
      <p className="text-sm text-slate-400 mb-6">System map for technical stakeholders, engineers, and grant reviewers.</p>
    </div>
    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 overflow-x-auto">
      <pre className="text-[10px] font-mono text-emerald-400 leading-tight">{`┌─────────────────────────────────────────────────────────────────────┐
│                         PHOS Frontend                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │Sanctuary    │  │Attest       │  │Hearth       │                │
│  │Surface      │  │Surface      │  │Surface      │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                │                       │
│         └────────────────┼────────────────┘                       │
│                          │                                        │
│              ┌───────────▼───────────┐                            │
│              │   did-auth.ts         │                            │
│              │   (@noble/curves)     │                            │
│              └───────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS + Bearer Token
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers Layer                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            Evidence Vault (sovereign-justice-evidence)      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │ /attest     │  │ /edges      │  │ /taler/order        │ │   │
│  │  │ (co-sign)   │  │ (list)      │  │ (create LOVE token) │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            Sanctuary Room DO (WebSocket Hibernation)        │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  Real-time messaging via Hibernation WebSocket API   │  │   │
│  │  │  State persisted via serializeAttachment             │  │   │
│  │  │  Near-zero cost during idle periods                  │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               │ REST API
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GNU Taler Merchant Backend                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  POST /private/orders                                       │   │
│  │  Authorization: Bearer secret-token:...                     │   │
│  │  → Issues blind-signed LOVE tokens                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘`}</pre>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {[
        { comp: 'Frontend', tech: 'React + Astro', purp: 'Spoon-aware PHOS surfaces' },
        { comp: 'Identity', tech: 'W3C did:key Ed25519', purp: 'Sovereign DID attestation' },
        { comp: 'Crypto', tech: '@noble/curves/ed25519.js', purp: 'Cross-browser Ed25519 signing' },
        { comp: 'Real-time', tech: 'Durable Objects + WS', purp: 'Near-zero cost real-time messaging' },
        { comp: 'Payments', tech: 'GNU Taler merchant backend', purp: 'Privacy-preserving LOVE tokens' },
        { comp: 'Storage', tech: 'Cloudflare D1 + R2 + KV', purp: 'Chain-of-custody evidence vault' },
      ].map((item, i) => (
        <div key={i} className="p-4 border border-slate-800 bg-[#0a0e14] rounded-lg">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{item.comp}</div>
          <div className="text-sm text-emerald-400 font-mono mb-2">{item.tech}</div>
          <div className="text-sm text-slate-300">{item.purp}</div>
        </div>
      ))}
    </div>
  </div>
);

const DocProtocol = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">2. K₄ Mesh Protocol</h2>
      <p className="text-sm text-slate-400">The cryptographic core for developers and security auditors.</p>
    </div>
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2 mb-3">
          <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded text-emerald-300 font-mono">2.1</span>
          DID (Decentralized Identifier)
        </h3>
        <p className="text-sm text-slate-300 mb-3">
          A self-contained identifier derived directly from a public key. Format: <code className="text-emerald-400">did:key:z6Mk...</code> (multibase base58-btc prefix <code className="text-emerald-400">z</code>, multicodec <code className="text-emerald-400">0xed01</code>, 32-byte public key).
        </p>
        <CodeBlock language="typescript" code={`import { ed25519 } from '@noble/curves/ed25519.js';
const privateKey = ed25519.utils.randomPrivateKey();
const publicKey = ed25519.getPublicKey(privateKey);
const did = \`did:key:\${multibaseEncode(publicKey)}\`;`} />
      </section>
      <section>
        <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2 mb-3">
          <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded text-emerald-300 font-mono">2.2</span>
          Relationship Edge Attestation
        </h3>
        <p className="text-sm text-slate-300 mb-3">
          Two parties co-sign a JSON payload with their Ed25519 private keys. Both signatures are verified by the Evidence Vault before the edge is committed to D1.
        </p>
        <CodeBlock language="json" code={`{
  "partyA": "did:key:z6M...",
  "partyB": "did:key:z6M...",
  "edgeType": "co-parent",
  "terms": {"agreement": "..."},
  "transferable": false,
  "timestamp": 1234567890
}`} />
      </section>
      <section>
        <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2 mb-3">
          <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded text-emerald-300 font-mono">2.3</span>
          SHA-512 Chain-of-Custody
        </h3>
        <p className="text-sm text-slate-300 mb-3">
          Each attestation is hashed and linked to the previous entry, creating an immutable, auditable chain — <strong className="text-slate-200">court-admissible cryptographic evidence</strong>.
        </p>
        <CodeBlock language="python" code={`chainInput = JSON.stringify({
  edgeId: uuid, partyA: did, partyB: did,
  payloadHash: sha512(payload),
  prevHash: previousChainHash, timestamp: now
})
chainHash = sha512(chainInput)`} />
      </section>
      <section>
        <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2 mb-3">
          <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded text-emerald-300 font-mono">2.4</span>
          LOVE Token Issuance
        </h3>
        <p className="text-sm text-slate-300 mb-3">
          When parents communicate via SanctuarySurface, the system verifies the edge, calls GNU Taler's POST /private/orders, and issues a blind-signed LOVE token. 24-hour cooldown prevents spam.
        </p>
      </section>
    </div>
  </div>
);

const DocOnboarding = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">3. Onboarding Guide — First Family</h2>
      <p className="text-sm text-slate-400 mb-4">Step-by-step walkthrough for bringing the first family onto the K₄ mesh.</p>
    </div>
    <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl mb-6">
      <h4 className="text-amber-400 text-sm font-bold flex items-center gap-2 mb-2">
        <AlertTriangle size={16} /> Objective
      </h4>
      <p className="text-xs text-amber-200/80">
        Have at least <strong>one relationship edge attested</strong> and <strong>one LOVE token issued</strong> before submitting the NGI TALER grant (target: July 25, 2026).
      </p>
    </div>
    <div className="space-y-6">
      {[
        { step: '1', title: 'Generate Ed25519 Keypairs', desc: 'Each parent generates their own Ed25519 keypair via the PHOS AttestSurface. This is the foundation of their sovereign identity.', code: `# Generate Ed25519 keypair
ssh-keygen -t ed25519 -C "parent@family" -f ~/.ssh/k4_parent_key
# Extract public key in hex format
cat ~/.ssh/k4_parent_key.pub | cut -d' ' -f2 | base64 -d | xxd -p -c 64
# Extract private key in hex format
cat ~/.ssh/k4_parent_key | base64 -d | xxd -p -c 64` },
        { step: '2', title: 'Enter DIDs into AttestSurface', desc: 'Both parents navigate to Attest surface. Parent A enters their DID/key, Parent B enters theirs. Devices can be shared or separate.' },
        { step: '3', title: 'Define Relationship Terms', desc: 'Select Edge Type: co-parent. Enter terms as JSON indicating your agreement to use SanctuarySurface.' },
        { step: '4', title: 'Co-Sign the Attestation', desc: 'Click "Create Attestation (Both Parties Sign)". The system generates the payload, signs with both private keys, and submits to the Evidence Vault.' },
        { step: '5', title: 'Verify the Edge', desc: 'Navigate to Sanctuary surface. Send a test message to establish WebSocket connection via the SanctuaryRoom DO.' },
        { step: '6', title: 'Claim the First LOVE Token', desc: 'After 24 hours of using SanctuarySurface, a LOVE token is automatically issued. Click "Claim with Taler Wallet" to receive it.', code: `# Verify edge existence
curl -s https://sovereign-justice-evidence.trimtab-signal.workers.dev/api/health
# Expected: {"status":"ok","service":"evidence-vault"}` },
      ].map((s, i) => (
        <div key={i} className="relative pl-8 border-l-2 border-slate-800 pb-2">
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-800 border-2 border-emerald-500/30 flex items-center justify-center text-xs font-mono text-emerald-400">
            {s.step}
          </div>
          <h3 className="font-bold text-slate-200 text-sm mb-1">{s.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
          {s.code && <CodeBlock language="bash" code={s.code} />}
        </div>
      ))}
    </div>
  </div>
);

const DocUserGuide = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">4. Family User Guide</h2>
      <p className="text-sm text-slate-400">Plain-language instructions for end users.</p>
    </div>
    <div className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-4">
      <h3 className="text-emerald-400 font-bold">What is the K₄ Settlement?</h3>
      <p>A private, secure communication and coordination system for co-parenting families:</p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li><strong className="text-slate-200">Protect your privacy</strong> — no one else can read your messages.</li>
        <li><strong className="text-slate-200">Create a permanent record</strong> — communications can be verified in court if needed.</li>
        <li><strong className="text-slate-200">Reward cooperation</strong> — successful co-parenting milestones earn LOVE tokens.</li>
      </ul>

      <div className="h-px bg-slate-800 my-6" />

      <h3 className="text-emerald-400 font-bold">Getting Started</h3>

      <h4 className="text-slate-200 font-bold mt-4">1. Create Your Identity</h4>
      <p className="mb-2">
        Every person has a unique digital identity called a DID — think of it like a digital fingerprint. Open <code className="text-emerald-400">phos.p31ca.org</code>, go to Attest (⚮ icon), and click Generate. <strong className="text-amber-400">Save your private key somewhere safe.</strong>
      </p>

      <h4 className="text-slate-200 font-bold mt-4">2. Connect with Your Co-Parent</h4>
      <p className="mb-2">
        Enter your co-parent's DID, agree to terms, and click "Create Attestation". This creates a permanent cryptographic connection.
      </p>

      <h4 className="text-slate-200 font-bold mt-4">3. Communicate via Sanctuary</h4>
      <p className="mb-2">
        Go to Sanctuary (◈ icon) and start messaging. Private, secure, permanent record.
      </p>

      <h4 className="text-slate-200 font-bold mt-4">4. Earn LOVE Tokens</h4>
      <p className="mb-2">
        After 24 hours of successful communication, earn a privacy-preserving LOVE token. No one can track how you spend it.
      </p>

      <div className="h-px bg-slate-800 my-6" />

      <h3 className="text-emerald-400 font-bold">Frequently Asked Questions</h3>
      <div className="space-y-3">
        <div>
          <p className="font-bold text-slate-200 text-sm">What if I lose my private key?</p>
          <p className="text-xs text-slate-400">Your DID cannot be recovered. Generate a new keypair and create a new attestation with your co-parent.</p>
        </div>
        <div>
          <p className="font-bold text-slate-200 text-sm">Can a court read my messages?</p>
          <p className="text-xs text-slate-400">The K₄ Settlement creates a tamper-proof record of communications. If a court orders disclosure, you can export the verified log. Unlike screenshots, this cryptographic evidence cannot be forged.</p>
        </div>
        <div>
          <p className="font-bold text-slate-200 text-sm">Is my data stored on a blockchain?</p>
          <p className="text-xs text-slate-400">No. The K₄ Settlement uses zero blockchain. All data is stored in Cloudflare D1 (relational database) with SHA-512 chain-of-custody hashing for integrity.</p>
        </div>
      </div>
    </div>
  </div>
);

const DocLegal = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">5. Legal & Court Readiness</h2>
      <p className="text-sm text-slate-400">Chain-of-custody admissibility for attorneys and court personnel.</p>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2"><AlertTriangle size={18} /> The Problem</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Family courts are vulnerable to fake or altered digital evidence. Parenting apps rely on screenshots that can be manipulated.
        </p>
      </div>
      <div className="bg-emerald-900/10 border border-emerald-500/20 p-5 rounded-xl">
        <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2"><ShieldCheck size={18} /> The Solution</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Each communication is timestamped, SHA-512 hashed, chained to previous entries, and Ed25519 signed by both parties.
        </p>
      </div>
    </div>
    <div className="border-l-2 border-slate-700 pl-4">
      <h3 className="text-slate-200 font-bold mb-3">Admissibility in Family Court</h3>
      <p className="text-sm text-slate-400 mb-4">
        Text messages are generally admissible if the sender's identity can be verified, content is relevant, and context is preserved. K₄ Settlement exceeds these requirements:
      </p>
      <ul className="text-sm text-slate-300 space-y-2">
        <li><strong className="text-emerald-400 font-mono">Identity:</strong> Ed25519 signatures prove the sender.</li>
        <li><strong className="text-emerald-400 font-mono">Integrity:</strong> SHA-512 hashes prove content not altered.</li>
        <li><strong className="text-emerald-400 font-mono">Context:</strong> Full history preserved in Evidence Vault.</li>
      </ul>
    </div>
    <div className="p-4 bg-[#05070a] border border-slate-800 rounded-lg text-center">
      <p className="text-xs text-slate-500 italic">
        The K₄ Settlement provides cryptographic evidence, not legal advice. Consult with an attorney regarding admissibility in your jurisdiction.
      </p>
    </div>
  </div>
);

const DocGrant = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">6. NGI TALER Grant Submission</h2>
      <p className="text-sm text-slate-400">Proposal package for NLnet reviewers.</p>
    </div>
    <div className="bg-gradient-to-br from-slate-900 to-[#0a0e14] border border-slate-800 p-6 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <FileText size={100} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">LOVE-Ledger</h3>
      <p className="text-emerald-400 font-mono text-xs mb-4">Privacy-Preserving Relationship Rewards Using GNU Taler and Sovereign Identity</p>
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="bg-black/50 p-3 rounded border border-slate-800">
          <span className="text-slate-500 block mb-1 text-xs">Request</span>
          <span className="text-slate-200 font-mono font-bold">€20,000</span>
        </div>
        <div className="bg-black/50 p-3 rounded border border-slate-800">
          <span className="text-slate-500 block mb-1 text-xs">Deadline</span>
          <span className="text-slate-200 font-mono font-bold">August 1, 2026, 12:00 CEST</span>
        </div>
      </div>
      <div className="space-y-4 text-sm text-slate-300">
        <p>
          <strong className="text-white">Summary:</strong> LOVE-Ledger replaces surveillance-heavy co-parenting apps with a sovereign K₄ mesh. Co-signed Ed25519 DIDs attest relationship milestones on a decentralized evidence vault. These attestations trigger GNU Taler to issue blind-signed LOVE tokens.
        </p>
        <p>
          <strong className="text-emerald-400">The Moat:</strong> Zero hits for "co-parenting + GNU Taler" in exhaustive market research. The $1.93B co-parenting app market has no Chaumian privacy-preserving integration.
        </p>
        <div className="border-t border-slate-800 pt-4 mt-4">
          <h4 className="text-slate-200 font-bold mb-2">Assessment Criteria</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Technical excellence/feasibility (30%)</span>
              <span className="text-emerald-400">✅ Deployed, tested, live</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Relevance/Impact/Strategic potential (40%)</span>
              <span className="text-emerald-400">✅ Zero-hit moat; care economy</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Cost effectiveness/Value for money (30%)</span>
              <span className="text-emerald-400">✅ €20K for live production system</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <CodeBlock language="markdown" code={`# LOVE-Ledger: €20,000 Request
## Submitted to NLnet NGI TALER 14th Open Call
## Deadline: August 1, 2026, 12:00 CEST

### Deliverables
- Open source code (MIT/AGPL)
- Integration documentation
- Pilot with 3+ families
- Live network metrics

### Pass Threshold: >5.0/7`} />
      </div>
    </div>
  </div>
);

const DocRunbook = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">7. Operations Runbook</h2>
      <p className="text-sm text-slate-400">Day-to-day maintenance for system operators.</p>
    </div>
    <div className="space-y-6">
      <section>
        <h3 className="text-md font-bold text-slate-200 mb-3 border-b border-slate-800 pb-2">System Health Checks</h3>
        <div className="mb-4">
          <p className="text-sm text-emerald-400 font-mono mb-2">1. Verify Evidence Vault</p>
          <CodeBlock language="bash" code={`curl -s https://sovereign-justice-evidence.trimtab-signal.workers.dev/api/health
# Expected: {"status":"ok","service":"evidence-vault"}`} />
        </div>
        <div className="mb-4">
          <p className="text-sm text-emerald-400 font-mono mb-2">2. Verify D1 Database</p>
          <CodeBlock language="bash" code={`npx wrangler d1 execute JUSTICE_D1 --remote --command="SELECT COUNT(*) FROM relationship_edges;"
# Expected: > 0 (once families are onboarded)`} />
        </div>
        <div className="mb-4">
          <p className="text-sm text-emerald-400 font-mono mb-2">3. Verify GNU Taler Integration</p>
          <CodeBlock language="bash" code={`curl -s -X POST https://sovereign-justice-evidence.trimtab-signal.workers.dev/api/taler/order \\
  -H "Content-Type: application/json" \\
  -d '{"edgeId":"test","amount":"LOVE:0.10","summary":"test","fulfillmentUrl":"https://phos.p31ca.org"}'
# Expected: {"error":"Malformed auth token..."} (confirms protection)`} />
        </div>
      </section>
      <section className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <h3 className="text-md font-bold text-slate-200 mb-3">Maintenance Schedule</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <strong className="text-emerald-400 block mb-2 font-mono">Daily</strong>
            <ul className="text-slate-400 space-y-1 text-xs">
              <li>Check Evidence Vault health</li>
              <li>Monitor CF dashboard</li>
            </ul>
          </div>
          <div>
            <strong className="text-emerald-400 block mb-2 font-mono">Weekly</strong>
            <ul className="text-slate-400 space-y-1 text-xs">
              <li>Review D1 size/growth</li>
              <li>Check Taler sandbox</li>
              <li>Verify WS connections</li>
            </ul>
          </div>
          <div>
            <strong className="text-emerald-400 block mb-2 font-mono">Monthly</strong>
            <ul className="text-slate-400 space-y-1 text-xs">
              <li>Review chain integrity</li>
              <li>Backup D1 database</li>
              <li>Update dependencies</li>
            </ul>
          </div>
        </div>
      </section>
      <section>
        <h3 className="text-md font-bold text-slate-200 mb-3 border-b border-slate-800 pb-2">Scaling Considerations</h3>
        <p className="text-sm text-slate-400">
          The architecture scales to 100+ families with near-zero incremental cost: Durable Objects hibernate when idle (no billable duration), WebSocket connections remain active at the edge, and D1 scales automatically.
        </p>
      </section>
    </div>
  </div>
);

const DOCS: DocSection[] = [
  { id: 'arch', title: 'Architecture Overview', icon: <Terminal size={18} />, component: <DocArchitecture /> },
  { id: 'protocol', title: 'K₄ Mesh Protocol', icon: <ShieldCheck size={18} />, component: <DocProtocol /> },
  { id: 'onboard', title: 'Onboarding Guide', icon: <Users size={18} />, component: <DocOnboarding /> },
  { id: 'user', title: 'Family User Guide', icon: <BookOpen size={18} />, component: <DocUserGuide /> },
  { id: 'legal', title: 'Legal & Court Readiness', icon: <Scale size={18} />, component: <DocLegal /> },
  { id: 'grant', title: 'Grant Submission', icon: <FileText size={18} />, component: <DocGrant /> },
  { id: 'runbook', title: 'Operations Runbook', icon: <Activity size={18} />, component: <DocRunbook /> },
];

export function OnboardingSuite() {
  const [activeDoc, setActiveDoc] = useState(0);

  const getContainerClass = () => {
    return 'bg-[#0a0e14] text-slate-300';
  };

  return (
    <div className={`min-h-full font-sans ${getContainerClass()}`}>
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-emerald-500/20 bg-[#0a0e14]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-950 flex items-center justify-center border border-emerald-500/50">
            <span className="text-emerald-400 font-mono font-bold">K₄</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200 tracking-wide">P31 LABS</h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Sovereign Cognitive Infrastructure</p>
          </div>
        </div>
        <a
          href="/"
          className="text-xs font-mono text-emerald-400/70 hover:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded transition-colors"
        >
          ← Back to PHOS
        </a>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-65px)]">
        <aside className="w-full md:w-64 shrink-0 border-r border-slate-800/50 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-mono text-emerald-500/70 mb-4 px-3 uppercase tracking-widest">
            Document Suite
          </div>
          {DOCS.map((doc, index) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(index)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                activeDoc === index
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span className={activeDoc === index ? 'text-emerald-400' : 'text-slate-500'}>
                {doc.icon}
              </span>
              <span className="truncate">{doc.title}</span>
            </button>
          ))}
          <div className="mt-8 px-3 pt-4 border-t border-slate-800/50">
            <a
              href="mailto:will@p31ca.org"
              className="text-xs text-slate-500 hover:text-emerald-400 font-mono flex items-center gap-2 transition-colors"
            >
              <LifeBuoy size={14} /> Support & Contact
            </a>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0a0e14] to-[#0a0e14]">
          <div className="p-6 md:p-10 lg:p-12 max-w-4xl animate-[fadeIn_0.4s_ease-out_forwards]">
            {DOCS[activeDoc].component}
          </div>
        </main>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

export default OnboardingSuite;
