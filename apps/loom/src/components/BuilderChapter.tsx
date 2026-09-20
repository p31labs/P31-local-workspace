import { useCallback } from 'react';
import { Lumi } from './Lumi';
import type { LoomEvent } from '@p31/canon/loom/events';
import { copy } from '../lib/copy';

interface Props {
  events: LoomEvent[];
  onProgress: () => void;
  onApprove: (proposalId: string) => void;
  onReject: (proposalId: string, reason: string) => void;
}

export function BuilderChapter({ events, onProgress, onApprove, onReject }: Props) {
  const proposal = events.find((e) => e.kind === 'propose') as
    | (LoomEvent & { id: string; node: string })
    | undefined;

  if (!proposal) {
    return (
      <div className="chapter chapter--builder">
        <div className="chapter-lumi chapter-lumi--small">
          <Lumi />
        </div>
        <p className="chapter-copy">Lumi has an idea.</p>
        <p className="chapter-hint">Lumi is thinking…</p>
        <button className="chapter-next" onClick={onProgress} type="button">
          Next →
        </button>
      </div>
    );
  }

  const p = { id: proposal.id, node: proposal.node };

  const approve = useCallback(() => {
    onApprove(p.id);
  }, [p.id, onApprove]);

  const reject = useCallback(() => {
    onReject(p.id, 'deferred for now');
  }, [p.id, onReject]);

  return (
    <div className="chapter chapter--builder">
      <div className="chapter-lumi chapter-lumi--small">
        <Lumi />
      </div>
      <p className="chapter-copy">Lumi has an idea.</p>
      <div className="chapter-proposal">
        <div className="chapter-proposal-node">{copy(p.node, false)}</div>
        <div className="chapter-proposal-body">
          Add a warm color to the field.
        </div>
        <div className="chapter-actions">
          <button
            className="chapter-action chapter-action--ok"
            onClick={approve}
            type="button"
            data-agent-kind="action"
            data-agent-action="approve"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            Looks good
          </button>
          <button
            className="chapter-action chapter-action--no"
            onClick={reject}
            type="button"
            data-agent-kind="action"
            data-agent-action="reject"
            data-agent-danger="none"
            data-agent-confirm="never"
          >
            Not yet
          </button>
        </div>
      </div>
      <button className="chapter-next" onClick={onProgress} type="button">
        Next →
      </button>
    </div>
  );
}
