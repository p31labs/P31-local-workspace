/**
 * @p31/ui K4 Hero — React wrapper.
 *
 * Usage:
 *   import { K4Hero } from '@p31/ui/K4Hero';
 *   import '@p31/ui/k4-hero.css';
 *
 *   <K4Hero />
 *   <K4Hero className="my-custom-class" />
 */

import React from 'react';
import { getK4SvgMarkup } from './k4-hero';

export interface K4HeroProps {
  /** Additional CSS class for the wrapper div */
  className?: string;
  /** Inline style for the wrapper div */
  style?: React.CSSProperties;
}

export function K4Hero({ className = '', style }: K4HeroProps) {
  return (
    <div
      className={`k4-hero ${className}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{ __html: getK4SvgMarkup() }}
    />
  );
}

export default K4Hero;
