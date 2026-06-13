import { useState, useEffect } from 'react'

interface Props {
  onBack: () => void
}

interface Theme {
  name: string
  emojis: string[]
}

const themes: Theme[] = [
  { name: 'Animals', emojis: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼'] },
  { name: 'Space', emojis: ['🚀', '🌍', '🌙', '⭐', '🛸', '☄️'] },
  { name: 'Nature', emojis: ['🌻', '🌲', '🍄', '🌸', '🌿', '🍃'] },
  { name: 'Food', emojis: ['🍎', '🍕', '🍦', '🍩', '🍪', '🍉'] },
]

const SCORES_KEY = 'willow-memory-scores'
const UNLOCKED_KEY = 'willow-memory-unlocked'

function shuffleEmojis(emojis: string[]): string[] {
  const pairs = [...emojis.slice(0, 6), ...emojis.slice(0, 6)]
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

export default function MemoryGame({ onBack }: Props) {
  const [currentTheme, setCurrentTheme] = useState<string>('Animals')
  const [cards, setCards] = useState<string[]>(() => shuffleEmojis(themes[0].emojis))
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [moves, setMoves] = useState(0)

  const [scores, setScores] = useState<Record<string, number>>(() => JSON.parse(localStorage.getItem(SCORES_KEY) || '{}'))
  const [unlocked, setUnlocked] = useState<string[]>(() => {
    const stored: string[] = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || '[]')
    const storedScores: Record<string, number> = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}')
    const autoUnlock = Object.keys(storedScores).filter((t) => !stored.includes(t))
    if (autoUnlock.length) {
      const merged = [...stored, ...autoUnlock]
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(merged))
      return merged
    }
    return stored
  })

  useEffect(() => {
    if (matched.size === cards.length && matched.size > 0) {
      const themeKey = currentTheme.toLowerCase()
      const prev = scores[themeKey]
      if (!prev || moves < prev) {
        const newScores = { ...scores, [themeKey]: moves }
        setScores(newScores)
        localStorage.setItem(SCORES_KEY, JSON.stringify(newScores))
      }
      if (!unlocked.includes(themeKey)) {
        const newUnlocked = [...unlocked, themeKey]
        setUnlocked(newUnlocked)
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify(newUnlocked))
      }
    }
  }, [matched])

  function selectTheme(name: string) {
    const theme = themes.find((t) => t.name === name)
    if (!theme) return
    setCurrentTheme(name)
    setCards(shuffleEmojis(theme.emojis))
    setFlipped([])
    setMatched(new Set())
    setMoves(0)
  }

  function handleCardClick(index: number) {
    if (flipped.length >= 2) return
    if (flipped.includes(index)) return
    if (matched.has(index)) return
    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)
    if (newFlipped.length === 2) {
      setMoves(moves + 1)
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched(new Set([...matched, ...newFlipped]))
      }
      setTimeout(() => setFlipped([]), 1000)
    }
  }

  const highScore = scores[currentTheme.toLowerCase()]
  const currentUnlocked = unlocked
  const isLocked = (name: string) => {
    if (name === 'Animals') return false
    return !currentUnlocked.includes(name.toLowerCase())
  }

  return (
    <div>
      <h1>Memory Match</h1>
      <div>
        <span>{currentTheme} theme</span>
        {highScore ? <span>High: {highScore}</span> : <span>High: -</span>}
      </div>
      <div>Moves: {moves}</div>
      <div>
        {themes.map((t) => (
          <button
            key={t.name}
            disabled={isLocked(t.name)}
            onClick={() => selectTheme(t.name)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div>
        {cards.map((emoji, i) => (
          <button
            key={i}
            className={`memory-card${flipped.includes(i) || matched.has(i) ? ' memory-card-flipped' : ''}`}
            onClick={() => handleCardClick(i)}
          >
            {flipped.includes(i) || matched.has(i) ? emoji : '❓'}
          </button>
        ))}
      </div>
      <button onClick={onBack}>BACK</button>
    </div>
  )
}
