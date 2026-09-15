import { Box } from "@p31/design-core/primitives"

export function Badge({ tone }: { tone: string }) {
  return (
    <Box className="badge" style={{ background: "#FF0000" }}>
      <span style={{ color: "#333" }}>{tone}</span>
    </Box>
  )
}