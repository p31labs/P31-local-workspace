#!/usr/bin/env python3
"""
P31 Social Media Transmitter
===========================
Twitter automation tool for P31 Labs messaging.

Usage:
    python p31_transmitter.py              # Run in test mode (prints without posting)
    python p31_transmitter.py --post        # Actually post tweets
    python p31_transmitter.py --post 0      # Post only the first payload

Requirements:
    pip install tweepy

================================================================================
API KEY SETUP
================================================================================
To use this script with Twitter/X API v2, you need to set up API credentials:

1. Go to https://developer.twitter.com/portal
2. Create a Project and App in the Twitter Developer Portal
3. Generate API Key and Secret (Bearer Token for App-only auth)
4. Generate Access Token and Secret (for posting tweets)

Environment Variables (recommended):
    export TWITTER_BEARER_TOKEN="your_bearer_token_here"
    export TWITTER_API_KEY="your_api_key_here"
    export TWITTER_API_SECRET="your_api_secret_here"
    export TWITTER_ACCESS_TOKEN="your_access_token_here"
    export TWITTER_ACCESS_TOKEN_SECRET="your_access_token_secret_here"

Or edit the CONFIG section below directly (not recommended for production).

================================================================================
"""

import os
import sys
import argparse
import time
from typing import Optional

# Try to import tweepy - will show helpful error if not installed
try:
    import tweepy
except ImportError:
    print("ERROR: tweepy not installed. Run: pip install tweepy")
    sys.exit(1)


# ================================================================================
# CONFIGURATION
# ================================================================================

# Option 1: Environment Variables (recommended)
# Set these before running: export TWITTER_BEARER_TOKEN="..."
# Option 2: Direct configuration (edit below if not using env vars)

CONFIG = {
    # Get these from https://developer.twitter.com/portal
    "bearer_token": os.environ.get("TWITTER_BEARER_TOKEN", ""),
    "api_key": os.environ.get("TWITTER_API_KEY", ""),
    "api_secret": os.environ.get("TWITTER_API_SECRET", ""),
    "access_token": os.environ.get("TWITTER_ACCESS_TOKEN", ""),
    "access_token_secret": os.environ.get("TWITTER_ACCESS_TOKEN_SECRET", ""),
}

# ================================================================================
# PAYLOADS - P31 MESSAGING
# ================================================================================

PAYLOADS = [
    {
        "id": 1,
        "category": "philosophy",
        "content": (
            "🔺 Centralized systems fail. Not because they're wrong—but because they're "
            "built on a floating neutral.\n\n"
            "Delta topology: triangulate truth, code, and law. Ground yourself. "
            "Build what can't be taken down.\n\n"
            "#P31Labs #DeltaTopology #Phosphorus31"
        ),
    },
    {
        "id": 2,
        "category": "product_launch",
        "content": (
            "🎮 BONDING is live.\n\n"
            "A multiplayer molecular building game for father and children— "
            "separated by court order, united by geometry.\n\n"
            "62 molecules. 3 difficulty modes. Remote multiplayer via Cloudflare relay.\n\n"
            "Play at: https://bonding.p31ca.org\n\n"
            "#BONDING #MolecularBuilding #P31Labs"
        ),
    },
    {
        "id": 3,
        "category": "geometry",
        "content": (
            "📐 The K₄ is the simplest rigid structure.\n\n"
            "4 nodes. 6 edges. Tetrahedron. The foundation of all stable systems— "
            "from diamond crystals to social networks.\n\n"
            "K₄ density = 6 edges connecting 4 nodes.\n"
            "This is the minimum viable trust.\n\n"
            "#Tetrahedron #K4 #Geometry #Synergetics"
        ),
    },
    {
        "id": 4,
        "category": "publication",
        "content": (
            "📄 New publication: 'The Minimum Enclosing Structure: "
            "Tetrahedral Geometry as Universal Architecture'\n\n"
            "DOI: 10.5281/zenodo.19004485\n\n"
            "From quantum coherence to social resilience— "
            "the mathematics of why triangles are the strongest shape.\n\n"
            "#OpenScience #DOI #Zenodo #P31Labs"
        ),
    },
    {
        "id": 5,
        "category": "community",
        "content": (
            "💚 Every supporter is a node.\n\n"
            "4 nodes = first tetrahedron\n"
            "39 nodes = Posner molecule (Ca₉(PO₄)₆)\n"
            "863 nodes = Larmor frequency of ³¹P\n\n"
            "Join the mesh: ko-fi.com/trimtab69420\n\n"
            "#NodeCount #P31Delta #Phosphorus31"
        ),
    },
    {
        "id": 6,
        "category": "mission",
        "content": (
            "⚛️ P31 Labs: Open-source assistive technology for neurodivergent individuals.\n\n"
            "Founded by a DoD civilian engineer with AuDHD + hypoparathyroidism.\n"
            "Building tools that think geometrically.\n\n"
            "phosphorus31.org\n\n"
            "#AssistiveTech #AuDHD #OpenSource"
        ),
    },
]

# ================================================================================
# TWITTER API CLIENT
# ================================================================================

class P31TwitterClient:
    """Twitter API v2 client for P31 Labs messaging."""
    
    def __init__(self, config: dict):
        self.config = config
        self.client: Optional[tweepy.Client] = None
        self._authenticate()
    
    def _authenticate(self) -> None:
        """Authenticate with Twitter API v2 using Bearer Token and OAuth 1.0a."""
        # Check for credentials
        missing = []
        for key in ["bearer_token", "api_key", "api_secret", "access_token", "access_token_secret"]:
            if not self.config.get(key):
                missing.append(key)
        
        if missing:
            raise ValueError(
                f"Missing required Twitter credentials: {', '.join(missing)}\n"
                "Set environment variables or edit CONFIG in p31_transmitter.py"
            )
        
        # OAuth 1.0a for posting
        auth = tweepy.OAuth1UserHandler(
            self.config["api_key"],
            self.config["api_secret"],
            self.config["access_token"],
            self.config["access_token_secret"]
        )
        
        # App-only auth for reading (if needed later)
        app_auth = tweepy.AppAuthHandler(
            self.config["api_key"],
            self.config["api_secret"]
        )
        
        # Create API v2 client with OAuth 1.0a
        self.client = tweepy.Client(
            consumer_key=self.config["api_key"],
            consumer_secret=self.config["api_secret"],
            access_token=self.config["access_token"],
            access_token_secret=self.config["access_token_secret"],
            bearer_token=self.config["bearer_token"]
        )
        
        print("✓ Twitter API v2 client authenticated")
    
    def post_tweet(self, content: str) -> dict:
        """
        Post a single tweet.
        
        Args:
            content: The tweet text (max 280 characters)
            
        Returns:
            dict with status and response data
        """
        if not self.client:
            return {"success": False, "error": "Client not authenticated"}
        
        try:
            response = self.client.create_tweet(text=content)
            return {
                "success": True,
                "tweet_id": response.data["id"],
                "text": response.data["text"]
            }
        except tweepy.TooManyRequests:
            return {"success": False, "error": "Rate limited. Wait before posting again."}
        except tweepy.errors.Forbidden as e:
            return {"success": False, "error": f"Forbidden: {e}"}
        except Exception as e:
            return {"success": False, "error": str(e)}


# ================================================================================
# TRANSMITTER FUNCTIONS
# ================================================================================

def post_payload(client: Optional[P31TwitterClient], payload: dict, dry_run: bool = False) -> dict:
    """
    Post a single payload to Twitter.
    
    Args:
        client: Authenticated Twitter client (can be None in dry_run mode)
        payload: Dict with 'id' and 'content'
        dry_run: If True, only print what would be posted
        
    Returns:
        dict with success status and details
    """
    payload_id = payload.get("id", "unknown")
    content = payload.get("content", "")
    
    if not content:
        return {"success": False, "error": "Empty payload content"}
    
    # Check length (Twitter limit is 280 chars)
    if len(content) > 280:
        return {"success": False, "error": f"Content exceeds 280 chars ({len(content)})"}
    
    if dry_run:
        print(f"\n[DRY RUN] Payload #{payload_id}:")
        print(f"  {content[:100]}..." if len(content) > 100 else f"  {content}")
        print(f"  Length: {len(content)} chars")
        return {"success": True, "dry_run": True, "tweet_id": None}
    
    if client is None:
        return {"success": False, "error": "Client not available"}
    
    print(f"\n📤 Posting Payload #{payload_id}...")
    result = client.post_tweet(content)
    
    if result.get("success"):
        print(f"  ✓ Posted successfully!")
        print(f"    Tweet ID: {result.get('tweet_id')}")
    else:
        print(f"  ✗ Failed: {result.get('error')}")
    
    return result


def transmit_payloads(
    payloads: list,
    dry_run: bool = False,
    start_index: int = 0,
    stagger: bool = True
) -> dict:
    """
    Transmit multiple payloads with optional staggering.
    
    Args:
        payloads: List of payload dicts
        dry_run: If True, don't actually post
        start_index: Index of first payload to post
        stagger: If True, add delay between posts (commented out for safety)
        
    Returns:
        dict with overall transmission results
    """
    # Validate credentials first (unless dry run)
    client = None
    if not dry_run:
        try:
            client = P31TwitterClient(CONFIG)
        except ValueError as e:
            print(f"ERROR: {e}")
            return {"success": False, "error": str(e)}
    
    results = []
    total = len(payloads)
    
    print(f"\n{'='*60}")
    print(f"P31 TRANSMITTER - {'TEST MODE' if dry_run else 'LIVE MODE'}")
    print(f"{'='*60}")
    print(f"Total payloads: {total}")
    print(f"Starting at index: {start_index}")
    print(f"Staggering: {'Enabled' if stagger else 'Disabled'}")
    print(f"{'='*60}\n")
    
    for i, payload in enumerate(payloads[start_index:], start=start_index):
        result = post_payload(client, payload, dry_run=dry_run)
        results.append({
            "payload_id": payload.get("id"),
            "index": i,
            **result
        })
        
        # Stagger between posts (commented out for safety)
        # Twitter rate limits: 17 posts per 24 hours for most accounts
        if stagger and i < total - 1:
            wait_time = 60  # seconds between posts
            print(f"  ⏳ Waiting {wait_time}s before next post...")
            # time.sleep(wait_time)  # UNCOMMENT TO ENABLE STAGGERING
    
    # Summary
    successful = sum(1 for r in results if r.get("success"))
    failed = sum(1 for r in results if not r.get("success"))
    
    print(f"\n{'='*60}")
    print(f"TRANSMISSION COMPLETE")
    print(f"{'='*60}")
    print(f"Successful: {successful}/{len(results)}")
    print(f"Failed: {failed}/{len(results)}")
    
    return {
        "success": failed == 0,
        "total": len(results),
        "successful": successful,
        "failed": failed,
        "results": results
    }


# ================================================================================
# MAIN
# ================================================================================

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="P31 Social Media Transmitter - Twitter automation for P31 Labs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python p31_transmitter.py                  # Test mode - print payloads
  python p31_transmitter.py --post           # Post all payloads
  python p31_transmitter.py --post 0         # Post first payload only
  python p31_transmitter.py --post 2 --no-stagger  # Post from #2, no delay

Environment Variables:
  TWITTER_BEARER_TOKEN
  TWITTER_API_KEY
  TWITTER_API_SECRET
  TWITTER_ACCESS_TOKEN
  TWITTER_ACCESS_TOKEN_SECRET
        """
    )
    
    parser.add_argument(
        "--post",
        nargs="?",
        const=-1,
        type=int,
        help="Post tweets (default: test mode). Optional: specify starting index."
    )
    parser.add_argument(
        "--no-stagger",
        action="store_true",
        help="Disable staggered posting"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all payloads without posting"
    )
    
    args = parser.parse_args()
    
    # List mode
    if args.list:
        print("\n📋 AVAILABLE PAYLOADS\n")
        for p in PAYLOADS:
            print(f"  [{p['id']:2d}] {p['category']:15s} - {len(p['content'])} chars")
            preview = p['content'][:80].replace('\n', ' ')
            print(f"      {preview}...")
        print()
        return
    
    # Determine mode
    dry_run = args.post is None
    
    if dry_run:
        print("\n🔶 TEST MODE - No tweets will be posted\n")
        print("Use --post to actually post tweets")
        print("Use --list to see all payloads\n")
    
    # Determine start index
    start_index = 0
    if args.post is not None and args.post >= 0:
        start_index = args.post
    
    # Run transmission
    result = transmit_payloads(
        payloads=PAYLOADS,
        dry_run=dry_run,
        start_index=start_index,
        stagger=not args.no_stagger
    )
    
    # Exit with appropriate code
    sys.exit(0 if result.get("success") else 1)


if __name__ == "__main__":
    main()
