interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

/**
 * The opt-in sound control. Visible, persistent, 48px minimum. Not a
 * settings-page checkbox and not a tiny corner icon — a child who wants
 * sound must be able to reach it without help, and a caregiver who wants it
 * off must be able to find it without hunting.
 *
 * The label states the *current* state ("Sound on" / "Sound off"), not the
 * action ("Mute") — the visible-state pattern the rest of the Loom uses.
 */
export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={onToggle}
      aria-pressed={enabled}
      data-agent-kind="action"
      data-agent-action="chapter.sound.toggle"
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