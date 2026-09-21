/**
 * The music maker — SoundToggle.
 *
 * Reused from the Loom's SoundToggle.tsx (the same 48px AAF surface, the
 * same "label states the current state" pattern), with the standalone
 * `instrument.sound.toggle` action name per §7/§8 of the build prompt.
 * Standalone app → new action name, added to the manifest.
 */
export interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={onToggle}
      aria-pressed={enabled}
      data-agent-kind="action"
      data-agent-action="instrument.sound.toggle"
      data-agent-danger="none"
      data-agent-confirm="never"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="sound-toggle-icon">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        {enabled ? (
          <path d="M16 8.5a4.5 4.5 0 0 1 0 7M19 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M17 9l4 6M21 9l-4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}
      </svg>
      <span>{enabled ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}