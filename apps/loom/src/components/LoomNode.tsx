import type { NodeProps } from '@xyflow/react';

/**
 * Custom node for registry artifacts: the label plus the AAF legibility
 * attributes that make the graph agent-operable. data-agent-action="loom.focus"
 * mirrors the loom.focus action declared in the agent manifest; data-agent-target
 * carries the bare node name the log references (the focus event's `node`).
 */
export function LoomNode({ data }: NodeProps) {
  const { label, bare } = data as { label?: string; bare?: string };
  return (
    <div
      data-agent-kind="action"
      data-agent-action="loom.focus"
      data-agent-target={bare ?? undefined}
      data-agent-danger="none"
      data-agent-confirm="never"
    >
      {label ?? ''}
    </div>
  );
}
