import React from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export interface ChatShellProps {
  /** Optional header slot; renders above the body. */
  header?: ReactNode;
  /** Accessible label for the mobile drawer. */
  drawerLabel: string;
  /** Whether the drawer is open (mobile only). */
  drawerOpen: boolean;
  /** Called when the drawer backdrop or its close button is clicked. */
  onCloseDrawer: () => void;
  /** Drawer content (e.g. artifact preview). Hidden above 900px container width. */
  drawer: ReactNode;
  /** Main content (chat column). */
  children: ReactNode;
}

/**
 * ChatShell — three-layer responsive stack for chat surfaces.
 *
 * Layer 1 (viewport lock) is the consumer's job (e.g. height: 100dvh flex column).
 * Layer 2 (reserved header row) is this component's `header` slot.
 * Layer 3 (scrollable body + mobile drawer) is this component's `children` + `drawer`.
 *
 * The drawer is hidden automatically at container width >= 900px, so consumers
 * can pass an artifact pane unconditionally and let the shell decide whether
 * to render it as a slide-up (mobile) or leave wide-layout to the consumer.
 */
export function ChatShell({
  header,
  drawerLabel,
  drawerOpen,
  onCloseDrawer,
  drawer,
  children,
}: ChatShellProps) {
  return (
    <div className="chat-shell">
      {header && <div className="chat-shell-header">{header}</div>}
      <div className="chat-shell-body">{children}</div>
      {drawer && (
        <div
          className={`chat-shell-drawer${drawerOpen ? ' chat-shell-drawer--open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={drawerLabel}
        >
          <div className="chat-shell-drawer-backdrop" onClick={onCloseDrawer} aria-hidden="true" />
          <div className="chat-shell-drawer-panel">
            <div className="chat-shell-drawer-head">
              <span className="chat-shell-drawer-title">{drawerLabel}</span>
              <Button variant="ghost" onClick={onCloseDrawer} aria-label="Close">
                Close
              </Button>
            </div>
            <div className="chat-shell-drawer-body">{drawer}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatShell;