/**
 * @file HelpOverlay.tsx — WCD-32.1: Interactive Help Overlay
 *
 * Searchable help documentation accessible from topbar.
 * Sections: Getting Started, Rooms Overview, Audio & Visuals, Profile & Friends, Cartridges & AI.
 */

import { useState, useMemo } from 'react';

interface HelpSection {
  id: string;
  title: string;
  content: string;
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: `
# Welcome to Spaceship Earth

Spaceship Earth is your cognitive cockpit — a 3D immersive environment for managing focus, creativity, and well-being.

## First Launch
1. The cockpit loads in OBSERVATORY room (the data dome)
2. Your DID identity is generated on first visit
3. The Jitterbug in the center represents your current cognitive state

## Navigation
- Click rooms in the navigation bar to switch views
- Drag to rotate the camera
- Scroll to zoom in/out

## Basic Controls
- **Click** on Jitterbug nodes to interact
- **Mount cartridges** to add capabilities
- **Open overlays** via the Bridge (wallet icon)
    `,
  },
  {
    id: 'rooms',
    title: 'Rooms Overview',
    content: `
# Rooms

Spaceship Earth is organized into interconnected rooms:

## OBSERVATORY
The central data dome showing your cognitive metrics. Nodes pulse with your current state.

## COLLIDER
Particle collider simulator — smash particles to see what happens. Educational physics toy.

## BONDING
The molecule-building game. Earn LOVE by creating molecules with others.

## BRIDGE
Your identity hub. Manage DID, view wallet, customize themes.

## BUFFER
Cognitive load dashboard. Monitor your mental energy.

## COPILOT
AI assistant powered by LLM. Voice input supported.

## FORGE
Create custom cartridges and tools.
    `,
  },
  {
    id: 'audio-visuals',
    title: 'Audio & Visuals',
    content: `
# Audio & Visuals

## Themes
Change your visual experience in the Bridge → Themes tab.
- OPERATOR: Default phosphor green aesthetic
- KIDS: Bright, friendly colors
- GRAY ROCK: Minimal, court-ready (no animations)
- AURORA: Purple/emerald tones
- HIGH CONTRAST: Accessibility mode
- LOW MOTION: Reduced animations

## Spatial Audio
Audio zones change based on which room you're in:
- OBSERVATORY: High-frequency chirps
- BRIDGE: Low rumble
- BRAIN: Soft white noise
- BUFFER: Calming tones

## Coherence
When coherence reaches 100%, a harmonic chimes and particles burst outward.
    `,
  },
  {
    id: 'profile-friends',
    title: 'Profile & Friends',
    content: `
# Profile & Friends

## Your Profile
Your DID (Decentralized Identity) is generated from cryptographic keys.
- Display name and bio are optional
- Make profile public to share with friends

## Friends (Co-Presence)
Friends are discovered through shared BONDING rooms — no server storage.
When you play together, friends appear in your presence list.

## Cartridge Sharing
Generate UCAN tokens to share specific cartridges with friends.
- Token lasts 7 days
- Recipient can import and use the cartridge
    `,
  },
  {
    id: 'cartridges-ai',
    title: 'Cartridges & AI',
    content: `
# Cartridges & AI

## Cartridges
Cartridges add capabilities to your cockpit:
- Mount in the Jitterbug slots
- Each has unique effects on your experience

## Copilot (AI)
The COPILOT room hosts an LLM assistant:
- Voice input: Click the mic button
- Image support: Upload images for analysis
- TTS: AI responses can be spoken aloud

## Agent Tools
The AI can execute commands:
- change_skin(theme) — Switch themes
- mount_cartridge(slot, id) — Add cartridge
- set_accent_color(hex) — Customize color
- open_overlay(room) — Navigate to room
    `,
  },
];

interface HelpOverlayProps {
  onClose: () => void;
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  const [search, setSearch] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  const filteredSections = useMemo(() => {
    if (!search.trim()) return HELP_SECTIONS;
    const q = search.toLowerCase();
    return HELP_SECTIONS.filter(
      s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg border border-quantum-cyan/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-quantum-cyan/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-phosphor">Help</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close help"
            >
              ✕
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search help..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-void/50 border border-quantum-cyan/30 rounded-lg 
                       text-white placeholder-gray-500 focus:outline-none focus:border-quantum-cyan"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSections.map(section => (
            <div
              key={section.id}
              className="border border-quantum-cyan/20 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(
                  expandedSection === section.id ? null : section.id
                )}
                className="w-full px-4 py-3 text-left flex items-center justify-between
                           bg-quantum-cyan/5 hover:bg-quantum-cyan/10 transition-colors"
              >
                <span className="font-medium text-white">{section.title}</span>
                <span className="text-quantum-cyan">
                  {expandedSection === section.id ? '▼' : '▶'}
                </span>
              </button>
              
              {expandedSection === section.id && (
                <div className="p-4 bg-void/30">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {section.content.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) {
                        return <h3 key={i} className="text-lg font-bold text-phosphor mt-4">{line.slice(2)}</h3>;
                      }
                      if (line.startsWith('## ')) {
                        return <h4 key={i} className="text-md font-semibold text-quantum-cyan mt-3">{line.slice(3)}</h4>;
                      }
                      if (line.startsWith('- ')) {
                        return <li key={i} className="text-gray-300 ml-4">{line.slice(2)}</li>;
                      }
                      if (line.match(/^\d+\./)) {
                        return <li key={i} className="text-gray-300 ml-4">{line}</li>;
                      }
                      if (line.trim()) {
                        return <p key={i} className="text-gray-400">{line}</p>;
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {filteredSections.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No results found for "{search}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
