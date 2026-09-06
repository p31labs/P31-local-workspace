/**
 * Canonical geodesic campaign data — single source of truth for the 5-track
 * progressive coach used in geodesic.html and future Bonding GeodesicMode.
 *
 * Any change here MUST be mirrored in p31ca/public/geodesic.html (the inline
 * `const CAMPAIGN = { ... }` block). The CI verifier
 * `p31ca/scripts/verify-geodesic-campaign.mjs` enforces this via prebuild.
 */

export type WaitForEvent =
  | 'orbit'
  | 'zoom'
  | 'ring_reached'
  | 'snap_enabled'
  | 'snap_used'
  | 'any_tap'
  | `shape_count:${number}`
  | `shape_added:${'tet' | 'oct' | 'ico' | 'cube'}`;

export interface CampaignStep {
  id: string;
  msg: string;
  emoji: string;
  waitFor: WaitForEvent;
  celebration: string;
}

export interface CampaignTrack {
  id: string;
  label: string;
  emoji: string;
  unlock: string[];
  steps: CampaignStep[];
}

export interface GeodesicCampaign {
  tracks: CampaignTrack[];
}

export const GEODESIC_CAMPAIGN: GeodesicCampaign = {
  tracks: [
    {
      id: 'explorer',
      label: 'Explorer',
      emoji: '🔭',
      unlock: [],
      steps: [
        { id: 'orbit', msg: 'Drag the empty space to look around.',                       emoji: '🔭', waitFor: 'orbit', celebration: 'You can see any angle!' },
        { id: 'zoom',  msg: 'Now scroll, or pinch with two fingers, to zoom in and out.', emoji: '🔍', waitFor: 'zoom',  celebration: 'Got it!' },
      ],
    },
    {
      id: 'scootch',
      label: 'Scootch',
      emoji: '✊',
      unlock: [],
      steps: [
        { id: 'ring', msg: 'Grab the green shape and drag it to the glowing ring.', emoji: '✊', waitFor: 'ring_reached', celebration: 'Right there!' },
      ],
    },
    {
      id: 'sticky',
      label: 'Sticky',
      emoji: '🔗',
      unlock: ['btn-snap'],
      steps: [
        { id: 'second',  msg: 'Tap Tetrahedron to add a second shape.',        emoji: '➕', waitFor: 'shape_count:2', celebration: 'Two shapes!' },
        { id: 'snap_on', msg: 'Tap Snap in the toolbar to turn it on.',       emoji: '🔗', waitFor: 'snap_enabled',  celebration: 'Snap is on!' },
        { id: 'snap_do', msg: 'Drag one shape close to the other and let go.', emoji: '💥', waitFor: 'snap_used',     celebration: 'They stuck!' },
      ],
    },
    {
      id: 'builder',
      label: 'Builder',
      emoji: '🏗',
      unlock: ['btn-oct', 'btn-ico', 'btn-cube'],
      steps: [
        { id: 'add_oct',    msg: 'Add an Octahedron — 8 faces!',            emoji: '💎', waitFor: 'shape_added:oct', celebration: '8 faces!' },
        { id: 'free_build', msg: 'Build anything. All tools are unlocked.', emoji: '🏗', waitFor: 'any_tap',         celebration: '' },
      ],
    },
    {
      id: 'mesh',
      label: 'Mesh',
      emoji: '🌐',
      unlock: ['btn-join-room'],
      steps: [
        { id: 'live', msg: 'Join Live Room, then copy or share the link so a friend can open the same ?room= URL.', emoji: '🌐', waitFor: 'any_tap', celebration: '' },
      ],
    },
  ],
};
