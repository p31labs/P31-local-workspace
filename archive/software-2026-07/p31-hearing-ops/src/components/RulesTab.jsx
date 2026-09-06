import { TEXT, TEXT_DIM, SURFACE, GREEN, RED, fontMono, rules } from '../data/case-data'

export default function RulesTab() {
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GREEN, marginBottom: 12, fontFamily: fontMono }}>✓ DO</div>
        {rules.do.map((r, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, padding: '10px 12px', marginBottom: 4,
            borderRadius: 6, background: i % 2 === 0 ? SURFACE : 'transparent',
          }}>
            <span style={{ color: GREEN, fontSize: 12, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{r}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: RED, marginBottom: 12, fontFamily: fontMono }}>✗ DO NOT</div>
        {rules.dont.map((r, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, padding: '10px 12px', marginBottom: 4,
            borderRadius: 6, background: i % 2 === 0 ? `${RED}08` : 'transparent',
          }}>
            <span style={{ color: RED, fontSize: 12, flexShrink: 0 }}>✗</span>
            <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
