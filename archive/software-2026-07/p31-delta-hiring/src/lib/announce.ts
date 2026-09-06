/** Screen reader announcements; element must exist in layout. */
export function getAnnouncerEl(): HTMLDivElement | null {
  return document.getElementById('sr-announce') as HTMLDivElement | null;
}

export function announceStatus(message: string): void {
  const el = getAnnouncerEl();
  if (!el) return;
  el.textContent = '';
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  el.offsetHeight;
  el.textContent = message;
}

export function focusMainTarget(): void {
  const m = document.getElementById('main') as HTMLDivElement | null;
  if (m) {
    m.focus();
  }
}
