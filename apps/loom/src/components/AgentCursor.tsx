/**
 * The Loom — agent presence cursor.
 *
 * A DOM overlay that makes the agent's traversal visible: a labeled dot that
 * eases toward the agent's current node. Motion is transform-only and locked
 * to --motion-scale (see index.css), so reduced motion shortens the ease and
 * "none" teleports it — the path is never animated via layout properties.
 */
interface AgentCursorProps {
  position: { x: number; y: number } | null;
  label?: string;
}

export function AgentCursor({ position, label }: AgentCursorProps) {
  if (!position) return null;
  return (
    <div
      className="agent-cursor"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      role="status"
      aria-label={label ? `agent at ${label}` : 'agent cursor'}
    >
      <span className="agent-cursor-dot" aria-hidden="true" />
      <span className="agent-cursor-label">{label ?? 'agent'}</span>
    </div>
  );
}
