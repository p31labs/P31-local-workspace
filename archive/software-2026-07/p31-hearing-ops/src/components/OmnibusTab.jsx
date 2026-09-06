import { useState, useEffect } from 'react'
import { D20_FACES } from '../data/omnibus-data'
import { TEXT, TEXT_DIM, CYAN, GOLD, RED, fontMono, fontSans } from '../data/case-data'

function HolographicD20() {
  const [activeFace, setActiveFace] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  useEffect(() => {
    if (!autoRotate) return
    const interval = setInterval(() => setActiveFace(prev => (prev + 1) % 20), 4000)
    return () => clearInterval(interval)
  }, [autoRotate])
  const face = D20_FACES[activeFace]
  const r = 120

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 320, fontFamily: fontSans }}>
      <style>{`
        @keyframes orb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orb-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      `}</style>
      <div style={{ position: 'relative', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(0,232,255,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', width: 220, height: 220, transformStyle: 'preserve-3d' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(0,232,255,0.2)', boxShadow: 'inset 0 0 40px rgba(0,232,255,0.25)', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,191,0,0.25)', transform: 'rotateX(60deg)', animation: 'orb-spin 10s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.25)', transform: 'rotateY(60deg)', animation: 'orb-spin-rev 15s linear infinite' }} />
          {D20_FACES.map((f, i) => {
            const phi = Math.acos(1 - (2 * (i + 0.5)) / 20)
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5)
            const x = r * Math.cos(theta) * Math.sin(phi)
            const y = r * Math.sin(theta) * Math.sin(phi)
            const z = r * Math.cos(phi)
            const isActive = activeFace === i
            return (
              <div key={f.id} style={{ position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d', transform: `translate3d(${x}px, ${y}px, ${z}px)`, transition: 'all 0.7s' }}>
                <button type="button" onClick={() => { setActiveFace(i); setAutoRotate(false) }} style={{
                  position: 'absolute', left: 0, top: 0, width: 28, height: 28, borderRadius: 4,
                  border: isActive ? `2px solid ${RED}` : '1px solid rgba(0,232,255,0.45)',
                  background: isActive ? 'rgba(69,10,10,0.85)' : 'rgba(0,0,0,0.82)',
                  color: isActive ? '#fff' : CYAN, fontSize: 10, fontWeight: 800,
                  fontFamily: fontMono, cursor: 'pointer',
                  boxShadow: isActive ? '0 0 24px rgba(239,68,68,0.7)' : '0 0 12px rgba(0,0,0,0.5)',
                  zIndex: isActive ? 50 : 10,
                  transform: `translate(-50%, -50%) rotateY(${-theta}rad) rotateX(${-phi}rad) scale(${isActive ? 1.35 : 1})`,
                }}>{f.id}</button>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${CYAN}44`, borderRadius: 16, padding: 16, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: RED, letterSpacing: '0.12em' }}>FACE {face.id} / 20</div>
          <div style={{ fontSize: 9, color: TEXT_DIM, fontFamily: fontMono }}>Docket: <span style={{ color: CYAN }}>{face.entries}</span></div>
          <button type="button" onClick={() => setAutoRotate(a => !a)} style={{
            padding: '6px 10px', borderRadius: 8, border: `1px solid ${autoRotate ? CYAN : '#333'}`,
            background: autoRotate ? 'rgba(0,232,255,0.12)' : '#111',
            color: autoRotate ? CYAN : TEXT_DIM, fontSize: 10, fontFamily: fontMono, cursor: 'pointer',
          }}>{autoRotate ? 'Pause' : 'Play'}</button>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: '0 0 12px', lineHeight: 1.25 }}>{face.title}</h2>
        <div style={{ borderLeft: `4px solid ${RED}`, padding: 12, marginBottom: 10, background: 'rgba(69,10,10,0.2)', borderRadius: '0 8px 8px 0' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: RED, letterSpacing: '0.1em', marginBottom: 6 }}>WYE-TOPOLOGY ACTION</div>
          <p style={{ fontSize: 13, color: '#fecaca', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>&ldquo;{face.wye}&rdquo;</p>
        </div>
        <div style={{ borderLeft: `4px solid ${CYAN}`, padding: 12, background: 'rgba(0,40,50,0.25)', borderRadius: '0 8px 8px 0' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: CYAN, letterSpacing: '0.1em', marginBottom: 6 }}>OBJECTIVE QUALITY EVIDENCE</div>
          <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.5 }}>{face.delta}</p>
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${CYAN}33` }}>
          <span style={{ fontSize: 8, color: TEXT_DIM, letterSpacing: '0.15em' }}>ISOSTATIC RIGIDITY</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => { setActiveFace((activeFace - 1 + 20) % 20); setAutoRotate(false) }} style={navBtn}>‹</button>
            <button type="button" onClick={() => { setActiveFace((activeFace + 1) % 20); setAutoRotate(false) }} style={navBtn}>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const navBtn = { padding: '8px 14px', borderRadius: 8, border: `1px solid ${CYAN}55`, background: '#0a0a12', color: CYAN, fontSize: 16, cursor: 'pointer', fontFamily: fontMono }

function VagalCore() {
  const [phase, setPhase] = useState('INHALE')
  const [timer, setTimer] = useState(4)
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    const loop = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          if (phase === 'INHALE') { setPhase('HOLD'); return 2 }
          if (phase === 'HOLD') { setPhase('EXHALE'); setPulse(true); setTimeout(() => setPulse(false), 800); return 6 }
          if (phase === 'EXHALE') { setPhase('INHALE'); return 4 }
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(loop)
  }, [phase])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, borderRadius: 20, background: 'rgba(0,0,0,0.35)', border: `1px solid ${CYAN}33`, position: 'relative', overflow: 'hidden', fontFamily: fontSans }}>
      <div style={{ position: 'absolute', inset: 0, opacity: pulse ? 0.15 : 0, background: CYAN, transition: 'opacity 1s' }} />
      <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 9, color: 'rgba(0,232,255,0.7)', fontWeight: 800, letterSpacing: '0.12em' }}>SOMATIC GROUNDING • 0.1 HZ BASELINE</div>
      <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(0,232,255,0.35)', transform: phase === 'INHALE' ? 'scale(1.08)' : 'scale(0.92)', opacity: phase === 'INHALE' ? 0.55 : 0.2, transition: 'all 4s ease' }} />
        <div style={{ position: 'absolute', inset: 24, borderRadius: '50%', border: `1px solid ${GOLD}44`, transform: phase === 'EXHALE' ? 'scale(0.78)' : 'scale(1.02)', opacity: phase === 'EXHALE' ? 0.12 : 0.45, transition: 'all 6s ease' }} />
        <div style={{ width: 100, height: 100, borderRadius: '50%', border: `4px solid ${pulse ? '#fff' : 'rgba(0,232,255,0.4)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: pulse ? 'scale(1.12)' : 'scale(1)', boxShadow: pulse ? `0 0 32px ${CYAN}` : 'none', transition: 'all 0.7s', background: 'rgba(5,5,16,0.8)' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: TEXT }}>{timer}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: CYAN, letterSpacing: '0.12em' }}>{phase}</div>
        </div>
      </div>
    </div>
  )
}

function K4Seal() {
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    const loop = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 1000) }, 5000)
    return () => clearInterval(loop)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, borderRadius: 20, background: 'rgba(0,0,0,0.35)', border: `1px solid ${GOLD}33`, position: 'relative', overflow: 'hidden', fontFamily: fontSans }}>
      <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 9, color: GOLD, fontWeight: 800, letterSpacing: '0.12em' }}>TETRAHEDRON TOPOLOGY (K₄)</div>
      <div style={{ position: 'absolute', top: 40, left: 16, fontSize: 9, color: GOLD }}>S.J.</div>
      <div style={{ position: 'absolute', top: 56, left: 16, fontSize: 9, color: '#4ade80' }}>W.J.</div>
      <div style={{ position: 'absolute', bottom: 56, right: 16, fontSize: 9, color: RED }}>Christyn</div>
      <div style={{ position: 'absolute', bottom: 40, right: 16, fontSize: 9, color: CYAN }}>Will</div>
      <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.15)' }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(0,232,255,0.25)', borderRadius: '50%', animation: 'orb-spin 15s linear infinite', opacity: pulse ? 0.45 : 0.12, transform: pulse ? 'scale(1.06)' : 'scale(1)', transition: 'all 2s' }} />
        <div style={{ position: 'relative', width: 120, height: 120, animation: 'orb-spin 10s linear infinite' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 10, height: 10, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 12px #4ade80' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: RED, boxShadow: `0 0 12px ${RED}` }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', background: CYAN, boxShadow: `0 0 12px ${CYAN}` }} />
          <div style={{ position: 'absolute', inset: 0, border: `2px solid ${pulse ? '#fff' : 'rgba(0,232,255,0.35)'}`, transform: 'rotate(45deg) skewX(12deg)', transition: 'border-color 0.5s' }} />
          <div style={{ position: 'absolute', inset: 0, border: `2px solid ${pulse ? '#fff' : 'rgba(0,232,255,0.35)'}`, transform: 'rotate(-12deg) skewY(-6deg)', transition: 'border-color 0.5s' }} />
        </div>
      </div>
    </div>
  )
}

const subTabs = [
  { id: 'D20', label: '3D Oracle' },
  { id: 'VAGAL', label: 'Vagal' },
  { id: 'K4', label: 'K4 Seal' },
]

export default function OmnibusTab() {
  const [sub, setSub] = useState('D20')
  return (
    <div style={{ padding: '16px 12px 28px', minHeight: '100%', fontFamily: fontSans }}>
      <div style={{ textAlign: 'center', marginBottom: 16, padding: 12, borderRadius: 12, background: 'linear-gradient(135deg, #0a0a14, #050510)', border: `1px solid ${CYAN}33` }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>P31 Omnibus</div>
        <div style={{ fontSize: 8, color: CYAN, fontWeight: 700, letterSpacing: '0.25em', marginTop: 4, fontFamily: fontMono }}>TITANIUM EDITION v2.0</div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {subTabs.map(t => (
          <button key={t.id} type="button" onClick={() => setSub(t.id)} style={{
            flex: 1, minWidth: 90, padding: '10px 8px', borderRadius: 10,
            border: `1px solid ${sub === t.id ? CYAN : '#2a2a35'}`,
            background: sub === t.id ? 'rgba(0,232,255,0.12)' : '#0c0c14',
            color: sub === t.id ? CYAN : TEXT_DIM, fontSize: 10, fontWeight: 800,
            letterSpacing: '0.08em', cursor: 'pointer', fontFamily: fontMono,
          }}>{t.label}</button>
        ))}
      </div>
      {sub === 'D20' && <HolographicD20 />}
      {sub === 'VAGAL' && <VagalCore />}
      {sub === 'K4' && <K4Seal />}
      <div style={{ marginTop: 20, padding: 12, borderRadius: 10, border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(20,40,30,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔒</span>
        <div style={{ fontSize: 8, color: '#86efac', fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.4 }}>ISOSTATIC RIGIDITY MAINTAINED — LOCAL ONLY — NO CLOUD</div>
      </div>
    </div>
  )
}
