export const DRAW_COLORS = ['#FF6B9D', '#4CAF50', '#4A90E2', '#FFC107', '#1F2937', '#EC4899'] as const;

export const QUICK_MOODS = [
  { level: 5, emoji: '😄', label: 'Happy', bg: 'bg-green-400' },
  { level: 4, emoji: '🙂', label: 'Okay',  bg: 'bg-blue-400' },
  { level: 2, emoji: '😔', label: 'Sad',   bg: 'bg-indigo-400' },
  { level: 1, emoji: '😡', label: 'Mad',   bg: 'bg-red-400' },
] as const;

export const FAMILY_CONTACTS = [
  { id: 1, emoji: '👨🏽', label: 'Dad',   bg: 'bg-blue-100',   border: 'border-blue-400' },
  { id: 2, emoji: '👩🏽', label: 'Mom',   bg: 'bg-purple-100', border: 'border-purple-400' },
  { id: 3, emoji: '👵🏽', label: 'Nana',  bg: 'bg-green-100',  border: 'border-green-400' },
  { id: 4, emoji: '🐕',   label: 'Buster',bg: 'bg-orange-100', border: 'border-orange-400' },
] as const;

export const MEMORY_EMOJIS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼'] as const;
