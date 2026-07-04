/**
 * hash-router — client-side hash section switcher for 7-route AppShell pages.
 *
 * Two usage modes:
 *
 * 1. Explicit (programmatic):
 *   import { mountHashRouter } from '../lib/hash-router';
 *   document.addEventListener('astro:page-load', () => {
 *     mountHashRouter([
 *       { id: 'bonding', el: '#bonding', title: 'BONDING — P31' },
 *     ], { defaultId: 'bonding', navSelector: '#connect-nav' });
 *   });
 *
 * 2. Auto-discovery (preferred for page-level use):
 *   import { mountHashRouterAuto } from '../lib/hash-router';
 *   document.addEventListener('astro:page-load', () => {
 *     mountHashRouterAuto({
 *       defaultHash: 'bonding',
 *       navSelector: '#connect-nav',
 *       sectionSelector: '.hash-section',
 *     });
 *   });
 *
 * HTML convention:
 *   - Sections: any element with a unique `id` and class `hash-section`; start hidden.
 *     <section id="bonding" class="hash-section hidden">
 *   - Nav links: `<a href="#bonding">` — aria-current is set/unset automatically.
 *   - Active attribute: `data-hash-active` is set on the visible section element.
 */

export interface HashSection {
  /** Hash id (without #). Must be URL-safe. */
  id: string;
  /** CSS selector or HTMLElement for the section container. */
  el?: string | HTMLElement | null;
  /** Optional document.title when this section is active. */
  title?: string;
  /** Called when this section becomes active. */
  onEnter?: (el: HTMLElement | null) => void;
  /** Called when this section becomes inactive. */
  onLeave?: (el: HTMLElement | null) => void;
}

export interface HashRouterOptions {
  /** Section id to activate when hash is empty or unrecognised. */
  defaultId?: string;
  /** CSS selector for nav links that carry `data-hash-nav="{id}"`. */
  navSelector?: string;
  /** CSS class(es) added to the active section element. */
  activeClass?: string;
  /** CSS class(es) added to active nav links. */
  navActiveClass?: string;
  /** Whether to scroll the active section into view on hash change. */
  scroll?: boolean;
}

interface HashRouterHandle {
  /** Navigate programmatically without triggering a full navigation. */
  go(id: string): void;
  /** Return the currently active section id. */
  active(): string | null;
  /** Remove all listeners (call on astro:before-swap). */
  destroy(): void;
}

export function mountHashRouter(
  sections: HashSection[],
  options: HashRouterOptions = {}
): HashRouterHandle {
  const {
    defaultId = sections[0]?.id ?? '',
    navSelector = '[data-hash-nav]',
    activeClass = '',
    navActiveClass = 'aria-active',
    scroll = false,
  } = options;

  const sectionMap = new Map<string, HashSection>();
  for (const s of sections) sectionMap.set(s.id, s);

  let currentId: string | null = null;

  function resolveEl(s: HashSection): HTMLElement | null {
    if (!s.el) return document.getElementById(`section-${s.id}`);
    if (s.el instanceof HTMLElement) return s.el;
    return document.querySelector<HTMLElement>(s.el);
  }

  function activate(id: string) {
    const target = sectionMap.has(id) ? id : defaultId;
    if (target === currentId) return;

    // Deactivate previous
    if (currentId !== null) {
      const prev = sectionMap.get(currentId);
      if (prev) {
        const el = resolveEl(prev);
        el?.classList.add('hidden');
        el?.removeAttribute('data-hash-active');
        if (activeClass) el?.classList.remove(...activeClass.split(' '));
        prev.onLeave?.(el);
      }
    }

    // Activate next
    const next = sectionMap.get(target);
    if (next) {
      const el = resolveEl(next);
      el?.classList.remove('hidden');
      el?.setAttribute('data-hash-active', '');
      if (activeClass) el?.classList.add(...activeClass.split(' '));
      if (next.title) document.title = next.title;
      if (scroll) el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      next.onEnter?.(el);
    }

    currentId = target;
    syncNav(target);
  }

  function syncNav(activeId: string) {
    document.querySelectorAll<HTMLElement>(navSelector).forEach((link) => {
      const navId = link.dataset.hashNav ?? link.getAttribute('href')?.replace('#', '');
      const isActive = navId === activeId;
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
      if (navActiveClass === 'aria-active') {
        // Use aria-current only — no extra class needed
      } else if (navActiveClass) {
        isActive
          ? link.classList.add(...navActiveClass.split(' '))
          : link.classList.remove(...navActiveClass.split(' '));
      }
    });
  }

  function hashId(): string {
    return window.location.hash.slice(1); // strip leading #
  }

  function onHashChange() {
    activate(hashId());
  }

  // Ensure all sections start hidden (idempotent if already class="hidden")
  for (const s of sections) {
    resolveEl(s)?.classList.add('hidden');
  }

  // Activate based on current hash (or default)
  activate(hashId() || defaultId);

  window.addEventListener('hashchange', onHashChange);

  // Re-activate on Astro view transition (page stays alive, hash may change)
  document.addEventListener('astro:after-swap', onHashChange);

  return {
    go(id: string) {
      window.location.hash = id;
    },
    active() {
      return currentId;
    },
    destroy() {
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('astro:after-swap', onHashChange);
    },
  };
}

/**
 * Auto-discovery mount — queries the DOM for sections matching `sectionSelector`,
 * infers each section's hash id from its `id` attribute, then delegates to
 * `mountHashRouter`. Preferred for page-level scripting.
 *
 * Returns null if no sections are found (safe to call on the wrong route).
 */
export function mountHashRouterAuto(options: {
  defaultHash?: string;
  navSelector?: string;
  sectionSelector?: string;
}): HashRouterHandle | null {
  const { defaultHash, navSelector, sectionSelector = '.hash-section' } = options;
  const els = Array.from(document.querySelectorAll<HTMLElement>(sectionSelector));
  if (!els.length) return null;
  const sections: HashSection[] = els.map((el) => ({ id: el.id, el }));
  return mountHashRouter(sections, {
    defaultId: defaultHash ?? sections[0]?.id ?? '',
    navSelector,
  });
}

/**
 * Convenience: parse the current hash and return all named groups from a
 * pattern like `#connect-bonding` → `{ route: 'connect', section: 'bonding' }`.
 *
 * Pattern: `#${route}-${section}` (single dash separator, last segment wins).
 *
 * Example:
 *   const { section } = parseRouteHash('connect');
 *   // → 'bonding' when hash is #connect-bonding, '' when #connect or empty
 */
export function parseRouteHash(routeId: string): { section: string; raw: string } {
  const raw = window.location.hash.slice(1);
  const prefix = `${routeId}-`;
  const section = raw.startsWith(prefix) ? raw.slice(prefix.length) : '';
  return { section, raw };
}
