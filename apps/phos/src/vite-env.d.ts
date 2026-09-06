/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'p31-crisis-overlay': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        message?: string;
        'button-label'?: string;
      };
    }
  }
}
