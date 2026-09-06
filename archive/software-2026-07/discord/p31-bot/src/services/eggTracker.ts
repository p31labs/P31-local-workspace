import fs from 'fs';
import path from 'path';

export type EggId = 'bashium' | 'willium' | 'missing_node' | 'tetrahedron';
export const ALL_EGGS: EggId[] = ['bashium', 'willium', 'missing_node', 'tetrahedron'];
export const FOUNDING_SLOTS = 4;

export const EGG_META: Record<EggId, { label: string; icon: string; hint: string }> = {
  bashium:      { label: 'Bashium Element',          icon: '🟣', hint: 'Genesis quest in BONDING' },
  willium:      { label: 'Willium Element',           icon: '🟢', hint: 'Kitchen quest in BONDING' },
  missing_node: { label: 'The Missing Node (172.35Hz)', icon: '🔊', hint: 'lockTone() at p31ca.org/#collider' },
  tetrahedron:  { label: 'First Tetrahedron (K₄)',   icon: '🧱', hint: 'K4 rigidity / Posner molecule' },
};

// Use env var or detect writable location at runtime
function getWritablePath(basePath: string): string {
  if (process.env.EGG_PROGRESS_PATH) {
    return process.env.EGG_PROGRESS_PATH;
  }
  // Try to write test file to determine if base path is writable
  const testFile = path.join(path.dirname(basePath), '.write-test');
  try {
    fs.writeFileSync(testFile, 'test', { flag: 'wx' });
    fs.unlinkSync(testFile);
    return basePath;
  } catch {
    // Not writable, use tmp
    const dir = path.dirname(basePath);
    const name = path.basename(basePath);
    return path.join('/tmp', name);
  }
}

export const PROGRESS_FILE = getWritablePath(process.env.EGG_PROGRESS_PATH || './egg-progress.json');
export const FOUNDING_FILE = getWritablePath(process.env.EGG_FOUNDING_PATH || './founding-nodes.json');

if (process.env.P31_BOT_QUIET !== "1") {
  console.log(`[EggTracker] Using progress file: ${PROGRESS_FILE}`);
  console.log(`[EggTracker] Using founding file: ${FOUNDING_FILE}`);
}

// Initialize files if they don't exist
if (!fs.existsSync(PROGRESS_FILE)) fs.writeFileSync(PROGRESS_FILE, JSON.stringify({}));
if (!fs.existsSync(FOUNDING_FILE)) fs.writeFileSync(FOUNDING_FILE, JSON.stringify([]));

export const eggTracker = {
  // Returns true if this is a NEW discovery, false if already found
  recordDiscovery(userId: string, eggId: EggId): boolean {
    try {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      if (!progress[userId]) progress[userId] = [];

      if (progress[userId].includes(eggId)) {
        return false; // Already discovered
      }

      progress[userId].push(eggId);
      // Use synchronous write to prevent race conditions from rapid concurrent messages
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      return true;
    } catch (error) {
      console.error('[EggTracker] Error recording discovery:', error);
      return false; // Assume not new on error
    }
  },

  getUserProgress(userId: string): EggId[] {
    try {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return progress[userId] || [];
    } catch (error) {
      console.error('[EggTracker] Error getting user progress:', error);
      return [];
    }
  },

  hasCompletedAll(userId: string): boolean {
    try {
      const userEggs = this.getUserProgress(userId);
      return ALL_EGGS.every(egg => userEggs.includes(egg));
    } catch (error) {
      console.error('[EggTracker] Error checking completion:', error);
      return false;
    }
  },

  // Returns slot number (1-4) if they claimed one, or null if slots are full/already claimed
  claimFoundingNode(userId: string): number | null {
    try {
      const nodes = JSON.parse(fs.readFileSync(FOUNDING_FILE, 'utf-8'));

      if (nodes.includes(userId)) {
        return nodes.indexOf(userId) + 1; // Already a founding node
      }

      if (nodes.length < FOUNDING_SLOTS) {
        nodes.push(userId);
        fs.writeFileSync(FOUNDING_FILE, JSON.stringify(nodes, null, 2));
        return nodes.length; // Their slot number (1, 2, 3, or 4)
      }

      return null; // Slots full
    } catch (error) {
      console.error('[EggTracker] Error claiming founding node:', error);
      return null;
    }
  },
  
  getFoundingNodes(): string[] {
    try {
      return JSON.parse(fs.readFileSync(FOUNDING_FILE, 'utf-8'));
    } catch (error) {
      console.error('[EggTracker] Error getting founding nodes:', error);
      return [];
    }
  },

  getAvailableSlots(): number {
    try {
      const nodes = JSON.parse(fs.readFileSync(FOUNDING_FILE, 'utf-8'));
      return Math.max(0, FOUNDING_SLOTS - nodes.length);
    } catch (error) {
      return FOUNDING_SLOTS;
    }
  }
};
