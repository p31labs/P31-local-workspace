export function ChatHeader({ title }: { title: string }) {
  return (
    <div className="chat-header">
      <div className="chat-header-title">{title}</div>
      <div className="chat-header-actions">
        <button>Menu</button>
      </div>
    </div>
  )
}