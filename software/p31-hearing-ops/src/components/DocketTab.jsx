import { useState } from 'react'
import {
  TEXT, TEXT_DIM, SURFACE, SURFACE_LIGHT, GOLD, RED, GREEN, fontMono,
  docketEntries,
} from '../data/case-data'
import StatusBadge from './StatusBadge'

export default function DocketTab() {
  const [showAll, setShowAll] = useState(false)
  const cutoff = 105
  const visible = showAll ? docketEntries : docketEntries.filter(e => parseInt(e.num) <= cutoff)

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: TEXT_DIM, fontFamily: fontMono }}>
          DOCKET ENTRIES
        </div>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          style={{
            padding: '4px 8px', borderRadius: 6, border: `1px solid ${SURFACE_LIGHT}`,
            background: SURFACE, color: TEXT_DIM, fontSize: 9, fontFamily: fontMono,
            cursor: 'pointer', letterSpacing: '0.05em',
          }}
        >
          {showAll ? 'PRE-HEARING ONLY' : `SHOW ALL (${docketEntries.length})`}
        </button>
      </div>
      {visible.map((e, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, padding: '10px 14px', marginBottom: 4,
          borderRadius: 8,
          background: e.status === 'inchoate' || e.status === 'defective' || e.status === 'key' ? SURFACE : 'transparent',
          border: `1px solid ${
            e.status === 'inchoate' ? `${GOLD}22` :
            e.status === 'defective' ? `${RED}22` :
            e.status === 'key' ? `${GREEN}33` : 'transparent'
          }`,
          opacity: parseInt(e.num) > cutoff && !showAll ? 0.4 : 1,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: e.status === 'inchoate' ? GOLD : e.status === 'defective' ? RED : e.status === 'key' ? GREEN : TEXT_DIM,
            fontFamily: fontMono, minWidth: 32,
          }}>{e.num}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{e.desc}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: TEXT_DIM }}>{e.date}</span>
              <StatusBadge status={e.status} />
            </div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 16, padding: '14px', borderRadius: 10, background: `${GOLD}0A`, border: `1px solid ${GOLD}22` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 6, fontFamily: fontMono }}>THE GAP</div>
        <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>
          Entry 92 (April 4) predates Entry 104 (April 14) by{' '}
          <strong style={{ color: GOLD }}>TEN DAYS</strong>. Nunc pro tunc records what was ordered; it does not create retroactive contempt liability. Del-Cook Timber, 248 Ga. App. 734.
        </div>
      </div>
    </div>
  )
}
