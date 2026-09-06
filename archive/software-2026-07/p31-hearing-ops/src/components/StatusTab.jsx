import {
  CORAL, DARKER, SURFACE, SURFACE_LIGHT, TEXT, TEXT_DIM,
  GOLD, GREEN, RED, BLUE, fontSans, fontMono,
  statusTimeline, deadlines,
} from '../data/case-data'

const priorityColors = { HARD: RED, HIGH: GOLD }

export default function StatusTab() {
  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '24px 16px', borderRadius: 12,
        background: `linear-gradient(135deg, ${SURFACE} 0%, ${DARKER} 100%)`,
        border: `1px solid ${CORAL}33`, marginBottom: 20,
      }}>
        <div style={{
          fontSize: 11, letterSpacing: '0.2em', color: CORAL,
          fontWeight: 700, marginBottom: 4, fontFamily: fontMono,
        }}>
          JOHNSON v. JOHNSON • 2025CV936
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 4, fontFamily: fontSans }}>
          CASE STATUS DASHBOARD
        </div>
        <div style={{ fontSize: 13, color: TEXT_DIM }}>
          Updated June 21, 2026 • Chief Judge Scarlett
        </div>
      </div>

      {/* Deadlines */}
      <div style={{
        padding: '14px 16px', borderRadius: 10,
        background: `${RED}0A`, border: `1px solid ${RED}33`,
        marginBottom: 20,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
          color: RED, marginBottom: 12, fontFamily: fontMono,
        }}>
          UPCOMING DEADLINES
        </div>
        {deadlines.map((d, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: '8px 0',
            borderBottom: i < deadlines.length - 1 ? `1px solid ${SURFACE_LIGHT}` : 'none',
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: priorityColors[d.priority] || TEXT,
              fontFamily: fontMono, minWidth: 85,
            }}>{d.date}</span>
            <span style={{ fontSize: 12, color: TEXT, lineHeight: 1.4 }}>{d.task}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
        color: TEXT_DIM, marginBottom: 12, fontFamily: fontMono,
      }}>
        CASE TIMELINE (since April 16 hearing)
      </div>
      {statusTimeline.map((e, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, padding: '10px 12px', marginBottom: 4,
          borderRadius: 8, background: i % 2 === 0 ? SURFACE : 'transparent',
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{e.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: CORAL, fontFamily: fontMono, marginBottom: 1,
            }}>{e.date}</div>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{e.event}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
