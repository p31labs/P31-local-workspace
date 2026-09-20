import { useCallback, useState } from 'react';
import { Lumi } from './Lumi';

interface Props {
  onProgress: () => void;
  onFocus: (node: string) => void;
}

export function ChildChapter({ onProgress, onFocus }: Props) {
  const [celebrating, setCelebrating] = useState(false);

  const tap = useCallback(() => {
    onFocus('lumi');
    setCelebrating(true);
    const t = setTimeout(() => setCelebrating(false), 1800);
    return () => clearTimeout(t);
  }, [onFocus]);

  return (
    <div className="chapter chapter--child">
      <div className={`chapter-lumi ${celebrating ? 'chapter-lumi--celebrate' : ''}`}>
        <Lumi />
      </div>
      <p className="chapter-copy">Tap Lumi to say hello.</p>
      <button
        className="chapter-action"
        onClick={tap}
        type="button"
        aria-label="Say hello to Lumi"
        data-agent-kind="action"
        data-agent-action="loom.focus"
        data-agent-target="lumi"
        data-agent-danger="none"
        data-agent-confirm="never"
      >
        Say hello
      </button>
      {celebrating && (
        <div className="chapter-celebration" role="status">
          Hello!
        </div>
      )}
      <button className="chapter-next" onClick={onProgress} type="button">
        Next →
      </button>
    </div>
  );
}
