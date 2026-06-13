interface FamilyMember {
  name: string
  emoji: string
  online: boolean
  lastSeen: string
  mood: string
}

const members: FamilyMember[] = [
  { name: 'Bash', emoji: '👦', online: true, lastSeen: 'Just now', mood: 'Feeling good' },
  { name: 'Willow', emoji: '👧', online: false, lastSeen: 'Last seen 1h ago', mood: 'Happy' },
  { name: 'Dad', emoji: '👨', online: false, lastSeen: 'Last seen 2h ago', mood: 'Okay' },
]

export function FamilyMesh() {
  return (
    <div>
      <h2>Family Presence</h2>
      <div>
        {members.map((m) => (
          <div key={m.name}>
            <span className="family-avatar-emoji" role="img" aria-label={m.name}>
              {m.emoji}
            </span>
            <span>{m.name}</span>
            <span className={m.online ? 'online-dot' : ''}>
              {m.online ? 'Online' : m.lastSeen}
            </span>
            <span>{m.mood}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
