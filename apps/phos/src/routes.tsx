import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { PhosShell } from './components/PhosShell';

const HearthSurface = lazy(() => import('./features/hearth/components/HearthSurface').then((m) => ({ default: m.HearthSurface })));
const ConversationalSurface = lazy(() => import('./features/conversational/components/ConversationalSurface').then((m) => ({ default: m.ConversationalSurface })));
const SettingsSurface = lazy(() => import('./features/settings/components/SettingsSurface').then((m) => ({ default: m.SettingsSurface })));
const DashboardSurface = lazy(() => import('./features/dashboard/components/DashboardSurface').then((m) => ({ default: m.DashboardSurface })));
const PassportSurface = lazy(() => import('./features/passport/components/PassportSurface').then((m) => ({ default: m.PassportSurface })));
const VaultSurface = lazy(() => import('./features/vault/components/VaultSurface').then((m) => ({ default: m.VaultSurface })));
const LedgerSurface = lazy(() => import('./features/ledger/components/LedgerSurface').then((m) => ({ default: m.LedgerSurface })));
const DeveloperSurface = lazy(() => import('./features/developer/components/DeveloperSurface').then((m) => ({ default: m.DeveloperSurface })));
const BondingSurface = lazy(() => import('./features/bonding/components/BondingSurface').then((m) => ({ default: m.BondingSurface })));
const ArcadeSurface = lazy(() => import('./features/arcade/components/ArcadeSurface').then((m) => ({ default: m.ArcadeSurface })));
const CompassSurface = lazy(() => import('./features/compass/components/CompassSurface').then((m) => ({ default: m.CompassSurface })));
const MarketplaceSurface = lazy(() => import('./features/marketplace/components/MarketplaceSurface').then((m) => ({ default: m.MarketplaceSurface })));
const AdminSurface = lazy(() => import('./features/admin/components/AdminSurface').then((m) => ({ default: m.AdminSurface })));
const CaptureBoard = lazy(() => import('./features/forge/components/CaptureBoard').then((m) => ({ default: m.CaptureBoard })));
const CognitiveProsthetic = lazy(() => import('./features/cognitive/components/CognitiveProsthetic').then((m) => ({ default: m.CognitiveProsthetic })));
const SpaceshipEarth = lazy(() => import('./features/spaceship/components/SpaceshipEarth').then((m) => ({ default: m.SpaceshipEarth })));
const Syllabus = lazy(() => import('./features/syllabus/components/Syllabus').then((m) => ({ default: m.Syllabus })));
const ArtifactPipeline = lazy(() => import('./features/artifact/components/ArtifactPipeline').then((m) => ({ default: m.ArtifactPipeline })));
const SovereignJustice = lazy(() => import('./features/justice/components/SovereignJustice').then((m) => ({ default: m.SovereignJustice })));
const CareMint = lazy(() => import('./features/caremint/components/CareMint').then((m) => ({ default: m.CareMint })));
const TrustGraph = lazy(() => import('./features/trustgraph/components/TrustGraph').then((m) => ({ default: m.TrustGraph })));
const Ecosystem = lazy(() => import('./features/ecosystem/components/Ecosystem').then((m) => ({ default: m.Ecosystem })));
const Telemetry = lazy(() => import('./features/telemetry/components/Telemetry').then((m) => ({ default: m.Telemetry })));
const Workers = lazy(() => import('./features/workers/components/Workers').then((m) => ({ default: m.Workers })));
const MCPSurface = lazy(() => import('./features/mcp/components/MCPSurface').then((m) => ({ default: m.MCPSurface })));
const TerminalSurface = lazy(() => import('./features/terminal/components/TerminalSurface').then((m) => ({ default: m.TerminalSurface })));
const CodeSurface = lazy(() => import('./features/code/components/CodeSurface').then((m) => ({ default: m.CodeSurface })));
const DesignSurface = lazy(() => import('./features/design/components/DesignSurface').then((m) => ({ default: m.DesignSurface })));
const DocsSurface = lazy(() => import('./features/docs/components/DocsSurface').then((m) => ({ default: m.DocsSurface })));
const ResearchSurface = lazy(() => import('./features/research/components/ResearchSurface').then((m) => ({ default: m.ResearchSurface })));
const PapersSurface = lazy(() => import('./features/papers/components/PapersSurface').then((m) => ({ default: m.PapersSurface })));
const PilotSurface = lazy(() => import('./features/pilot/components/PilotSurface').then((m) => ({ default: m.PilotSurface })));
const FamilySurface = lazy(() => import('./features/family/components/FamilySurface').then((m) => ({ default: m.FamilySurface })));
const SchoolSurface = lazy(() => import('./features/school/components/SchoolSurface').then((m) => ({ default: m.SchoolSurface })));
const HealthSurface = lazy(() => import('./features/health/components/HealthSurface').then((m) => ({ default: m.HealthSurface })));
const SleepSurface = lazy(() => import('./features/sleep/components/SleepSurface').then((m) => ({ default: m.SleepSurface })));
const FocusSurface = lazy(() => import('./features/focus/components/FocusSurface').then((m) => ({ default: m.FocusSurface })));
const FlowSurface = lazy(() => import('./features/flow/components/FlowSurface').then((m) => ({ default: m.FlowSurface })));
const BrainSurface = lazy(() => import('./features/brain/components/BrainSurface').then((m) => ({ default: m.BrainSurface })));
const MemorySurface = lazy(() => import('./features/memory/components/MemorySurface').then((m) => ({ default: m.MemorySurface })));
const AttentionSurface = lazy(() => import('./features/attention/components/AttentionSurface').then((m) => ({ default: m.AttentionSurface })));
const RegulationSurface = lazy(() => import('./features/regulation/components/RegulationSurface').then((m) => ({ default: m.RegulationSurface })));
const SensorySurface = lazy(() => import('./features/sensory/components/SensorySurface').then((m) => ({ default: m.SensorySurface })));
const MovementSurface = lazy(() => import('./features/movement/components/MovementSurface').then((m) => ({ default: m.MovementSurface })));
const BreathSurface = lazy(() => import('./features/breath/components/BreathSurface').then((m) => ({ default: m.BreathSurface })));
const SoundSurface = lazy(() => import('./features/sound/components/SoundSurface').then((m) => ({ default: m.SoundSurface })));
const VisionSurface = lazy(() => import('./features/vision/components/VisionSurface').then((m) => ({ default: m.VisionSurface })));
const TouchSurface = lazy(() => import('./features/touch/components/TouchSurface').then((m) => ({ default: m.TouchSurface })));
const TasteSurface = lazy(() => import('./features/taste/components/TasteSurface').then((m) => ({ default: m.TasteSurface })));
const SmellSurface = lazy(() => import('./features/smell/components/SmellSurface').then((m) => ({ default: m.SmellSurface })));

function SurfaceSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-cloud/30">
      <div className="glass-panel p-8 text-center">
        <div className="w-8 h-8 border-2 border-quantum-cyan/30 border-t-quantum-cyan rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-mono">Loading surface...</p>
      </div>
    </div>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <PhosShell />,
    children: [
  {
    path: 'conversational',
    element: (
      <Suspense fallback={<SurfaceSkeleton />}>
        <ConversationalSurface />
      </Suspense>
    ),
  },
  {
    index: true,
    element: (
      <Suspense fallback={<SurfaceSkeleton />}>
        <ConversationalSurface />
      </Suspense>
    ),
  },
  {
    path: 'hearth',
    element: (
      <Suspense fallback={<SurfaceSkeleton />}>
        <HearthSurface />
      </Suspense>
    ),
  },
  { path: 'dashboard', element: <DashboardSurface /> },
  { path: 'settings', element: <SettingsSurface /> },
  { path: 'passport', element: <PassportSurface /> },
  { path: 'vault', element: <VaultSurface /> },
  { path: 'ledger', element: <LedgerSurface /> },
  { path: 'developer', element: <DeveloperSurface /> },
  { path: 'bonding', element: <BondingSurface /> },
  { path: 'arcade', element: <ArcadeSurface /> },
  { path: 'compass', element: <CompassSurface /> },
  { path: 'marketplace', element: <MarketplaceSurface /> },
  { path: 'admin', element: <AdminSurface /> },
  { path: 'forge', element: <CaptureBoard /> },
  { path: 'cognitive', element: <CognitiveProsthetic /> },
  { path: 'spaceship', element: <SpaceshipEarth /> },
  { path: 'syllabus', element: <Syllabus /> },
  { path: 'artifact', element: <ArtifactPipeline /> },
  { path: 'justice', element: <SovereignJustice /> },
  { path: 'caremint', element: <CareMint /> },
  { path: 'trustgraph', element: <TrustGraph /> },
  { path: 'ecosystem', element: <Ecosystem /> },
  { path: 'telemetry', element: <Telemetry /> },
  { path: 'workers', element: <Workers /> },
  { path: 'mcp', element: <MCPSurface /> },
  { path: 'terminal', element: <TerminalSurface /> },
  { path: 'code', element: <CodeSurface /> },
  { path: 'design', element: <DesignSurface /> },
  { path: 'docs', element: <DocsSurface /> },
  { path: 'research', element: <ResearchSurface /> },
  { path: 'papers', element: <PapersSurface /> },
  { path: 'pilot', element: <PilotSurface /> },
  { path: 'family', element: <FamilySurface /> },
  { path: 'school', element: <SchoolSurface /> },
  { path: 'health', element: <HealthSurface /> },
  { path: 'sleep', element: <SleepSurface /> },
  { path: 'focus', element: <FocusSurface /> },
  { path: 'flow', element: <FlowSurface /> },
  { path: 'brain', element: <BrainSurface /> },
  { path: 'memory', element: <MemorySurface /> },
  { path: 'attention', element: <AttentionSurface /> },
  { path: 'regulation', element: <RegulationSurface /> },
  { path: 'sensory', element: <SensorySurface /> },
  { path: 'movement', element: <MovementSurface /> },
  { path: 'breath', element: <BreathSurface /> },
  { path: 'sound', element: <SoundSurface /> },
  { path: 'vision', element: <VisionSurface /> },
  { path: 'touch', element: <TouchSurface /> },
  { path: 'taste', element: <TasteSurface /> },
  { path: 'smell', element: <SmellSurface /> },
  {
    path: '/*',
    element: (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Surface not found</h1>
        <p className="text-cloud/60">This surface is coming soon.</p>
      </div>
    ),
  },
    ],
  },
];
