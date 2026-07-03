import { persistentAtom } from '@nanostores/persistent';

export type SpoonsState = 0 | 1 | 2 | 3 | 4 | 5;

export const spoonsStore = persistentAtom<SpoonsState>('phos:spoons', 4, {
  encode: JSON.stringify,
  decode: JSON.parse,
});
