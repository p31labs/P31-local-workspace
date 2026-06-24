import { useState } from 'react'
import {
  TEXT, TEXT_DIM, SURFACE, SURFACE_LIGHT, CORAL, GOLD, GREEN, RED, BLUE,
  fontMono, openingScript, scriptResponses, scriptClose, scriptContemptFound, secondaryDefenses,
} from '../data/case-data'

export default function ScriptTab() {
  const [showSecondary, setShowSecondary] = useState(false)
  const [showResponses, setShowResponses] = useState(true)
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: CORAL, marginBottom: 16, fontFamily: fontMono }}>
        OPENING + TIMELINE — READ EXACTLY
      </div>
      {openingScript.map((block, i) => (
        <div key={i} style={{
          marginBottom: 14, padding: '14px 16px', borderRadius: 10,
          background: SURFACE, border: `1px solid ${i === 1 ? `${CORAL}44` : SURFACE_LIGHT}`,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            color: i === 1 ? CORAL : GOLD, marginBottom: 8, fontFamily: fontMono,
          }}>{i + 1}. {block.label}</div>
          <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{block.text}</div>
        </div>
      ))}

      <button type="button" onClick={() => setShowResponses(!showResponses)} style={{
        padding: '14px 16px', borderRadius: 10, background: SURFACE,
        border: `1px solid ${GOLD}33`, cursor: 'pointer', marginTop: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', color: 'inherit', font: 'inherit', textAlign: 'left',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: GOLD, fontFamily: fontMono }}>RESPONSE TEMPLATES</div>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>Tap to collapse</div>
        </div>
        <div style={{ color: TEXT_DIM, fontSize: 18, transform: showResponses ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
      </button>
      {showResponses && scriptResponses.map((d, i) => (
        <div key={i} style={{ marginTop: 10, padding: '14px 16px', borderRadius: 10, background: `${GOLD}08`, border: `1px solid ${GOLD}22` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: GOLD, marginBottom: 6, fontFamily: fontMono }}>{d.label}</div>
          <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{d.text}</div>
        </div>
      ))}

      <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 10, background: `${GREEN}0A`, border: `1px solid ${GREEN}33` }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: GREEN, marginBottom: 8, fontFamily: fontMono }}>{scriptClose.label}</div>
        <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{scriptClose.text}</div>
      </div>
      <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 10, background: `${RED}10`, border: `1px solid ${RED}44` }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: RED, marginBottom: 8, fontFamily: fontMono }}>{scriptContemptFound.label}</div>
        <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{scriptContemptFound.text}</div>
      </div>

      <button type="button" onClick={() => setShowSecondary(!showSecondary)} style={{
        padding: '14px 16px', borderRadius: 10, background: SURFACE,
        border: `1px solid ${SURFACE_LIGHT}`, cursor: 'pointer', marginTop: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', color: 'inherit', font: 'inherit', textAlign: 'left',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: BLUE, fontFamily: fontMono }}>SECONDARY DEFENSES</div>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>Only if court asks about substance</div>
        </div>
        <div style={{ color: TEXT_DIM, fontSize: 18, transform: showSecondary ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
      </button>
      {showSecondary && secondaryDefenses.map((d, i) => (
        <div key={i} style={{ marginTop: 10, padding: '14px 16px', borderRadius: 10, background: `${BLUE}08`, border: `1px solid ${BLUE}18` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: BLUE, marginBottom: 6, fontFamily: fontMono }}>{d.label}</div>
          <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{d.text}</div>
        </div>
      ))}
    </div>
  )
}
