import type { HashRoute } from './types';

/**
 * Hash routes: #/, #/roles, #/roles/:id, #/wcd, #/wcd/:id, #/help, #/help/:id,
 * #/glossary, #/glossary/:id, #/changelog, #/governance, #/reviewers, #/portfolio, #/search?q=
 * #/proof/new/:roleId, #/proof/:proofId
 */
export function setHashPath(parts: string[], query?: Record<string, string>): void {
  let q = '';
  if (query && Object.keys(query).length) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') sp.set(k, v);
    }
    const s = sp.toString();
    if (s) q = '?' + s;
  }
  window.location.hash = '#/' + parts.join('/') + q;
}

/**
 * Parse `#/path?query` (with or without leading `#`) — testable without `window`.
 */
export function parsePathFromHashInput(raw: string): HashRoute {
  const hash = (raw || '#/').replace(/^#/, '') || '/';
  const [pathStr, searchStr] = hash.split('?');
  const query = searchStr ? new URLSearchParams('?' + searchStr).get('q') || '' : '';
  const parts = pathStr.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home' };

  if (parts[0] === 'search') return { name: 'search', query };
  if (parts[0] === 'wcd' && parts[1]) return { name: 'wcd', id: parts[1] };
  if (parts[0] === 'wcd') return { name: 'wcd-list' };
  if (parts[0] === 'help' && parts[1]) return { name: 'help', id: parts[1] };
  if (parts[0] === 'help') return { name: 'help-list' };
  if (parts[0] === 'glossary' && parts[1]) return { name: 'glossary', id: parts[1] };
  if (parts[0] === 'glossary') return { name: 'glossary-list' };
  if (parts[0] === 'changelog') return { name: 'changelog' };
  if (parts[0] === 'reviewers') return { name: 'reviewers' };
  if (parts[0] === 'roles' && parts[1]) return { name: 'roles', id: parts[1] };
  if (parts[0] === 'roles') return { name: 'roles' };
  if (parts[0] === 'governance') return { name: 'governance' };
  if (parts[0] === 'portfolio') return { name: 'portfolio' };
  if (parts[0] === 'proof' && parts[1] === 'new' && parts[2]) {
    return { name: 'proof-new', id: parts[2] };
  }
  if (parts[0] === 'proof' && parts[1] && parts[1] !== 'new') {
    return { name: 'proof', id: parts[1] };
  }
  return { name: 'home' };
}

export function parseHash(): HashRoute {
  if (typeof window === 'undefined') {
    return { name: 'home' };
  }
  return parsePathFromHashInput(window.location.hash);
}
