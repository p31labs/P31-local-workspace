import { useState, lazy, Suspense } from 'react'
import { DARK, DARKER, SURFACE_LIGHT, TEXT, TEXT_DIM, CORAL, fontSans, fontMono, tabs } from './data/case-data'

const StatusTab = lazy(() => import('./components/StatusTab'))
const MissionTab = lazy(() => import('./components/MissionTab'))
const DocketTab = lazy(() => import('./components/DocketTab'))
const LawTab = lazy(() => import('./components/LawTab'))
const ScriptTab = lazy(() => import('./components/ScriptTab'))
const ScenariosTab = lazy(() => import('./components/ScenariosTab'))
const RulesTab = lazy(() => import('./components/RulesTab'))
const FolderTab = lazy(() => import('./components/FolderTab'))
const OmnibusTab = lazy(() => import('./components/OmnibusTab'))

const tabComponents = {
  status: StatusTab,
  mission: MissionTab,
  docket: DocketTab,
  law: LawTab,
  script: ScriptTab,
  scenarios: ScenariosTab,
  rules: RulesTab,
  folder: FolderTab,
  omnibus: OmnibusTab,
}

function LoadingFallback() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: TEXT_DIM, fontFamily: fontMono, fontSize: 11 }}>
      LOADING...
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('status')
  const ActiveComponent = tabComponents[activeTab]

  return (
    <div style={{
      background: DARK, minHeight: '100vh', color: TEXT,
      fontFamily: fontSans, maxWidth: 480,
      margin: '0 auto', position: 'relative',
      paddingBottom: 72, boxSizing: 'border-box',
    }}>
      <div style={{
        padding: 'max(12px, env(safe-area-inset-top)) 16px 8px max(16px, env(safe-area-inset-right))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        borderBottom: `1px solid ${SURFACE_LIGHT}`,
        background: DARKER, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28,
            background: `linear-gradient(135deg, ${CORAL}, ${CORAL}88)`,
            borderRadius: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: fontMono,
          }}>P</div>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: TEXT, fontFamily: fontMono }}>
            P31 HEARING OPS
          </span>
          <span style={{
            fontSize: 9, color: CORAL, fontWeight: 600, marginLeft: 'auto',
            fontFamily: fontMono, textAlign: 'right',
          }}>
            JUN 21 • STATUS
          </span>
        </div>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <ActiveComponent />
      </Suspense>
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, background: DARKER,
        borderTop: `1px solid ${SURFACE_LIGHT}`,
        display: 'flex', padding: '6px 4px',
        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(4px, env(safe-area-inset-left))',
        paddingRight: 'max(4px, env(safe-area-inset-right))',
        zIndex: 100, boxSizing: 'border-box',
      }}>
        {tabs.map(tab => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, background: 'transparent', border: 'none',
            padding: '6px 2px', cursor: 'pointer', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 2,
            opacity: activeTab === tab.id ? 1 : 0.4,
            transition: 'opacity 0.2s', color: 'inherit', font: 'inherit',
          }}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <span style={{
              fontSize: 7, fontWeight: 700, letterSpacing: '0.08em',
              color: activeTab === tab.id ? CORAL : TEXT_DIM, fontFamily: fontMono,
            }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
