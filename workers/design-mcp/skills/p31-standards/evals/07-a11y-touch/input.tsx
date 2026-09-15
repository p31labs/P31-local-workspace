export function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClick}>
      <span aria-hidden="true">→</span>
    </button>
  )
}