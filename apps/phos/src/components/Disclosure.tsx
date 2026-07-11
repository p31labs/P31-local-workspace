import React, { useState, useRef, useEffect } from 'react';

interface DisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** At spoons <= this threshold, auto-collapse. 0 = never auto-collapse. */
  autoCollapseBelow?: number;
  spoons?: number;
  className?: string;
}

/**
 * Disclosure — COGA progressive disclosure component.
 * Expand/collapse with aria-expanded, aria-controls, smooth height transition.
 * Auto-collapses at low spoon levels to reduce cognitive load.
 *
 * WCAG 2.2: 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value.
 */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  autoCollapseBelow = 1,
  spoons = 4,
  className = '',
}: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useRef(`disclosure-${Math.random().toString(36).slice(2, 8)}`).current;

  // Auto-collapse when spoons drop below threshold
  useEffect(() => {
    if (autoCollapseBelow > 0 && spoons <= autoCollapseBelow) {
      setIsOpen(false);
    }
  }, [spoons, autoCollapseBelow]);

  return (
    <div className={`rounded-xl border border-white/5 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left font-sans text-sm tracking-wide text-white/80 hover:text-white/90 hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <span>{title}</span>
        <span
          className="text-xs opacity-40 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>
      <div
        id={id}
        role="region"
        aria-label={title}
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? `${contentRef.current?.scrollHeight ?? 500}px` : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-4 pb-4 pt-1 text-sm text-white/70 font-sans leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
