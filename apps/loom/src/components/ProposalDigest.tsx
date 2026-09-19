import type { LoomState } from '@p31/canon/loom/events';

interface Props {
  state: LoomState;
  onSelect: (id: string) => void;
}

/**
 * The beginner-tier digest: one line per pending proposal, no event wall, no
 * scrubber. Same LoomState as the full surface — the tier changes what the
 * canvas surfaces, not what the log records.
 */
export function ProposalDigest({ state, onSelect }: Props) {
  const pending = [...state.proposals.values()].filter((p) => p.status === 'pending');
  return (
    <div className="digest">
      <div className="ev-head">
        <strong>What changed</strong>
        <span className="ev-count">{pending.length} pending</span>
      </div>
      {pending.length === 0 ? (
        <p className="ev-empty">nothing pending</p>
      ) : (
        <ul className="digest-list">
          {pending.map((p) => (
            <li key={p.id}>
              <button className="digest-item" onClick={() => onSelect(p.id)}>
                <span className="digest-id">{p.id}</span>
                <span className="digest-node">{p.node}</span>
                <span className="digest-author">{p.author !== 'unknown' ? p.author : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
