import { GOLD, RED, CORAL, GREEN, TEXT_DIM, fontMono } from '../data/case-data'

export default function StatusBadge({ status }) {
  const colors = {
    inchoate: { bg: `${GOLD}22`, text: GOLD, label: 'INCHOATE' },
    defective: { bg: `${RED}22`, text: RED, label: 'DEFECTIVE' },
    'no-response': { bg: `${CORAL}22`, text: CORAL, label: 'NO RESPONSE' },
    key: { bg: `${GREEN}22`, text: GREEN, label: 'KEY ORDER' },
    neutral: { bg: `${TEXT_DIM}22`, text: TEXT_DIM, label: '—' },
  }
  const c = colors[status] || colors.neutral
  if (status === 'neutral') return null
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
      padding: '2px 6px', borderRadius: 3,
      background: c.bg, color: c.text, fontFamily: fontMono,
    }}>
      {c.label}
    </span>
  )
}
