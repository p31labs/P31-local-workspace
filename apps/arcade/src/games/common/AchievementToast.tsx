import { useEffect, useState } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  loveReward: number;
}

export function AchievementToast({ achievement, onDone }: { achievement: Achievement | null; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 3500);
      return () => clearTimeout(t);
    }
  }, [achievement]);

  if (!achievement || !visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
      animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        padding: '16px 24px', borderRadius: 14,
        background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(251,191,36,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <div>
            <div style={{ color: '#FBBF24', fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>
              {achievement.title}
            </div>
            <div style={{ color: '#94A3B8', fontSize: 12 }}>
              {achievement.description}
            </div>
          </div>
          <div style={{ color: '#34D399', fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>
            +{achievement.loveReward} ❤️
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}
