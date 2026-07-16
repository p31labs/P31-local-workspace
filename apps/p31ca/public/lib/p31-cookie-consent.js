/**
 * P31 CookieConsent — GDPR/ePrivacy consent banner.
 * Renders a minimal banner at the bottom of the page.
 * Respects localStorage to avoid showing on repeat visits.
 *
 * Usage: Add <CookieConsent /> to any layout or page.
 */

export interface CookieConsentProps {
  message?: string;
  acceptLabel?: string;
  privacyUrl?: string;
}

const STORAGE_KEY = 'p31:cookie-consent';
const DEFAULT_MESSAGE = 'P31 uses no third-party cookies, no tracking, no surveillance. We use a self-hosted analytics tool that tells us page counts — nothing more.';
const DEFAULT_ACCEPT = 'Got it';

export function createCookieConsent(props: CookieConsentProps = {}) {
  if (typeof window === 'undefined') return;

  if (localStorage.getItem(STORAGE_KEY)) return;

  const {
    message = DEFAULT_MESSAGE,
    acceptLabel = DEFAULT_ACCEPT,
  } = props;

  const banner = document.createElement('div');
  banner.id = 'p31-cookie-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(10,10,15,0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: #F5F5F7;
    line-height: 1.5;
    flex-wrap: wrap;
  `;

  const text = document.createElement('span');
  text.textContent = message;
  text.style.flex = '1';
  text.style.minWidth = '200px';

  const btn = document.createElement('button');
  btn.textContent = acceptLabel;
  btn.style.cssText = `
    background: #00F0FF;
    color: #0A0A0F;
    font-weight: 700;
    padding: 10px 24px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
    transition: opacity 0.2s;
  `;
  btn.addEventListener('mouseenter', () => btn.style.opacity = '0.8');
  btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
  btn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    banner.remove();
  });

  banner.appendChild(text);
  banner.appendChild(btn);
  document.body.appendChild(banner);
}

// Auto-init when script loads
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => createCookieConsent());
  } else {
    createCookieConsent();
  }
}
