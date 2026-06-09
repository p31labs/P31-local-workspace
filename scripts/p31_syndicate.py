#!/usr/bin/env python3
"""
P31 Syndicate - Markdown to Dev.to and Hashnode
Posts content to both platforms from a local Markdown file

Usage:
    python p31_syndicate.py --file post.md --devto --hashnode
    python p31_syndicate.py --file post.md --devto
    python p31_syndicate.py --file post.md --hashnode

Environment:
    DEVTO_API_KEY: Dev.to API key
    HASHNODE_TOKEN: Hashnode personal access token
"""

import argparse
import os
import re
import sys
import requests
from datetime import datetime
from pathlib import Path


def read_markdown(filepath: str) -> dict:
    """Parse markdown file and extract frontmatter and content."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract frontmatter if present
    frontmatter = {}
    body = content

    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            fm_text = parts[1]
            body = parts[2].strip()

            # Parse frontmatter
            for line in fm_text.strip().split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    frontmatter[key.strip()] = value.strip()

    return {
        'title': frontmatter.get('title', Path(filepath).stem.replace('-', ' ').title()),
        'description': frontmatter.get('description', ''),
        'tags': frontmatter.get('tags', '').split(',') if frontmatter.get('tags') else [],
        'canonical_url': frontmatter.get('canonical_url', ''),
        'content': body
    }


def post_to_devto(data: dict, api_key: str) -> dict:
    """Post article to Dev.to."""
    url = 'https://dev.to/api/articles'

    # Convert markdown to HTML (basic conversion)
    content = data['content']

    payload = {
        'article': {
            'title': data['title'],
            'body_markdown': content,
            'description': data['description'] or data['title'][:200],
            'tags': data['tags'] or ['p31labs', 'assistive-technology', 'open-source'],
            'published': True
        }
    }

    if data['canonical_url']:
        payload['article']['canonical_url'] = data['canonical_url']

    headers = {
        'Content-Type': 'application/json',
        'api-key': api_key
    }

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    result = response.json()
    return {
        'success': True,
        'url': result.get('url'),
        'id': result.get('id')
    }


def post_to_hashnode(data: dict, token: str) -> dict:
    """Post article to Hashnode."""
    url = 'https://api.hashnode.com'

    # Convert markdown to HTML (basic conversion)
    content = data['content']

    query = '''
    mutation PublishStory($input: PublishStoryInput!) {
        publishStory(input: $input) {
            success
            story {
                id
                slug
                url
            }
        }
    }
    '''

    publication_id = os.getenv('HASHNODE_PUBLICATION_ID', '')

    payload = {
        'query': query,
        'variables': {
            'input': {
                'title': data['title'],
                'content': content,
                'tags': data['tags'] or ['p31labs', 'assistive-technology'],
                'isPublished': True
            }
        }
    }

    if publication_id:
        payload['variables']['input']['publicationId'] = publication_id

    headers = {
        'Content-Type': 'application/json',
        'Authorization': token
    }

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    result = response.json()
    if result.get('data', {}).get('publishStory', {}).get('success'):
        story = result['data']['publishStory']['story']
        return {
            'success': True,
            'url': story.get('url'),
            'id': story.get('id')
        }
    return {'success': False, 'error': result}


def main():
    parser = argparse.ArgumentParser(description='P31 Syndicate - Post markdown to Dev.to and Hashnode')
    parser.add_argument('--file', '-f', required=True, help='Path to markdown file')
    parser.add_argument('--devto', action='store_true', help='Post to Dev.to')
    parser.add_argument('--hashnode', action='store_true', help='Post to Hashnode')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be posted without posting')

    args = parser.parse_args()

    if not args.devto and not args.hashnode:
        parser.error('At least one of --devto or --hashnode required')

    # Read and parse markdown
    data = read_markdown(args.file)

    print(f"Title: {data['title']}")
    print(f"Tags: {data['tags']}")
    print(f"Content length: {len(data['content'])} chars")

    if args.dry_run:
        print("\n[Dry run - no posts made]")
        return

    results = []

    # Post to Dev.to
    if args.devto:
        api_key = os.getenv('DEVTO_API_KEY')
        if not api_key:
            print("DEVTO_API_KEY not set - skipping Dev.to")
        else:
            try:
                result = post_to_devto(data, api_key)
                print(f"Dev.to: {result['url']}")
                results.append(('devto', result))
            except Exception as e:
                print(f"Dev.to error: {e}")

    # Post to Hashnode
    if args.hashnode:
        token = os.getenv('HASHNODE_TOKEN')
        if not token:
            print("HASHNODE_TOKEN not set - skipping Hashnode")
        else:
            try:
                result = post_to_hashnode(data, token)
                if result.get('success'):
                    print(f"Hashnode: {result['url']}")
                    results.append(('hashnode', result))
                else:
                    print(f"Hashnode error: {result.get('error')}")
            except Exception as e:
                print(f"Hashnode error: {e}")

    print(f"\nPosted to {len(results)} platform(s)")


if __name__ == '__main__':
    main()
