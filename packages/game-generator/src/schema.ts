export type GameType = 'jitterbug' | 'collector' | 'builder' | 'cards' | 'sports' | 'strategy';
export type Screen = 'title' | 'play' | 'results' | 'training' | 'season';
export type SizeClass = 'compact' | 'regular' | 'medium' | 'expanded';
export type ScaffoldTarget = 'astro-page' | 'standalone' | 'worker';

export interface GameDefinition {
  schemaVersion: '1.0';
  game: {
    id: string;
    name: string;
    type: GameType;
    description?: string;
    spoonsMin: number;
    spoonsMax: number;
    loveCompletion: number;
    loveMilestone: number;
    sizeClass: SizeClass;
    challenges?: string[];
  };
  engine: {
    primitives?: string[];
    maxPieces?: number;
    snapTolerance?: number;
    morphTarget?: string;
    teamSize?: number;
    deckConfig?: { suits: string[]; ranks: string[] };
  };
  ui: {
    theme: {
      primary: string;
      accent: string;
      background?: string;
    };
    screens: Screen[];
    components: Record<string, string>;
  };
  stateMachine: {
    initial: string;
    states: Record<string, { on: Record<string, string> }>;
  };
  assets: {
    sounds: Record<string, string>;
    particles: Record<string, string>;
  };
  scaffold: {
    target: ScaffoldTarget;
  };
}

export interface GeneratedGame {
  id: string;
  type: GameType;
  name: string;
  component: string;
  css: string;
  page: string;
  manifest: {
    name: string;
    route: string;
    loveRewards: { completion: number; milestone: number };
  };
}

export interface GameBuilderInput {
  game: {
    id?: string;
    name: string;
    type: GameType;
    spoonsMin: number;
    spoonsMax: number;
    loveCompletion: number;
    loveMilestone: number;
    description?: string;
    sizeClass?: SizeClass;
    challenges?: string[];
  };
  engine?: Record<string, any>;
  LOVE?: { completion?: number; milestone?: number };
  scaffold?: { target?: ScaffoldTarget };
  generatedAt?: string;
}
