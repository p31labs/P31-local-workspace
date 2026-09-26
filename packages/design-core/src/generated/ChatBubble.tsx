/**
 * @file ChatBubble — Chat message bubble for companion chat interface.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ChatBubbleProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ChatBubble({ children, className, style }: ChatBubbleProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default ChatBubble;
