import { useState } from 'react'
import HearthOverlay from './HearthOverlay'
import AgeSelectScreen from './AgeSelectScreen'
import FamilyScreen from './FamilyScreen'
import MoodTracker from './MoodTracker'
import DrawScreen from './DrawScreen'
import VoiceScreen from './VoiceScreen'
import MemoryGame from './MemoryGame'
import CatchGame from './CatchGame'
import BubblesGame from './BubblesGame'

type Screen = 'hearth' | 'age' | 'family' | 'mood' | 'draw' | 'voice' | 'memory' | 'catch' | 'bubbles'

export default function App() {
  const [screen, setScreen] = useState<Screen>('hearth')

  switch (screen) {
    case 'age':
      return <AgeSelectScreen onBack={() => setScreen('hearth')} />
    case 'family':
      return <FamilyScreen onBack={() => setScreen('hearth')} />
    case 'mood':
      return <MoodTracker onBack={() => setScreen('hearth')} />
    case 'draw':
      return <DrawScreen onBack={() => setScreen('hearth')} />
    case 'voice':
      return <VoiceScreen onBack={() => setScreen('hearth')} />
    case 'memory':
      return <MemoryGame onBack={() => setScreen('hearth')} />
    case 'catch':
      return <CatchGame onBack={() => setScreen('hearth')} />
    case 'bubbles':
      return <BubblesGame onBack={() => setScreen('hearth')} />
    default:
      return (
        <div>
          <HearthOverlay onDismiss={() => setScreen('age')} />
          <nav>
            <button onClick={() => setScreen('age')}>Age</button>
            <button onClick={() => setScreen('family')}>Family</button>
            <button onClick={() => setScreen('mood')}>Mood</button>
            <button onClick={() => setScreen('draw')}>Draw</button>
            <button onClick={() => setScreen('voice')}>Voice</button>
            <button onClick={() => setScreen('memory')}>Memory</button>
            <button onClick={() => setScreen('catch')}>Catch</button>
            <button onClick={() => setScreen('bubbles')}>Bubbles</button>
          </nav>
        </div>
      )
  }
}
