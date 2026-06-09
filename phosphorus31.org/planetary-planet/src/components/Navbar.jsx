import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isDyslexic, toggleDyslexia, initDyslexiaState } from '../store/accessibility';

const Navbar = () => {
  const dyslexicState = useStore(isDyslexic);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    initDyslexiaState();
  }, []);

  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isActive = (href) => href === '/' ? path === '/' : path.startsWith(href);

  const navLink = (href, label) => (
    <a href={href} className={`hover:text-teal-600 transition-colors ${isActive(href) ? 'text-teal-600 font-bold' : ''}`} style={{ textDecoration: 'none' }}>
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
                <rect width="512" height="512" rx="112" fill="#2A9D8F" />
                <circle cx="390" cy="120" r="48" fill="#E76F51" />
                <text x="256" y="340" fontFamily="'Lato', system-ui, sans-serif" fontWeight="900" fontSize="220" fill="#F0EEE9" textAnchor="middle">P31</text>
                <rect x="156" y="380" width="200" height="16" rx="8" fill="#E9C46A" />
              </svg>
            </div>
            <div>
              <div className="font-heading font-bold text-espresso text-lg leading-none">Labs, Inc.</div>
              <div className="text-teal-600 text-xs font-medium tracking-wide">Georgia Nonprofit &middot; 501(c)(3) pending</div>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-espresso/80">
            {navLink('/', 'Home')}
            <a
              href="https://p31ca.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 font-semibold"
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
              className="text-teal-600 hover:text-teal-700 font-bold"
              style={{ textDecoration: 'none' }}
            >
              Newsletter
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDyslexia}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${dyslexicState ? 'bg-lavender border-lavender text-espresso' : 'border-espresso/20 text-espresso/60 hover:bg-espresso/5'}`}
              title="Toggle Dyslexia & ADHD Reading Accommodations"
            >
              {dyslexicState ? 'Aa (Enhanced)' : 'Aa (Standard)'}
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg border border-espresso/20 text-espresso/70 hover:bg-espresso/5 transition-colors"
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
              className="hidden sm:block bg-coral-500 hover:bg-coral-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
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
        <div className="md:hidden border-t border-espresso/10 bg-white/95 backdrop-blur-sm absolute top-full left-0 right-0">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            <a
              href="https://p31ca.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl font-medium text-sm text-teal-600 bg-teal-600/5 hover:bg-teal-600/10"
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
                className={`py-3 px-4 rounded-xl font-medium text-sm transition-colors ${isActive(href) ? 'bg-teal-600/10 text-teal-600 font-bold' : 'text-espresso/80 hover:bg-espresso/5'}`}
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
              className="mt-2 bg-coral-500 text-white font-bold py-3 px-6 rounded-xl text-center text-sm"
              style={{ textDecoration: 'none' }}
            >
              Launch BONDING ↗
            </a>
            <a
              href="https://spaceship-earth.pages.dev/#observatory"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-4 py-3 rounded-xl border-2 border-cyan-400 text-cyan-400 text-center font-mono text-sm"
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
