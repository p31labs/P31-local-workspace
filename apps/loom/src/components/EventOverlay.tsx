import type { LoomEvent } from '@p31/canon/loom/events';
import { useLiteralLabels } from '../lib/usePresentation';
import { copy } from '../lib/copy';

interface Props {
  events: LoomEvent[];
  seq: number;
  onFollow: () => void;
  onSelect: (seq: number) => void;
}

function writerClass(writer: LoomEvent['writer']): string {
  return writer === 'human' ? 'ev-item--human' : 'ev-item--agent';
}

export function EventOverlay({ events, seq, onFollow, onSelect }: Props) {
  const literal = useLiteralLabels();
  return (
    <div className="ev">
      <div className="ev-head">
        <strong>Event log</strong>
        <span className="ev-count">{events.length}</span>
        <button className="ev-follow" onClick={onFollow} title="Resume following the head">
          → head
        </button>
      </div>
      <ul className="ev-list">
        {events.length === 0 && (
          <li className="ev-empty">{copy('no events yet', literal)}</li>
        )}
        {events.map((e) => (
          <li
            key={e.seq}
            className={`ev-item ${writerClass(e.writer)}${e.seq === seq ? ' ev-item--cur' : ''}`}
            onClick={() => onSelect(e.seq)}
          >
            <span className="ev-seq">#{e.seq}</span>
            <span className="ev-kind">{e.kind}</span>
            <span className="ev-writer">{copy(e.writer, literal)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
