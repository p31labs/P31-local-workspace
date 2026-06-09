import type { default as Fuse } from 'fuse.js';
import type { SearchDoc } from './lib/buildSearchIndex';
import type {
  RolePacketsData,
  WorkSamplesData,
  HelpData,
  GlossaryData,
  ChangelogData
} from './types';

export type AppModel = {
  rolePackets: RolePacketsData;
  workSamples: WorkSamplesData;
  help: HelpData;
  glossary: GlossaryData;
  changelog: ChangelogData;
  fuse: Fuse<SearchDoc>;
};
