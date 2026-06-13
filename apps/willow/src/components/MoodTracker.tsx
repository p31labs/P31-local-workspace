import { useState } from 'react'

interface Props {
  onBack: () => void
}

interface MoodOption {
  label: string
  emoji: string
  value: number
}

const moods: MoodOption[] = [
  { label: 'Tired', emoji: '😴', value: 1 },
  { label: 'Sad', emoji: '😢', value: 2 },
  { label: 'Okay', emoji: '😊', value: 3 },
  { label: 'Happy', emoji: '😄', value: 4 },
  { label: 'Amazing', emoji: '🤩', value: 5 },
]

const reasons = ['Good day', 'Bad day', 'Played outside', 'Saw a friend', 'Ate good food', 'Tired']

interface MoodEntry {
  mood: number
  emoji: string
  label: string
  reason: string
  timestamp: number
}

const STORAGE_KEY = 'willow-moods'

export default function MoodTracker({ onBack }: Props) {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null)
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const history: MoodEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

  function handleMoodSelect(mood: MoodOption) {
    setSelectedMood(mood)
    setSelectedReason(null)
    setSaved(false)
  }

  function handleSave() {
    if (!selectedMood || !selectedReason) return
    const entry: MoodEntry = {
      mood: selectedMood.value,
      emoji: selectedMood.emoji,
      label: selectedMood.label,
      reason: selectedReason,
      timestamp: Date.now(),
    }
    const updated = [...history, entry]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSaved(true)
  }

  if (saved) {
    return (
      <div>
        <h1>How are you?</h1>
        <div className="spoon-display" />
        <div className="encouragement">Thanks for sharing!</div>
        <button onClick={onBack}>BACK</button>
      </div>
    )
  }

  if (selectedMood && selectedReason) {
    return (
      <div>
        <h1>How are you?</h1>
        <div className="spoon-display" />
        <div>
          {moods.map((m) => (
            <button
              key={m.label}
              className="mood-bar-btn"
              onClick={() => handleMoodSelect(m)}
            >
              <span>{m.emoji}</span> <span>{m.label}</span>
            </button>
          ))}
        </div>
        <div>Why do you feel {selectedMood.label.toLowerCase()}?</div>
        <div>
          {reasons.map((r) => (
            <button key={r} className="reason-btn" onClick={() => setSelectedReason(r)}>
              {r}
            </button>
          ))}
        </div>
        <div>
          <button onClick={handleSave}>SAVE</button>
        </div>
        <button onClick={onBack}>BACK</button>
      </div>
    )
  }

  if (selectedMood) {
    return (
      <div>
        <h1>How are you?</h1>
        <div className="spoon-display" />
        <div>
          {moods.map((m) => (
            <button
              key={m.label}
              className="mood-bar-btn"
              onClick={() => handleMoodSelect(m)}
            >
              <span>{m.emoji}</span> <span>{m.label}</span>
            </button>
          ))}
        </div>
        <div>Why do you feel {selectedMood.label.toLowerCase()}?</div>
        <div>
          {reasons.map((r) => (
            <button key={r} className="reason-btn" onClick={() => setSelectedReason(r)}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={onBack}>BACK</button>
      </div>
    )
  }

  return (
    <div>
      <h1>How are you?</h1>
      <div className="spoon-display" />
      <div>
        {moods.map((m) => (
          <button
            key={m.label}
            className="mood-bar-btn"
            onClick={() => handleMoodSelect(m)}
          >
            <span>{m.emoji}</span> <span>{m.label}</span>
          </button>
        ))}
      </div>
      {history.length > 0 && <div className="mood-chart" />}
      <button onClick={onBack}>BACK</button>
    </div>
  )
}
