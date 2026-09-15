import { useThreads } from "./store"

export function ThreadList() {
  const threads = useThreads((s) => s.threads)
  const isUnread = (t) => t.updatedAt > t.lastViewedAt

  return (
    <ul>
      {threads.map((t) => (
        <li key={t.id} className={isUnread(t) ? "unread" : ""}>
          {t.title}
        </li>
      ))}
    </ul>
  )
}