import { SectionStrip } from "@p31/design-core/compositions"

export function Nav() {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        position: "fixed",
        top: 0,
        zIndex: 100,
      }}
    >
      <SectionStrip items={[{ id: "home", label: "Home" }]} />
    </div>
  )
}