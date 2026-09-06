import type { Profile, TetraVertex, SBT } from './types';
import { getOrCreateDid } from './did';
import { computeTetrahedronHash, buildSBT } from './sbt';

let _prefix = 'willow:';

export function configure(opts: { profilePrefix?: string }) {
  if (opts.profilePrefix) _prefix = opts.profilePrefix;
}

export function getProfilePrefix() {
  return _prefix;
}

function prefixed(key: string) {
  return _prefix + key;
}

export async function createProfile(
  name: string,
  avatar: string,
  role: Profile['role'] = 'child'
): Promise<Profile> {
  const did = await getOrCreateDid();
  const tetrahedron = createTetrahedron(did);
  const profile: Profile = {
    username: `${name.toLowerCase().replace(/\s/g, '.')}@willow.soul`,
    name,
    avatar,
    role,
    did,
    tetrahedron,
    sbts: [],
    starCount: 0,
    gamesCompleted: 0,
    moodCount: 0,
    sbtMilestones: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  localStorage.setItem(prefixed('profile'), JSON.stringify(profile));
  return profile;
}

function createTetrahedron(did: string): Profile['tetrahedron'] {
  const now = Date.now();
  return {
    vertices: [
      { type: 'did', value: did },
      { type: 'reputation', value: { careScore: 0.5, trustTier: 0, sbts: [], loveBalance: 0 } },
      { type: 'preferences', value: { spoons: 3, spoonQuadrants: [3, 3, 3, 3], darkMode: false, reduceMotion: false, soundEffects: true, mood: null } },
      { type: 'relations', value: { familyDid: null, guardianDid: null, meshPeers: [], caregiverPin: generatePin() } },
    ],
    symmetry: 1.0,
    curvature: 0,
    status: 'green',
  };
}

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function getProfile(): Profile {
  const raw = localStorage.getItem(prefixed('profile'));
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<Profile>;
      return {
        ...createProfileSync('Default', '🌱'),
        ...parsed,
        starCount: parsed.starCount ?? 0,
        gamesCompleted: parsed.gamesCompleted ?? 0,
        moodCount: parsed.moodCount ?? 0,
        sbtMilestones: parsed.sbtMilestones ?? [],
      };
    } catch {
      // fall through
    }
  }
  return createProfileSync('Willow', '🌱');
}

function createProfileSync(name: string, avatar: string): Profile {
  const tetrahedron = createTetrahedronSync();
  return {
    username: `${name.toLowerCase().replace(/\s/g, '.')}@willow.soul`,
    name,
    avatar,
    role: 'child',
    did: '',
    tetrahedron,
    sbts: [],
    starCount: 0,
    gamesCompleted: 0,
    moodCount: 0,
    sbtMilestones: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createTetrahedronSync(): Profile['tetrahedron'] {
  return {
    vertices: [
      { type: 'did', value: '' },
      { type: 'reputation', value: { careScore: 0.5, trustTier: 0, sbts: [], loveBalance: 0 } },
      { type: 'preferences', value: { spoons: 3, spoonQuadrants: [3, 3, 3, 3], darkMode: false, reduceMotion: false, soundEffects: true, mood: null } },
      { type: 'relations', value: { familyDid: null, guardianDid: null, meshPeers: [], caregiverPin: generatePin() } },
    ],
    symmetry: 1.0,
    curvature: 0,
    status: 'green',
  };
}

export function updateProfile(updates: Partial<Profile>): Profile {
  const current = getProfile();
  const next = { ...current, ...updates, updatedAt: Date.now() };
  localStorage.setItem(prefixed('profile'), JSON.stringify(next));
  return next;
}

export function updateTetrahedronVertex(
  vertexIndex: 0 | 1 | 2 | 3,
  value: TetraVertex['value']
): Profile {
  const profile = getProfile();
  const vertices = [...profile.tetrahedron.vertices] as [TetraVertex, TetraVertex, TetraVertex, TetraVertex];
  const types = ['did', 'reputation', 'preferences', 'relations'] as const;
  vertices[vertexIndex] = { type: types[vertexIndex], value } as TetraVertex;
  profile.tetrahedron = { ...profile.tetrahedron, vertices };
  profile.updatedAt = Date.now();
  localStorage.setItem(prefixed('profile'), JSON.stringify(profile));
  return profile;
}

export function addSBT(sbt: SBT): Profile {
  const profile = getProfile();
  profile.sbts = [...profile.sbts, sbt];
  profile.updatedAt = Date.now();
  localStorage.setItem(prefixed('profile'), JSON.stringify(profile));
  return profile;
}

export function mintAchievementSBT(
  name: string,
  description: string,
  starCount: number,
  gamesCompleted: number
): SBT {
  const profile = getProfile();
  const tetraHash = computeTetrahedronHash({
    did: profile.did,
    name: profile.name,
    starCount,
    gamesCompleted,
  });
  return buildSBT('achievement', profile.did, tetraHash, {
    name,
    description,
    attributes: [
      { trait_type: 'starCount', value: String(starCount) },
      { trait_type: 'gamesCompleted', value: String(gamesCompleted) },
    ],
  });
}

export function getDid(): string {
  const profile = getProfile();
  return profile.did || localStorage.getItem(prefixed('did')) || '';
}

export async function ensureDid(): Promise<string> {
  const profile = getProfile();
  if (profile.did) return profile.did;
  const did = await getOrCreateDid();
  updateProfile({ did });
  return did;
}

export function incrementMoodCount(): Profile {
  const profile = getProfile();
  const next = { ...profile, moodCount: (profile as any).moodCount + 1 };
  localStorage.setItem(prefixed('profile'), JSON.stringify(next));
  return next;
}

export function addSBTMilestone(type: string): Profile {
  const profile = getProfile();
  const milestones = [...(profile as any).sbtMilestones, type];
  const next = { ...profile, sbtMilestones: milestones };
  localStorage.setItem(prefixed('profile'), JSON.stringify(next));
  return next;
}

export function hasSBTMilestone(type: string): boolean {
  const profile = getProfile();
  return (profile as any).sbtMilestones?.includes(type) || false;
}
