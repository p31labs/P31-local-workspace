import { ChatShell, PageHeader } from "@p31/design-core/compositions"
import { Button } from "@p31/design-core/primitives"

export function ChatSurface({ title }: { title: string }) {
  return (
    <ChatShell>
      <ChatShell.Header>
        <PageHeader eyebrow="P31" title={title} />
      </ChatShell.Header>
      <Button data-spoons="2" onClick={() => {}}>
        Continue
      </Button>
    </ChatShell>
  )
}