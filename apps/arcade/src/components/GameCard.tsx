const skinColors: Record<string, string> = {
  tetra: '#FBBF24',
  phos: '#A78BFA',
  willow: '#34D399',
};

export interface GameCardProps {
  id: string;
  name: string;
  description: string;
  skin: string;
  deployUrl: string;
}

export default function GameCard({ name, description, skin, deployUrl }: GameCardProps) {
  const color = skinColors[skin] || '#00F0FF';

  return (
    <div style={{
      padding: '24px', borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${color}20`,
      transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f0f2f5' }}>{name}</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
              skin-{skin}
            </div>
          </div>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>
          {description}
        </p>
      </div>
      <a href={deployUrl} target={deployUrl.startsWith('/') ? '_self' : '_blank'} rel="noopener noreferrer" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
        borderRadius: 8, background: `${color}20`, color, fontWeight: 600,
        fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'monospace',
      }}>
        Play →
      </a>
    </div>
  );
}
