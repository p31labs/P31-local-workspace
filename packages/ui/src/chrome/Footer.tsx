/**
 * @file Footer — Shared P31 site footer (all 4 apps).
 *
 * Canonical glass footer with grid layout. Identical across
 * phosphorus31, p31ca, PHOS, and WILLOW.
 */

export function Footer() {
  return (
    <footer className="ui-chrome glass-strong mt-24 py-16 border-t-2 border-quantum-violet" style={{ paddingBottom: 'calc(var(--p31-chrome-strip-h, 22px) + 1rem)' }}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36">
              <rect width="512" height="512" rx="112" fill="#A78BFA" />
              <circle cx="390" cy="120" r="48" fill="#00F0FF" />
              <text x="256" y="340" fontFamily="'JetBrains Mono', monospace" fontWeight="900" fontSize="220" fill="#F5F5F7" textAnchor="middle">P31</text>
              <rect x="156" y="380" width="200" height="16" rx="8" fill="#FBBF24" />
            </svg>
            <span className="font-bold text-ink">P31 Labs, Inc.</span>
          </div>
          <p className="text-cloud/80 max-w-sm mb-2">Georgia Nonprofit Corporation. 501(c)(3) application pending.</p>
          <p className="text-cloud/50 text-sm mb-6">Built by Will Johnson · SE Georgia.</p>
          <div className="flex items-center flex-wrap gap-4 text-sm">
            <a href="https://p31ca.org/" target="_blank" rel="noopener noreferrer" className="text-quantum-cyan hover:text-quantum-cyan/80 font-semibold transition-colors">Technical hub</a>
            <span className="text-cloud/20">·</span>
            <a href="https://github.com/p31labs" target="_blank" rel="noopener noreferrer" className="text-cloud/60 hover:text-cloud transition-colors">GitHub</a>
            <span className="text-cloud/20">·</span>
            <a href="https://discord.gg/uYW5rTCuZ" target="_blank" rel="noopener noreferrer" className="text-cloud/60 hover:text-cloud transition-colors">Discord</a>
            <span className="text-cloud/20">·</span>
            <a href="https://ko-fi.com/trimtab69420" target="_blank" rel="noopener noreferrer" className="text-cloud/60 hover:text-cloud transition-colors">Ko-fi</a>
            <span className="text-cloud/20">·</span>
            <a href="mailto:will@p31ca.org" className="text-cloud/60 hover:text-cloud transition-colors">will@p31ca.org</a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-quantum-gold mb-4">Products</h4>
          <ul className="space-y-3 text-cloud/70 text-sm">
            <li><a href="https://phos.p31ca.org" target="_blank" rel="noopener noreferrer" className="hover:text-cloud transition-colors">PHOS</a></li>
            <li><a href="https://willow.p31ca.org" target="_blank" rel="noopener noreferrer" className="hover:text-cloud transition-colors">Willow</a></li>
            <li><a href="https://bonding.p31ca.org" target="_blank" rel="noopener noreferrer" className="hover:text-cloud transition-colors">BONDING</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-quantum-gold mb-4">Organization</h4>
          <ul className="space-y-3 text-cloud/70 text-sm">
            <li><a href="/#about" className="hover:text-cloud transition-colors">About &amp; Mission</a></li>
            <li><a href="/#research" className="hover:text-cloud transition-colors">Research</a></li>
            <li><a href="/#transparency" className="hover:text-cloud transition-colors">Transparency</a></li>
            <li><a href="https://github.com/p31labs" target="_blank" rel="noopener noreferrer" className="hover:text-cloud transition-colors">Source Code</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/10 text-xs text-cloud/50 flex flex-col md:flex-row justify-between items-center">
        <div>© 2026 P31 Labs, Inc. · Georgia Nonprofit · EIN 42-1888158 · 501(c)(3) pending</div>
        <div className="mt-4 md:mt-0">Open Source under MIT License. No tracking. No ads.</div>
      </div>
    </footer>
  );
}

export default Footer;
