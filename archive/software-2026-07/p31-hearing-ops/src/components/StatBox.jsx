import { SURFACE, TEXT_DIM, fontSans, fontMono } from '../data/case-data'

export default function StatBox({ label, value, color }) {
  return (
    <div style={{
      padding: '14px 12px', borderRadius: 10,
      background: SURFACE, border: `1px solid ${color}22`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: fontSans }}>{value}</div>
      <div style={{
        fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
        color: TEXT_DIM, marginTop: 2, fontFamily: fontMono,
      }}>{label}</div>
    </div>
  )
}
