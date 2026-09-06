import { TEXT, TEXT_DIM, SURFACE, CORAL, GOLD, RED, BLUE, GREEN, fontMono, legalCitations } from '../data/case-data'

const catColors = {
  INCHOATE: CORAL, 'NUNC PRO TUNC': GOLD, CONTEMPT: RED,
  'PARENTAL RIGHTS': BLUE, 'DUE PROCESS': BLUE, WEBEX: GOLD,
  RECORDING: GREEN, 'CONSENT ORDER': RED, VISITATION: GREEN, ADA: BLUE,
}

export default function LawTab() {
  const categories = [...new Set(legalCitations.map(c => c.category))]
  return (
    <div style={{ padding: '20px 16px' }}>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: catColors[cat] || TEXT_DIM, marginBottom: 10, fontFamily: fontMono }}>
            {cat}
          </div>
          {legalCitations.filter(c => c.category === cat).map((c, i) => (
            <div key={i} style={{
              padding: '12px 14px', marginBottom: 6, borderRadius: 8,
              background: SURFACE, borderLeft: `3px solid ${(catColors[cat] || TEXT_DIM)}44`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, fontFamily: fontMono }}>{c.case}</div>
              <div style={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.5, marginTop: 4 }}>{c.holding}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
