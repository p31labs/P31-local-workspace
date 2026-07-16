import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isDyslexic, toggleDyslexia, initDyslexiaState } from '../store/accessibility';

const Navbar = () => {
  const dyslexicState = useStore(isDyslexic);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    initDyslexiaState();
    const spoons = localStorage.getItem('p31:spoons') || '3';
    const themeMap = { 0:'crisis', 1:'sanctuary', 2:'sanctuary', 3:'bridge', 4:'quantum', 5:'quantum' };
    document.documentElement.setAttribute('data-spoons', spoons);
    document.documentElement.setAttribute('data-theme', themeMap[spoons] || 'quantum');
  }, []);

  const handleSetSpoons = (level) => {
    localStorage.setItem('p31:spoons', String(level));
    const themeMap = { 0:'crisis', 1:'sanctuary', 2:'sanctuary', 3:'bridge', 4:'quantum', 5:'quantum' };
    document.documentElement.setAttribute('data-spoons', String(level));
    document.documentElement.setAttribute('data-theme', themeMap[level]);
  };

  const currentSpoons = typeof document !== 'undefined' ? parseInt(document.documentElement.getAttribute('data-spoons') || '3', 10) : 3;

  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isActive = (href) => href === '/' ? path === '/' : path.startsWith(href);

  const navLink = (href, label) => (
    <a href={href} className={`hover:text-quantum-cyan transition-colors ${isActive(href) ? 'text-quantum-cyan font-bold' : ''}`} style={{ textDecoration: 'none' }}>
      {label}
    </a>
  );

  return (
    <div className="sticky top-0 z-50">
      <header className="glass-box transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-4 cursor-pointer group" style={{ textDecoration: 'none' }} title="Return Home">
            <div className="w-12 h-12">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
                <rect width="512" height="512" rx="112" fill="#A78BFA" />
                <circle cx="390" cy="120" r="48" fill="#00F0FF" />
                <text x="256" y="340" fontFamily="'JetBrains Mono', monospace" fontWeight="900" fontSize="220" fill="#F5F5F7" textAnchor="middle">P31</text>
                <rect x="156" y="380" width="200" height="16" rx="8" fill="#FBBF24" />
              </svg>
            </div>
            <div>
              <div className="font-heading font-bold text-ink text-lg leading-none">Labs, Inc.</div>
              <div className="text-quantum-cyan text-xs font-medium tracking-wide">Georgia Nonprofit &middot; 501(c)(3) pending</div>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-cloud/80">
            {navLink('/', 'Home')}
            <a
              href="https://p31ca.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-quantum-cyan hover:text-quantum-violet font-semibold"
              style={{ textDecoration: 'none' }}
              title="Tools, fleet, and engineering hub"
            >
              Technical Hub ↗
            </a>
            {navLink('/products', 'Products')}
            {navLink('/research', 'Research')}
            {navLink('/about', 'About')}
            {navLink('/why', 'Why')}
            {navLink('/quantum-security', 'Security')}
            {navLink('/transparency', 'Transparency')}
            {navLink('/donate', 'Donate')}
            <a 
              href="https://thegeodesicself.substack.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-quantum-violet hover:text-quantum-violet/80 font-bold"
              style={{ textDecoration: 'none' }}
            >
              Newsletter
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDyslexia}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${dyslexicState ? 'bg-quantum-violet border-quantum-violet text-ink' : 'border-quantum-violet/30 text-cloud/80 hover:bg-quantum-violet/10'}`}
              title="Toggle Dyslexia & ADHD Reading Accommodations"
            >
              {dyslexicState ? 'Aa (Enhanced)' : 'Aa (Standard)'}
            </button>

            <div className="hidden md:flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => handleSetSpoons(level)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors font-mono ${
                    currentSpoons === level
                      ? 'border-quantum-cyan bg-quantum-cyan text-ink font-bold'
                      : 'border-cloud/20 text-cloud/60 hover:border-quantum-cyan/50'
                  }`}
                  aria-label={`Set spoons to ${level}`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg border border-cloud/10 text-cloud hover:bg-transparent transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <rect y="4" width="20" height="2" rx="1"/>
                  <rect y="9" width="20" height="2" rx="1"/>
                  <rect y="14" width="20" height="2" rx="1"/>
                </svg>
              )}
            </button>

            <a
              href="https://bonding.p31ca.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block bg-quantum-red hover:bg-quantum-red text-ink font-bold py-2.5 px-6 rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
              style={{ textDecoration: 'none' }}
            >
              Launch BONDING ↗
            </a>

            <a
              href="https://spaceship-earth.pages.dev/#observatory"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block ml-2 px-4 py-2 rounded-xl border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 transition-colors font-mono text-sm tracking-wider"
              style={{ textDecoration: 'none' }}
            >
              Launch S.E. ↗
            </a>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-cloud/10 bg-void/95 backdrop-blur-sm absolute top-full left-0 right-0">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            <a
              href="https://p31ca.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl font-medium text-sm text-quantum-cyan bg-quantum-cyan/10 hover:bg-quantum-cyan/20"
              style={{ textDecoration: 'none' }}
              onClick={() => setMenuOpen(false)}
            >
              Technical Hub ↗
            </a>
            {[
              ['/', 'Home'],
              ['/products', 'Products'],
              ['/research', 'Research'],
              ['/about', 'About'],
              ['/why', 'Why We Exist'],
              ['/quantum-security', 'Security'],
              ['/transparency', 'Transparency'],
              ['/donate', 'Donate'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-colors ${isActive(href) ? 'bg-quantum-cyan/10 text-quantum-cyan font-bold' : 'text-cloud/80 hover:bg-transparent'}`}
                style={{ textDecoration: 'none' }}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <a
              href="https://bonding.p31ca.org"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-quantum-violet text-ink font-bold py-3 px-6 rounded-xl text-center text-sm"
              style={{ textDecoration: 'none' }}
            >
              Launch BONDING ↗
            </a>
            <a
              href="https://spaceship-earth.pages.dev/#observatory"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-4 py-3 rounded-xl border-2 border-quantum-cyan text-quantum-cyan text-center font-mono text-sm"
              style={{ textDecoration: 'none' }}
            >
              Launch S.E. ↗
            </a>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navbar;
