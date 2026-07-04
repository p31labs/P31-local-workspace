import { useState } from 'react';
import { PlayerStats } from '../../../engine/bashball/types.ts';
import { ELITE_TRAINING_ITEMS } from '../../../engine/bashball/training.ts';

interface EliteShopProps {
  spoons: number;
  eliteUnlocked: boolean;
  hasEliteTrial: boolean;
  activeBoosts: string[];
  onPurchase: (itemName: string) => boolean;
  onActivateTrial: () => void;
  onUnlockElite: () => void;
  onBack: () => void;
}

const ITEM_COST = 5;
const TRIAL_TEXT = 'Free Trial — 24h access to the Elite Training Facility. Unlocks 2× training gains for all skills.';

export function EliteShop({ spoons, eliteUnlocked, hasEliteTrial, activeBoosts, onPurchase, onActivateTrial, onBack }: EliteShopProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<string[]>(activeBoosts);
  const [flash, setFlash] = useState<string | null>(null);

  function handlePurchase(name: string) {
    if (purchased.includes(name)) return;
    const ok = onPurchase(name);
    if (ok) {
      setPurchased(prev => [...prev, name]);
      setFlash(name);
      setTimeout(() => setFlash(null), 1200);
    }
  }

  const activeCount = eliteUnlocked ? purchased.length : 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 20, maxWidth: 560, width: '100%', margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🔧</div>
        <h2 style={{
          fontFamily: "'Press Start 2P', cursive", fontSize: 14,
          color: '#cda852', margin: '8px 0 4px',
        }}>
          ELITE FACILITY
        </h2>
        <p style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(232,230,227,0.4)',
        }}>
          Performance Lab — {eliteUnlocked ? 'ACTIVE' : 'LOCKED'}
        </p>
      </div>

      {!eliteUnlocked && (
        <div style={{
          width: '100%', maxWidth: 400,
          padding: '16px 20px', borderRadius: 12,
          background: hasEliteTrial ? 'rgba(205,168,82,0.08)' : 'rgba(139,124,201,0.06)',
          border: `1px solid ${hasEliteTrial ? 'rgba(205,168,82,0.2)' : 'rgba(139,124,201,0.1)'}`,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(232,230,227,0.5)', lineHeight: 1.6, marginBottom: 12,
          }}>
            {TRIAL_TEXT}
          </p>
          {!hasEliteTrial ? (
            <button
              onClick={onActivateTrial}
              style={{
                padding: '10px 24px', borderRadius: 8,
                border: '1px solid #cda852',
                background: 'rgba(205,168,82,0.1)',
                color: '#cda852',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 9, cursor: 'pointer',
              }}
            >
              START FREE TRIAL
            </button>
          ) : (
            <>
              <p style={{
                fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                color: '#cda852',
              }}>
                Trial active — purchase below to unlock permanently (5 🥄)
              </p>
              <button
                onClick={onUnlockElite}
                disabled={spoons < 5}
                style={{
                  marginTop: 12, padding: '10px 24px', borderRadius: 8,
                  border: `1px solid ${spoons >= 5 ? '#cda852' : 'rgba(255,255,255,0.1)'}`,
                  background: spoons >= 5 ? 'rgba(205,168,82,0.1)' : 'rgba(255,255,255,0.02)',
                  color: spoons >= 5 ? '#cda852' : 'rgba(232,230,227,0.2)',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 9, cursor: spoons >= 5 ? 'pointer' : 'not-allowed',
                }}
              >
                UNLOCK PERMANENTLY — 5 🥄
              </button>
            </>
          )}
        </div>
      )}

      <div style={{
        alignSelf: 'stretch',
        display: 'flex', justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
        color: 'rgba(232,230,227,0.5)',
      }}>
        <span>🥄 {spoons.toFixed(0)}</span>
        <span>Items: {activeCount}/{ELITE_TRAINING_ITEMS.length}</span>
        {eliteUnlocked && <span style={{ color: '#3ba372' }}>2× GAINS</span>}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, width: '100%',
      }}>
        {ELITE_TRAINING_ITEMS.map(item => {
          const owned = purchased.includes(item.name);
          const statLabel = item.stat.charAt(0).toUpperCase() + item.stat.slice(1);
          return (
            <div
              key={item.name}
              onMouseEnter={() => setHovered(item.name)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: owned ? 'rgba(59,163,114,0.06)' :
                  flash === item.name ? 'rgba(205,168,82,0.12)' :
                  'rgba(255,255,255,0.02)',
                border: `1px solid ${
                  owned ? 'rgba(59,163,114,0.2)' :
                  flash === item.name ? 'rgba(205,168,82,0.4)' :
                  'rgba(255,255,255,0.06)'
                }`,
                transition: 'all 0.2s',
                opacity: (!eliteUnlocked && !hasEliteTrial) ? 0.4 : 1,
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  color: '#e8e6e3', fontWeight: 600,
                }}>
                  {item.name}
                </span>
                {owned && <span style={{ fontSize: 14 }}>✅</span>}
              </div>
              <div style={{
                fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(232,230,227,0.4)', marginBottom: 8,
              }}>
                {statLabel} ×{item.boost.toFixed(1)} training boost
              </div>
              {!owned && (eliteUnlocked || hasEliteTrial) && (
                <button
                  onClick={() => handlePurchase(item.name)}
                  disabled={spoons < ITEM_COST}
                  style={{
                    width: '100%', padding: '6px 0', borderRadius: 6,
                    border: `1px solid ${spoons >= ITEM_COST ? '#cda852' : 'rgba(255,255,255,0.1)'}`,
                    background: spoons >= ITEM_COST ? 'rgba(205,168,82,0.08)' : 'rgba(255,255,255,0.02)',
                    color: spoons >= ITEM_COST ? '#cda852' : 'rgba(232,230,227,0.2)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, cursor: spoons >= ITEM_COST ? 'pointer' : 'not-allowed',
                  }}
                >
                  BUY {ITEM_COST}🥄
                </button>
              )}
              {owned && (
                <div style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  color: '#3ba372', textAlign: 'center',
                }}>
                  EQUIPPED
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onBack}
        style={{
          padding: '10px 28px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent',
          color: 'rgba(232,230,227,0.5)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, cursor: 'pointer',
        }}
      >
        ← BACK
      </button>
    </div>
  );
}
