import { useState } from 'react'
import {
  TEXT, TEXT_DIM, SURFACE, SURFACE_LIGHT, GREEN, CORAL, fontMono, folderChecklist,
} from '../data/case-data'

export default function FolderTab() {
  const [checked, setChecked] = useState(() => folderChecklist.map(() => false))
  const toggle = i => setChecked(prev => prev.map((v, j) => (j === i ? !v : v)))
  const done = checked.filter(Boolean).length

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: TEXT_DIM, fontFamily: fontMono }}>FOLDER CHECKLIST</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: done === checked.length ? GREEN : CORAL, fontFamily: fontMono }}>
          {done}/{checked.length}
        </div>
      </div>
      <div style={{ height: 4, background: SURFACE_LIGHT, borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${(done / checked.length) * 100}%`,
          background: done === checked.length ? GREEN : CORAL,
          borderRadius: 2, transition: 'width 0.3s',
        }} />
      </div>
      {folderChecklist.map((item, i) => (
        <button key={i} type="button" onClick={() => toggle(i)} style={{
          display: 'flex', gap: 12, padding: '12px 14px', marginBottom: 4,
          borderRadius: 8, background: checked[i] ? `${GREEN}08` : SURFACE,
          border: `1px solid ${checked[i] ? `${GREEN}22` : 'transparent'}`,
          cursor: 'pointer', transition: 'all 0.2s',
          width: '100%', textAlign: 'left', color: 'inherit', font: 'inherit',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            border: `2px solid ${checked[i] ? GREEN : `${TEXT_DIM}44`}`,
            background: checked[i] ? `${GREEN}22` : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 12, color: GREEN, transition: 'all 0.2s',
          }}>{checked[i] ? '✓' : ''}</div>
          <span style={{
            fontSize: 13, color: checked[i] ? TEXT_DIM : TEXT,
            textDecoration: checked[i] ? 'line-through' : 'none',
            lineHeight: 1.4, transition: 'all 0.2s',
          }}>{item.item}</span>
        </button>
      ))}
    </div>
  )
}
