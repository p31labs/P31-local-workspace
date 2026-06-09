/**
 * theme.ts
 * Utility to bridge CSS variables and JavaScript (especially Three.js).
 * Provides cached, reactive access to the P31 design system tokens.
 */

import * as THREE from 'three';

export type ThemeVar = 
  | '--cyan' | '--magenta' | '--amber' | '--violet' 
  | '--mint' | '--coral' | '--orange' | '--blue' | '--lavender'
  | '--s1' | '--s2' | '--s3' | '--s4' | '--text' | '--dim';

class ThemeBridge {
  private cache: Map<string, string> = new Map();
  private colorCache: Map<string, THREE.Color> = new Map();
  private observer: MutationObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.refresh();
      this.initObserver();
    }
  }

  private initObserver() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          this.refresh();
          // Dispatch custom event for Three.js rooms to listen to
          window.dispatchEvent(new CustomEvent('p31-theme-change'));
        }
      }
    });

    this.observer.observe(document.documentElement, { attributes: true });
  }

  refresh() {
    this.cache.clear();
    this.colorCache.clear();
    const style = getComputedStyle(document.documentElement);
    
    const vars: ThemeVar[] = [
      '--cyan', '--magenta', '--amber', '--violet', 
      '--mint', '--coral', '--orange', '--blue', '--lavender',
      '--s1', '--s2', '--s3', '--s4', '--text', '--dim'
    ];

    vars.forEach(v => {
      const val = style.getPropertyValue(v).trim();
      if (val) this.cache.set(v, val);
    });
  }

  getVar(name: ThemeVar): string {
    return this.cache.get(name) || '#00FFFF';
  }

  getColor(name: ThemeVar): THREE.Color {
    if (this.colorCache.has(name)) return this.colorCache.get(name)!;
    const color = new THREE.Color(this.getVar(name));
    this.colorCache.set(name, color);
    return color;
  }
}

export const theme = new ThemeBridge();
