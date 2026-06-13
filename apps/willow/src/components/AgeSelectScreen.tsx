import { useState, useEffect } from 'react'

interface Props {
  onBack: () => void
}

type AgeMode = 'willow' | 'auto' | 'bash'

const options: { mode: AgeMode; label: string; description: string }[] = [
  { mode: 'willow', label: 'Willow (6)', description: 'Pre-reader • Big visuals • Simple' },
  { mode: 'auto', label: 'Auto', description: 'Adapts to you' },
  { mode: 'bash', label: 'Bash (10)', description: 'Games • Molecules • Badges' },
]

const STORAGE_KEY = 'willow-age-mode'

export default function AgeSelectScreen({ onBack }: Props) {
  const [selected, setSelected] = useState<AgeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AgeMode | null
    return stored ?? 'auto'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selected)
  }, [selected])

  return (
    <div>
      <h1>Who is using Willow 🧸</h1>
      <div>
        {options.map((opt) => (
          <button
            key={opt.mode}
            onClick={() => setSelected(opt.mode)}
            className={selected === opt.mode ? 'spoiler-active' : ''}
            style={selected === opt.mode ? { background: '#E0F7FA' } : undefined}
          >
            <div>{opt.label}</div>
            <div>{opt.description}</div>
          </button>
        ))}
      </div>
      <button onClick={onBack}>BACK</button>
    </div>
  )
}
