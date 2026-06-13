import { useState } from 'react'

interface Props {
  onBack: () => void
}

interface Effect {
  name: string
}

const effects: Effect[] = [
  { name: 'Normal' },
  { name: 'Chipmunk' },
  { name: 'Robot' },
  { name: 'Deep' },
]

export default function VoiceScreen({ onBack }: Props) {
  const [recording, setRecording] = useState(false)
  const [selectedEffect, setSelectedEffect] = useState('Normal')

  function toggleRecording() {
    setRecording(!recording)
  }

  return (
    <div>
      <h1>Voice Messages!</h1>
      <p>Tap the button to record a message for Dad</p>
      <button onClick={toggleRecording}>
        {recording ? 'TAP TO STOP' : 'TAP TO RECORD'}
      </button>
      {recording && (
        <div className="recording-indicator">
          <span className="recording-dot" />
          <span>Recording...</span>
        </div>
      )}
      <div>
        {effects.map((e) => (
          <button
            key={e.name}
            onClick={() => setSelectedEffect(e.name)}
            className={selectedEffect === e.name ? 'effect-active' : ''}
          >
            {e.name}
          </button>
        ))}
      </div>
      <button onClick={onBack}>BACK</button>
    </div>
  )
}
