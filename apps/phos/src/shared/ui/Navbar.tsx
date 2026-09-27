import { Link } from 'react-router-dom';
import { useSpoonStore } from '../stores/spoonStore';
import { AppNav } from '@p31ca/ui/chrome';

const NAV_GROUPS: { group: string; items: { to: string; label: string }[] }[] = [
  {
    group: 'Core',
    items: [
      { to: '/', label: 'Hearth' },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/passport', label: 'Passport' },
      { to: '/compass', label: 'Compass' },
      { to: '/ledger', label: 'Ledger' },
    ],
  },
  {
    group: 'Build',
    items: [
      { to: '/forge', label: 'Capture' },
      { to: '/cognitive', label: 'Vibe' },
      { to: '/arcade', label: 'Arcade' },
      { to: '/code', label: 'Code' },
      { to: '/developer', label: 'Developer' },
    ],
  },
  {
    group: 'Sovereign',
    items: [
      { to: '/vault', label: 'Vault' },
      { to: '/ledger', label: 'Governance' },
      { to: '/marketplace', label: 'Marketplace' },
      { to: '/caremint', label: 'Care Mint' },
      { to: '/justice', label: 'Justice' },
    ],
  },
  {
    group: 'Explore',
    items: [
      { to: '/bonding', label: 'Bonding' },
      { to: '/spaceship', label: 'Spaceship Earth' },
      { to: '/ecosystem', label: 'Ecosystem' },
      { to: '/trustgraph', label: 'Trust Graph' },
      { to: '/family', label: 'Family' },
    ],
  },
  {
    group: 'Care',
    items: [
      { to: '/health', label: 'Health' },
      { to: '/school', label: 'School' },
      { to: '/pilot', label: 'Pilot' },
      { to: '/cognitive', label: 'Cognitive' },
      { to: '/brain', label: 'Brain' },
    ],
  },
  {
    group: 'System',
    items: [
      { to: '/telemetry', label: 'Telemetry' },
      { to: '/workers', label: 'Workers' },
      { to: '/mcp', label: 'MCP' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

function NavLinks() {
  return (
    <>
      {NAV_GROUPS.map((g) => (
        <div key={g.group} className="flex items-center gap-3">
          <span className="text-label" style={{ fontSize: 9, letterSpacing: '0.17em', textTransform: 'uppercase', color: 'var(--p31-text-tertiary)' }}>
            {g.group}
          </span>
          {g.items.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="text-cloud/80 hover:text-quantum-cyan transition-colors whitespace-nowrap"
              style={{ textDecoration: 'none' }}
            >
              {n.label}
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}

export function Navbar({ onCompanion }: { onCompanion: () => void }) {
  const spoons = useSpoonStore((s) => s.spoons);
  const setSpoons = useSpoonStore((s) => s.setSpoons);

  return (
    <AppNav
      appName="PHOS"
      tagline="ambient workspace"
      spoons={spoons}
      setSpoons={(n: number) => setSpoons(n as 0|1|2|3|4|5)}
      onCompanion={onCompanion}
      navLinks={<NavLinks />}
    />
  );
}
