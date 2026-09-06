import type * as React from 'react';

// P31 design-core crisis overlay web component (auto-registered by @p31/design-core/crisis-overlay).
// JSX types for R3F elements are provided by @react-three/fiber v9 (React 19 native).
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'p31-crisis-overlay': {
        message?: string;
        'button-label'?: string;
        onp31ready?: (e: CustomEvent) => void;
      };
    }
  }
}

export {};
