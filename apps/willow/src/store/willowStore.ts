/**
 * @file willowStore.ts — WILLOW companion state (genesis rewrite).
 * Single source of truth for spoons, love, xp, mood, quests, messages, age.
 * Ported from apps/willow-preview WillowProvider; persists age + spoons.
 */

import { create } from 'zustand';

export type Spoons = 0 | 1 | 2 | 3 | 4 | 5;
export type MoodId = 'rainbow' | 'sunny' | 'cloudy' | 'rainy' | 'stormy';

export interface Quest {
  id: number;
  title: string;
  desc: string;
  xp: number;
  love: number;
  icon: string;
  done: boolean;
}

export interface ChatMessage {
  id: number;
  from: 'user' | 'willow' | 'buddy';
  text: string;
  ts: string;
}

export interface Skill {
  id: string;
  label: string;
  emoji: string;
  level: number;
  maxLevel: number;
  xpNeeded: number;
  color: string;
}

export interface ConsentRecord {
  childDid: string;
  parentDid: string;
  signedAt: number;
  statement: string;
  signatureB64: string;
  childPubB64: string;
  parentPubB64: string;
}

export const MOODS: { id: MoodId; emoji: string; label: string }[] = [
  { id: 'rainbow', emoji: '🌈', label: 'Amazing' },
  { id: 'sunny', emoji: '☀️', label: 'Good' },
  { id: 'cloudy', emoji: '⛅', label: 'Okay' },
  { id: 'rainy', emoji: '🌧️', label: 'Hard' },
  { id: 'stormy', emoji: '⛈️', label: 'Rough' },
];

export const SKILLS: Skill[] = [
  { id: 'focus', label: 'Focus', emoji: '🎯', level: 2, maxLevel: 10, xpNeeded: 200, color: '#34d399' },
  { id: 'create', label: 'Creativity', emoji: '🎨', level: 3, maxLevel: 10, xpNeeded: 300, color: '#a78bfa' },
  { id: 'music', label: 'Music', emoji: '🎵', level: 1, maxLevel: 10, xpNeeded: 100, color: '#fbbf24' },
  { id: 'calm', label: 'Calm', emoji: '🌿', level: 4, maxLevel: 10, xpNeeded: 400, color: '#34d399' },
  { id: 'words', label: 'Words', emoji: '📝', level: 2, maxLevel: 10, xpNeeded: 200, color: '#fb7185' },
  { id: 'connect', label: 'Connection', emoji: '💚', level: 1, maxLevel: 10, xpNeeded: 100, color: '#60a5fa' },
];

const INIT_QUESTS: Quest[] = [
  { id: 1, title: 'Morning Star', desc: 'Log your mood first thing', xp: 15, love: 5, icon: '⭐', done: false },
  { id: 2, title: 'Color Storm', desc: 'Draw something with 3+ colors', xp: 25, love: 10, icon: '🎨', done: false },
  { id: 3, title: 'Beat Builder', desc: 'Make a 4-track loop in Music Maker', xp: 40, love: 15, icon: '🎵', done: false },
  { id: 4, title: 'Breath of Life', desc: 'Complete one breathing cycle in the Portal', xp: 20, love: 8, icon: '🌬️', done: false },
  { id: 5, title: 'Story Time', desc: 'Send a message to your Buddy', xp: 30, love: 12, icon: '📖', done: false },
  { id: 6, title: 'Helper Heart', desc: 'Earn 10 LOVE today', xp: 20, love: 10, icon: '💚', done: false },
];

const AGE_KEY = 'willow-age';
const SPN_KEY = 'p31:spoons';

function readAge(): number | null {
  const raw = localStorage.getItem(AGE_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function readSpoons(): Spoons {
  const raw = localStorage.getItem(SPN_KEY);
  const n = raw ? parseInt(raw, 10) : 4;
  return (n >= 0 && n <= 5 ? n : 4) as Spoons;
}

interface WillowState {
  spoons: Spoons;
  setSpoons: (s: Spoons) => void;
  love: number;
  xp: number;
  mood: MoodId;
  setMood: (m: MoodId) => void;
  quests: Quest[];
  completeQuest: (id: number) => void;
  messages: ChatMessage[];
  addMessage: (text: string, from?: 'user' | 'willow' | 'buddy') => void;
  earnLove: (amt: number) => void;
  age: number | null;
  setAge: (a: number) => void;
  consent: ConsentRecord | null;
  setConsent: (c: ConsentRecord) => void;
  level: () => number;
}

export const useWillowStore = create<WillowState>((set, get) => ({
  spoons: readSpoons(),
  setSpoons: (s) => {
    localStorage.setItem(SPN_KEY, String(s));
    document.documentElement.setAttribute('data-spoons', String(s));
    set({ spoons: s });
  },
  love: 327,
  xp: 1240,
  mood: 'sunny',
  setMood: (m) => set({ mood: m }),
  quests: INIT_QUESTS,
  completeQuest: (id) => {
    const q = get().quests.find((x) => x.id === id);
    if (!q || q.done) return;
    set((st) => ({
      quests: st.quests.map((x) => (x.id === id ? { ...x, done: true } : x)),
      love: st.love + q.love,
      xp: st.xp + q.xp,
    }));
  },
  messages: [
    { id: 1, from: 'willow', text: 'Hey! I’m Willow, your companion 🌿 How are you feeling today?', ts: '9:00 AM' },
  ],
  addMessage: (text, from = 'user') => {
    const msg: ChatMessage = {
      id: Date.now(),
      from,
      text,
      ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    set((st) => ({ messages: [...st.messages, msg] }));
    if (from === 'user') {
      get().earnLove(2);
    }
  },
  earnLove: (amt) => set((st) => ({ love: st.love + amt, xp: st.xp + amt * 2 })),
  age: readAge(),
  setAge: (a) => {
    localStorage.setItem(AGE_KEY, String(a));
    document.documentElement.setAttribute('data-age-group', a <= 9 ? 'child' : 'youth');
    set({ age: a });
  },
  consent: null,
  setConsent: (c) => set({ consent: c }),
  level: () => Math.floor(get().xp / 500) + 1,
}));
