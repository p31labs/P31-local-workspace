import { Button } from "@p31/design-core/primitives"

export function ActionBar({ onContinue, onCancel }: { onContinue: () => void; onCancel: () => void }) {
  return (
    <div className="action-bar">
      <Button onClick={onContinue}>Continue</Button>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    </div>
  )
}