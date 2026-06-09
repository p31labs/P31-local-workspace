import { get as idbGet } from 'idb-keyval';

const IDB_KEY = 'p31-birthday-boot';
const BIRTHDAY = new Date('2026-03-10T00:00:00');

export function isBirthdayOrAfter(): boolean {
  return new Date() >= BIRTHDAY;
}

export async function hasSeenBoot(): Promise<boolean> {
  try {
    const seen = await idbGet<boolean>(IDB_KEY);
    return seen === true;
  } catch {
    return false;
  }
}
