import { Card } from "@p31/design-core/primitives"

export function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <Card elevation={9} glow="green-glow" className="feature-card">
      <Card.Title>{title}</Card.Title>
      <Card.Body>{body}</Card.Body>
    </Card>
  )
}