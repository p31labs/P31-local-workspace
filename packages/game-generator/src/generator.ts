import type { GameDefinition, GeneratedGame, GameBuilderInput } from './schema.js';
import { renderJitterbug } from './renderers/jitterbug.js';

export function generateGame(def: GameDefinition): GeneratedGame {
  const { id, type, name } = def.game;
  const { theme } = def.ui;

  let component: string;
  switch (type) {
    case 'jitterbug':
      component = renderJitterbug(def);
      break;
    default:
      throw new Error(`Game type "${type}" not yet implemented`);
  }

  const css = `
    .game-container {
      font-family: monospace;
      background: ${theme.background || '#0A0A0F'};
      color: ${theme.primary};
    }
    .game-btn-primary {
      background: ${theme.primary};
      color: #0A0A0F;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
    }
    .game-btn-accent {
      background: ${theme.accent};
      color: #0A0A0F;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
    }
  `;

  const page = `---
import ArcadeLayout from '../../layouts/ArcadeLayout.astro';
import GameComponent from './GameComponent';
---
<ArcadeLayout title="${name} — Arcade">
  <GameComponent client:only="react" />
</ArcadeLayout>
`;

  const manifest = {
    name,
    route: `/play/${id}`,
    loveRewards: {
      completion: def.game.loveCompletion,
      milestone: def.game.loveMilestone,
    },
  };

  return {
    id,
    type,
    name,
    component,
    css,
    page,
    manifest,
  };
}

export function buildDefinition(input: GameBuilderInput): GameDefinition {
  if (!input.game?.name || !input.game?.type) {
    throw new Error('game.name and game.type required');
  }

  return {
    schemaVersion: '1.0',
    game: {
      id: input.game.id || `${input.game.type}-${Date.now()}`,
      name: input.game.name,
      type: input.game.type,
      description: input.game.description || '',
      spoonsMin: input.game.spoonsMin ?? 2,
      spoonsMax: input.game.spoonsMax ?? 5,
      loveCompletion: input.LOVE?.completion ?? input.game.loveCompletion ?? 100,
      loveMilestone: input.LOVE?.milestone ?? input.game.loveMilestone ?? 20,
      sizeClass: input.game.sizeClass || 'regular',
      challenges: input.game.challenges || [],
    },
    engine: input.engine || {},
    ui: {
      theme: {
        primary: '#00F0FF',
        accent: '#FBBF24',
        background: '#0A0A0F',
      },
      screens: ['title', 'play', 'results'],
      components: {},
    },
    stateMachine: {
      initial: 'title',
      states: {
        title: { on: { START: 'playing' } },
        playing: { on: { COMPLETE: 'results', RESET: 'title' } },
        results: { on: { PLAY_AGAIN: 'playing', HOME: 'title' } },
      },
    },
    assets: {
      sounds: { hit: 'P31_F.fifth', complete: 'P31_F.goal' },
      particles: { hit: '#FBBF24', complete: '#00F0FF' },
    },
    scaffold: {
      target: input.scaffold?.target || 'astro-page',
    },
  };
}
