#!/usr/bin/env python3
"""
Grant Radar - Scans for relevant grants from Grants.gov RSS feed
Posts matches to grant_radar.txt

Keywords: assistive technology, neurodivergent, open source, hardware, disability
Run: python grant_radar.py

Output: grant_radar.txt (appends new matches)
"""

import os
import re
import sys
import json
import feedparser
import requests
from datetime import datetime
from pathlib import Path


GRANT_RADAR_FILE = 'grant_radar.txt'
RSS_FEEDS = [
    'https://www.grants.gov/rss/RSS2LatestGrants.xml',
    'https://www.grants.gov/rss/RSS2NewGrants.xml',
]

KEYWORDS = [
    'assistive technology',
    'neurodivergent',
    'open source',
    'disability',
    'accessible',
    'augmentative',
    'communication',
    'speech',
    'intellectual disability',
    'developmental disability',
    'autism',
    'adhd',
    'special education',
    'rehabilitation',
    'assistive',
    'adaptive',
    'AAC',
    'hardware',
    'embedded',
    'sensor',
    'haptic'
]

# Priority programs (must check these)
PRIORITY_GRANTORS = [
    'National Institute on Disability, Independent Living, and Rehabilitation Research (NIDILRR)',
    'National Science Foundation (NSF)',
    'Administration for Community Living (ACL)',
    'Department of Education',
    'National Institutes of Health (NIH)',
]


def load_existing_grants() -> set:
    """Load existing grant entries to avoid duplicates."""
    existing = set()
    if os.path.exists(GRANT_RADAR_FILE):
        with open(GRANT_RADAR_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                # Extract grant ID from each line
                match = re.search(r'\[([A-Z0-9\-]+)\]', line)
                if match:
                    existing.add(match.group(1))
    return existing


def parse_deadline(deadline_str: str) -> str:
    """Parse and normalize deadline string to ISO format."""
    if not deadline_str:
        return 'N/A'

    # Try common date formats
    formats = [
        '%Y-%m-%d',
        '%m/%d/%Y',
        '%B %d, %Y',
        '%b %d, %Y',
    ]

    deadline_str = deadline_str.strip()

    for fmt in formats:
        try:
            dt = datetime.strptime(deadline_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue

    return deadline_str


def is_relevant(entry: dict) -> tuple[bool, str]:
    """Check if grant matches keywords or priority programs."""
    text = ' '.join([
        entry.get('title', ''),
        entry.get('description', ''),
        entry.get('tags', ''),
        entry.get('author', ''),
    ]).lower()

    # Check priority grantors first
    author = entry.get('author', '').lower()
    for grantor in PRIORITY_GRANTORS:
        if grantor.lower() in author:
            return True, f'Priority grantor: {grantor}'

    # Check keywords
    for keyword in KEYWORDS:
        if keyword.lower() in text:
            return True, f'Keyword match: {keyword}'

    return False, ''


def fetch_grants_rss() -> list:
    """Fetch grants from RSS feeds."""
    grants = []
    seen_ids = set()

    for feed_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)

            for entry in feed.entries:
                # Skip if already seen
                grant_id = entry.get('id', entry.get('link', ''))
                if grant_id in seen_ids:
                    continue
                seen_ids.add(grant_id)

                # Extract relevant fields
                grant = {
                    'id': grant_id,
                    'title': entry.get('title', 'Untitled'),
                    'description': entry.get('description', '')[:500],
                    'link': entry.get('link', ''),
                    'author': entry.get('author', ''),
                    'published': entry.get('published', ''),
                }

                # Try to extract deadline from description or details
                desc = entry.get('description', '')
                deadline_match = re.search(
                    r'(?:deadline|due|closes?|submission).*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                    desc, re.I
                )
                if deadline_match:
                    grant['deadline'] = parse_deadline(deadline_match.group(1))
                else:
                    grant['deadline'] = 'Check website'

                grants.append(grant)

        except Exception as e:
            print(f"Error fetching {feed_url}: {e}", file=sys.stderr)

    return grants


def fetch_grants_api() -> list:
    """Fetch grants from Grants.gov API (alternative method)."""
    # Grants.gov has a search API - this is a simplified version
    api_url = 'https://api.grants.gov/v1/api/search/v2'

    # Build query for relevant CFDA codes
    # 84.xxx = Department of Education
    # 93.xxx = HHS
    params = {
        'keyword': 'assistive technology OR disability OR autism',
        'rows': 50,
    }

    try:
        response = requests.get(api_url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data.get('grants', [])
    except Exception as e:
        print(f"API error: {e}", file=sys.stderr)

    return []


def save_grant(grant: dict, relevance: str):
    """Append grant to radar file."""
    timestamp = datetime.now().strftime('%Y-%m-%d')

    # Extract ID from link if no ID
    grant_id = grant.get('id', '')
    if not grant_id:
        grant_id = grant.get('link', '').split('/')[-1][:20]

    line = f"[{grant_id}] {grant['title']}\n"
    line += f"  Deadline: {grant.get('deadline', 'N/A')}\n"
    line += f"  Agency: {grant.get('author', 'N/A')}\n"
    line += f"  Match: {relevance}\n"
    line += f"  URL: {grant.get('link', '')}\n"
    line += f"  Found: {timestamp}\n"
    line += "---\n"

    with open(GRANT_RADAR_FILE, 'a', encoding='utf-8') as f:
        f.write(line)

    print(f"  NEW: {grant['title'][:60]}... ({relevance})")


def main():
    print(f"Grant Radar - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)

    # Load existing to avoid duplicates
    existing = load_existing_grants()
    print(f"Existing grants tracked: {len(existing)}")

    new_matches = 0

    # Fetch from RSS
    print("\nFetching from Grants.gov RSS feeds...")
    grants = fetch_grants_rss()
    print(f"Found {len(grants)} total grants")

    # Check each grant
    for grant in grants:
        grant_id = grant.get('id', '')[:30]

        # Skip if already in radar
        if grant_id in existing:
            continue

        # Check relevance
        relevant, reason = is_relevant(grant)

        if relevant:
            save_grant(grant, reason)
            existing.add(grant_id)
            new_matches += 1

    print(f"\n{'=' * 50}")
    print(f"New grants added: {new_matches}")

    if new_matches > 0:
        print(f"Updated: {GRANT_RADAR_FILE}")
    else:
        print("No new matching grants found.")

    # Print upcoming deadlines
    if os.path.exists(GRANT_RADAR_FILE):
        print("\nUpcoming deadlines (next 30 days):")
        with open(GRANT_RADAR_FILE, 'r') as f:
            content = f.read()

        try:
            from datetime import timedelta
            now = datetime.now()
            for line in content.split('\n'):
                if 'Deadline:' in line:
                    date_str = line.split('Deadline:')[1].strip()
                    try:
                        deadline = datetime.strptime(date_str, '%Y-%m-%d')
                        days_left = (deadline - now).days
                        if 0 <= days_left <= 30:
                            print(f"  {line.strip()} ({days_left} days)")
                    except ValueError:
                        continue
        except Exception:
            pass


if __name__ == '__main__':
    main()
