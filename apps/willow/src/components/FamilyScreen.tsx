import { useState } from 'react'

interface Props {
  onBack: () => void
}

interface Contact {
  name: string
  avatar: string
}

const contacts: Contact[] = [
  { name: 'Dad', avatar: 'D' },
  { name: 'Nana', avatar: 'N' },
  { name: 'Uncle Tony', avatar: 'T' },
  { name: 'Auntie', avatar: 'A' },
]

const STORAGE_KEY = 'willow-last-contact'

export default function FamilyScreen({ onBack }: Props) {
  const [calling, setCalling] = useState<string | null>(null)
  const [ripple, setRipple] = useState(false)

  function handleContact(name: string) {
    setCalling(name)
    setRipple(true)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    stored[name] = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    setTimeout(() => setRipple(false), 600)
  }

  return (
    <div>
      <h1>Family</h1>
      <p>Tap someone to say hi</p>
      {contacts.map((c) => (
        <div key={c.name} onClick={() => handleContact(c.name)}>
          <span className="avatar-letter">{c.avatar}</span>
          <span>{c.name}</span>
          {calling === c.name && ripple && <span className="ripple-effect" />}
          {calling === c.name && <span>Just now</span>}
        </div>
      ))}
      {calling && <p>Calling...</p>}
      <button onClick={onBack}>BACK</button>
    </div>
  )
}
