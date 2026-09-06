/**
 * @file SkipLink — Shared skip-to-content link (all 4 apps).
 * Uses inline styles so class scanning is never a dependency.
 */

export function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        top: '-100%',
        left: 0,
        zIndex: 9999,
        padding: '0.75rem 1.5rem',
        background: 'var(--p31-accent, #00F0FF)',
        color: '#0A0A0F',
        fontWeight: 600,
        borderRadius: '0 0 8px 0',
        textDecoration: 'none',
        fontFamily: 'var(--p31-font-mono, monospace)',
        fontSize: '0.875rem',
        transition: 'top 0.15s ease',
      }}
      onFocus={(e) => { (e.target as HTMLElement).style.top = '0'; }}
      onBlur={(e) => { (e.target as HTMLElement).style.top = '-100%'; }}
    >
      Skip to main content
    </a>
  );
}

export default SkipLink;
