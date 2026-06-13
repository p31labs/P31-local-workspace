import { FamilyMesh } from './FamilyMesh'
import { loadBio, isLowSpoons } from '../stores/bioStore'

interface Props {
  onDismiss: () => void
}

export default function HearthOverlay({ onDismiss }: Props) {
  const bio = loadBio()
  const low = isLowSpoons(bio)
  const emoji = low ? '🕯️' : '🔥'
  const message = low ? 'Rest. You are held.' : 'Touch anywhere to send warmth'
  const activeCount = bio.spoons

  return (
    <div>
      <div style={{ fontSize: '3rem' }}>{emoji}</div>
      <p>{message}</p>
      <div>
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={`hearth-spoon-dot${i < activeCount ? ' spoon-on' : ''}`}
          />
        ))}
      </div>
      <FamilyMesh />
      <button aria-label="Pick something" onClick={onDismiss}>
        Pick something
      </button>
    </div>
  )
}
