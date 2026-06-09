/**
 * grants.gov — Search2 REST API (no auth)
 * Scans current opportunities against a keyword watchlist and returns hits.
 *
 *   POST https://api.grants.gov/v1/api/search2
 *   Body: { keyword, rows, oppStatuses: "forecasted|posted" }
 *
 * The old RSS feeds (RSS2LatestGrants.xml etc.) were retired in the 2024
 * modernization — this channel now uses the REST Search2 endpoint, which
 * accepts exactly one keyword per call. We fan out across the watchlist
 * and dedupe by opportunity id.
 *
 * content: {
 *   keywords?: [...],        // default watchlist if omitted
 *   since?: ISO-date,        // filter by openDate
 *   rows?: number,           // per-keyword cap (default 25)
 *   oppStatuses?: string     // default "forecasted|posted"
 * }
 * env: not required
 */

const ENDPOINT = 'https://api.grants.gov/v1/api/search2';

const DEFAULT_KEYWORDS = [
  'autism', 'autistic', 'neurodivergent', 'neurodiversity',
  'assistive technology', 'cognitive', 'disability',
  'open source', 'accessibility', 'AuDHD', 'ADHD'
];

async function publish({ content }) {
  const keywords = (content?.keywords?.length ? content.keywords : DEFAULT_KEYWORDS);
  const rows = content?.rows || 25;
  const oppStatuses = content?.oppStatuses || 'forecasted|posted';
  const since = content?.since ? new Date(content.since) : null;

  const seen = new Map(); // id -> hit (with matched[] accumulated)

  for (const kw of keywords) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':   'P31-Forge/0.1'
        },
        body: JSON.stringify({ keyword: kw, rows, oppStatuses })
      });
      if (!res.ok) continue;
      const body = await res.json();
      const hits = body?.data?.oppHits || [];
      for (const h of hits) {
        if (since && h.openDate) {
          const opened = parseMMDDYYYY(h.openDate);
          if (opened && opened < since) continue;
        }
        const existing = seen.get(h.id);
        if (existing) {
          if (!existing.matched.includes(kw)) existing.matched.push(kw);
        } else {
          seen.set(h.id, {
            id: h.id,
            number: h.number,
            title: h.title,
            agency: h.agency,
            openDate: h.openDate,
            closeDate: h.closeDate,
            oppStatus: h.oppStatus,
            docType: h.docType,
            cfda: h.cfdaList || [],
            link: `https://www.grants.gov/search-results-detail/${h.id}`,
            matched: [kw]
          });
        }
      }
    } catch (e) {
      // Skip failed keyword; continue scan
    }
  }

  const hits = Array.from(seen.values());

  return {
    success: true,
    platform: 'grants',
    keywords,
    count: hits.length,
    hits
  };
}

// grants.gov returns dates as "MM/DD/YYYY"
function parseMMDDYYYY(s) {
  if (!s) return null;
  const [m, d, y] = s.split('/').map(n => parseInt(n, 10));
  if (!m || !d || !y) return null;
  return new Date(y, m - 1, d);
}

module.exports = { publish };
