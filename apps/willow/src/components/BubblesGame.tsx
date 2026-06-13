import { useState, useEffect } from 'react'

interface Props {
  onBack: () => void
}

interface Bubble {
  id: number
  x: number
  y: number
  popped: boolean
}

const TARGET = 20
const HIGH_SCORE_KEY = 'willow-bubbles-high'

export default function BubblesGame({ onBack }: Props) {
  const [score, setScore] = useState(0)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [combo, setCombo] = useState(0)
  const [won, setWon] = useState(false)

  const highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0')

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), x: Math.random() * 300, y: Math.random() * 400, popped: false },
      ])
    }, 300)
    return () => clearInterval(interval)
  }, [])

  function handleBubblePop(id: number) {
    if (won) return
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)))
    const newScore = score + 1
    setScore(newScore)
    setCombo((c) => c + 1)
    if (newScore >= TARGET) {
      setWon(true)
      if (newScore > highScore) {
        localStorage.setItem(HIGH_SCORE_KEY, String(newScore))
      }
    }
  }

  function handlePlayAgain() {
    setScore(0)
    setBubbles([])
    setCombo(0)
    setWon(false)
  }

  const activeBubbles = bubbles.filter((b) => !b.popped)

  if (won) {
    return (
      <div>
        <h1>Pop Bubbles!</h1>
        <div>Popped: {score}</div>
        <div className="progress-bar-wrap">
          <div style={{ width: '100%', height: 10, background: '#eee' }}>
            <div style={{ width: '100%', height: 10, background: '#4caf50' }} />
          </div>
        </div>
        <div>{score}/{TARGET}</div>
        <div>Pop {TARGET} to win</div>
        <div>
          {activeBubbles.map((b) => (
            <span key={b.id} className="bubble" />
          ))}
        </div>
        <div>High: {Math.max(score, highScore)}</div>
        <div className="combo-display">Combo: {combo}</div>
        <div>You won!</div>
        <div className="stars-display">
          {[0, 1, 2].map((i) => (
            <span key={i} className="star-icon star-earned">⭐</span>
          ))}
        </div>
        <button onClick={handlePlayAgain}>PLAY AGAIN</button>
        <button onClick={onBack}>CHOOSE ANOTHER GAME</button>
        <button onClick={onBack}>BACK</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Pop Bubbles!</h1>
      <div>Popped: {score}</div>
      <div className="progress-bar-wrap">
        <div style={{ width: 300, height: 10, background: '#eee' }}>
          <div style={{ width: `${(score / TARGET) * 100}%`, height: 10, background: '#4caf50' }} />
        </div>
      </div>
      <div>{score}/{TARGET}</div>
      <div>Pop {TARGET} to win</div>
      <div>
        {activeBubbles.map((b) => (
          <button
            key={b.id}
            className="bubble"
            style={{ position: 'absolute', left: b.x, top: b.y, width: 30, height: 30, borderRadius: '50%' }}
            onClick={() => handleBubblePop(b.id)}
          />
        ))}
      </div>
      <div>High: {Math.max(score, highScore)}</div>
      {combo > 2 && <div className="combo-display">Combo: {combo}</div>}
      <button onClick={onBack}>BACK</button>
    </div>
  )
}
