import {
  CORAL, DARKER, SURFACE, SURFACE_LIGHT, TEXT, TEXT_DIM, GOLD, GREEN, RED,
  fontSans, fontMono, deadlines,
} from '../data/case-data'
import StatBox from './StatBox'

export default function MissionTab() {
  const daysSince = Math.floor((Date.now() - new Date(2026, 1, 5).getTime()) / 86400000)

  return (
    <div style={{ padding: '20px 16px' }}>
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
        <div style={{ fontSize: 28, fontWeight: 800, color: TEXT, lineHeight: 1.1, marginBottom: 4, fontFamily: fontSans }}>
          CONTEMPT HEARING
        </div>
        <div style={{ fontSize: 14, color: TEXT_DIM, marginBottom: 6 }}>
          April 16, 2026 • 11:00 AM • Woodbine
        </div>
        <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 6 }}>
          Chief Judge Stephen G. Scarlett
        </div>
        <div style={{
          fontSize: 10, color: CORAL, fontFamily: fontMono,
          padding: '4px 10px', borderRadius: 4,
          background: `${CORAL}15`, display: 'inline-block',
        }}>
          ARCHIVED — Use STATUS tab for current timeline
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatBox label="DAYS SINCE FILING" value={daysSince} color={RED} />
        <StatBox label="TOTAL ASSETS" value="$5" color={GOLD} />
        <StatBox label="SIGNED ORDERS" value="2" color={GREEN} />
        <StatBox label="ADA RESPONSES" value="0" color={CORAL} />
      </div>

      <div style={{
        padding: '14px', borderRadius: 10,
        background: `${RED}0A`, border: `1px solid ${RED}33`,
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
          color: RED, marginBottom: 8, fontFamily: fontMono,
        }}>
          UPCOMING HARD DEADLINES
        </div>
        {deadlines.map((d, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, padding: '6px 0',
            borderBottom: i < deadlines.length - 1 ? `1px solid ${SURFACE_LIGHT}` : 'none',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: d.priority === 'HARD' ? RED : GOLD,
              fontFamily: fontMono, minWidth: 80,
            }}>{d.date}</span>
            <span style={{ fontSize: 12, color: TEXT }}>{d.task}</span>
          </div>
        ))}
      </div>

      <div style={{
        padding: '16px', borderRadius: 10,
        background: `${CORAL}11`, border: `1px solid ${CORAL}44`, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: CORAL, marginBottom: 8, fontFamily: fontMono }}>
          PRIMARY DEFENSE
        </div>
        <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.5 }}>
          Entry 92 (April 4) prosecuted contempt of an &quot;Order on Pending Motions&quot; that was not signed until Entry 104 (April 14).{' '}
          <strong style={{ color: CORAL }}>The complaint predates the signed order by ten days.</strong>{' '}
          Nunc pro tunc corrects the record; it does not create retroactive contempt liability. Del-Cook Timber, 248 Ga. App. 734.
        </div>
      </div>

      <div style={{
        padding: '16px', borderRadius: 10,
        background: SURFACE, border: `1px solid ${SURFACE_LIGHT}`,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: GOLD, marginBottom: 8, fontFamily: fontMono }}>
          PRIME DIRECTIVE
        </div>
        <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>
          Let the docket do the talking. Be calm, brief, mechanical. Entry 90 is the evidence. Let it speak.
        </div>
      </div>
    </div>
  )
}
