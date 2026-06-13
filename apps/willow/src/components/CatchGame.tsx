import { useState } from 'react'

interface Props {
  onBack: () => void
}

interface Difficulty {
  label: string
  toWin: number
}

const difficulties: Difficulty[] = [
  { label: 'Easy', toWin: 5 },
  { label: 'Medium', toWin: 8 },
  { label: 'Hard', toWin: 12 },
]

const emojis = ['🌟', '⭐', '💫', '✨', '🎯', '🏆', '🎪', '🎡', '🎠', '🌈', '🦋', '🌸']

const HIGH_SCORE_KEY = 'willow-catch-high'

export default function CatchGame({ onBack }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>(difficulties[0])
  const [score, setScore] = useState(0)
  const [target] = useState(() => emojis[Math.floor(Math.random() * emojis.length)])
  const [options] = useState(() => {
    const opts = [target]
    const others = emojis.filter((e) => e !== target)
    while (opts.length < 3) {
      const pick = others[Math.floor(Math.random() * others.length)]
      if (!opts.includes(pick)) opts.push(pick)
    }
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opts[i], opts[j]] = [opts[j], opts[i]]
    }
    return opts
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [won, setWon] = useState(false)

  const highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0')

  function handleOptionClick(emoji: string) {
    if (won) return
    if (emoji === target) {
      const newScore = score + 1
      setScore(newScore)
      setFeedback('✅')
      if (newScore >= difficulty.toWin) {
        setWon(true)
        if (newScore > highScore) {
          localStorage.setItem(HIGH_SCORE_KEY, String(newScore))
        }
      }
    } else {
      setFeedback('❌')
    }
    setTimeout(() => setFeedback(null), 500)
  }

  function handleDifficultyChange(d: Difficulty) {
    setDifficulty(d)
    setScore(0)
    setWon(false)
    setFeedback(null)
  }

  function handlePlayAgain() {
    setScore(0)
    setWon(false)
    setFeedback(null)
  }

  if (won) {
    return (
      <div>
        <h1>Catch the Sparkle!</h1>
        <div>Score: {score}</div>
        <div>
          <span className="game-target-emoji">{target}</span>
        </div>
        <div>Find this one:</div>
        <div>You won!</div>
        <div>
          {[0, 1, 2].map((i) => (
            <span key={i} className="game-option" />
          ))}
        </div>
        <div>
          <button onClick={handlePlayAgain}>PLAY AGAIN</button>
          <button onClick={onBack}>CHOOSE ANOTHER GAME</button>
        </div>
        <button onClick={onBack}>BACK</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Catch the Sparkle!</h1>
      <div>Score: {score}</div>
      <div>
        High: {Math.max(score, highScore)}
      </div>
      <div>
        {difficulties.map((d) => (
          <button key={d.label} onClick={() => handleDifficultyChange(d)}>
            {d.label}
          </button>
        ))}
      </div>
      <div>
        <span className="game-target-emoji">{target}</span>
      </div>
      <div>Find this one:</div>
      <div>Get {difficulty.toWin} to win</div>
      <div>
        {options.map((emoji, i) => (
          <button
            key={i}
            className="game-option"
            onClick={() => handleOptionClick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      {feedback && <div className="game-feedback">{feedback}</div>}
      <button onClick={onBack}>BACK</button>
    </div>
  )
}
