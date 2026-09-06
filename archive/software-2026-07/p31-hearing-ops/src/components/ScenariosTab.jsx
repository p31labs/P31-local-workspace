import { useState } from 'react'
import { TEXT, TEXT_DIM, SURFACE, SURFACE_LIGHT, fontMono, scenarios } from '../data/case-data'

export default function ScenariosTab() {
  const [open, setOpen] = useState(null)
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: TEXT_DIM, marginBottom: 16, fontFamily: fontMono }}>
        DECISION TREE — TAP TO EXPAND
      </div>
      {scenarios.map((s) => (
        <div key={s.id} style={{
          marginBottom: 10, borderRadius: 10, background: SURFACE,
          border: `1px solid ${open === s.id ? `${s.color}66` : SURFACE_LIGHT}`,
          overflow: 'hidden', transition: 'border-color 0.2s',
        }}>
          <button
            type="button"
            onClick={() => setOpen(open === s.id ? null : s.id)}
            style={{
              padding: '14px 16px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 12, width: '100%',
              background: 'transparent', border: 'none', color: 'inherit',
              textAlign: 'left', font: 'inherit',
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: s.color, flexShrink: 0, boxShadow: `0 0 8px ${s.color}44`,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{s.title}</div>
              <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{s.subtitle}</div>
            </div>
            <div style={{
              color: TEXT_DIM, fontSize: 18,
              transform: open === s.id ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s',
            }}>›</div>
          </button>
          {open === s.id && (
            <div style={{ padding: '0 16px 16px' }}>
              {s.steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, marginBottom: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: `${s.color}0A`, border: `1px solid ${s.color}18`,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: `${s.color}22`, color: s.color,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontFamily: fontMono,
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
