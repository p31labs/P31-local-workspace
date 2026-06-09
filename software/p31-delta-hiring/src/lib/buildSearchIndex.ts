import Fuse, { type IFuseOptions } from 'fuse.js';
import type {
  HelpData,
  GlossaryData,
  HelpTopic,
  RolePacket,
  WorkSamplesData
} from '../types';

type SearchKind = 'help' | 'glossary' | 'role' | 'wcd';

export type SearchDoc = {
  id: string;
  kind: SearchKind;
  title: string;
  summary: string;
  tags: string;
  body: string;
  href: string;
};

const fuseOpts: IFuseOptions<SearchDoc> = {
  keys: [
    { name: 'title', weight: 0.35 },
    { name: 'summary', weight: 0.25 },
    { name: 'body', weight: 0.2 },
    { name: 'tags', weight: 0.1 }
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2
};

function topicBody(t: HelpTopic): string {
  return t.blocks
    .map((b) => {
      if (b.type === 'p' || b.type === 'h3' || b.type === 'callout') return b.text;
      if (b.type === 'ul') return b.items.join(' ');
      return '';
    })
    .join(' ');
}

export function buildSearchDocs(
  help: HelpData,
  glossary: GlossaryData,
  roles: RolePacket[],
  work: WorkSamplesData
): SearchDoc[] {
  const h = help.topics.map(
    (t): SearchDoc => ({
      id: `help:${t.id}`,
      kind: 'help',
      title: t.title,
      summary: t.summary,
      tags: t.tags.join(' '),
      body: topicBody(t),
      href: `#/help/${t.id}`
    })
  );
  const g = glossary.entries.map(
    (e): SearchDoc => ({
      id: `glossary:${e.id}`,
      kind: 'glossary',
      title: e.term,
      summary: e.definition,
      tags: e.seeAlso.join(' '),
      body: e.definition,
      href: `#/glossary/${e.id}`
    })
  );
  const r = roles.map(
    (x): SearchDoc => ({
      id: `role:${x.id}`,
      kind: 'role',
      title: x.title,
      summary: x.summary,
      tags: x.tags.join(' ') + ' ' + x.guild,
      body: x.summary,
      href: `#/roles/${x.id}`
    })
  );
  const w = Object.entries(work.samples).map(
    ([id, s]): SearchDoc => ({
      id: `wcd:${id}`,
      kind: 'wcd',
      title: `${id} — ${s.title}`,
      summary: s.summary,
      tags: 'wcd ' + id,
      body: s.summary + ' ' + s.goodLookLike.join(' ') + ' ' + s.antiPatterns.join(' '),
      href: `#/wcd/${id}`
    })
  );
  return [...h, ...g, ...r, ...w];
}

export function createSearchFuse(docs: SearchDoc[]): Fuse<SearchDoc> {
  return new Fuse(docs, fuseOpts);
}
