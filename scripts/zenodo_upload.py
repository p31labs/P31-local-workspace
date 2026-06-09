#!/usr/bin/env python3
"""
Zenodo File Upload Script for P31 Labs

Uploads files to Zenodo using their API. Supports markdown and docx files.

Usage:
    python zenodo_upload.py --file path/to/file.md --title "Title" --description "Description" --creators "Name1,Name2" --keywords "keyword1,keyword2"
    
    Or with a config file:
    python zenodo_upload.py --config config.json

Examples:
    python zenodo_upload.py --file "docs/research.md" --title "Research Paper" --description "My research"
    python zenodo_upload.py --file "The_Minimum_Enclosing_Structure_P31_Labs_2026.docx" --title "Minimum Enclosing Structure"
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

import requests

# Zenodo API endpoints
ZENODO_API_URL = "https://zenodo.org/api"
ZENODO_SANDBOX_URL = "https://sandbox.zenodo.org/api"

# Default timeout for requests
REQUEST_TIMEOUT = 60


class ZenodoUploader:
    """Handles file uploads to Zenodo."""
    
    def __init__(self, api_token: str, use_sandbox: bool = False):
        """
        Initialize the Zenodo uploader.
        
        Args:
            api_token: Zenodo API token (personal access token)
            use_sandbox: Whether to use Zenodo sandbox (for testing)
        """
        self.api_token = api_token
        self.base_url = ZENODO_SANDBOX_URL if use_sandbox else ZENODO_API_URL
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        })
    
    def create_deposition(self, metadata: dict) -> Optional[dict]:
        """
        Create a new deposition on Zenodo.
        
        Args:
            metadata: Deposition metadata (title, description, creators, etc.)
            
        Returns:
            Deposition object with file upload URL, or None on error
        """
        url = f"{self.base_url}/deposit/depositions"
        
        # Build the deposition payload
        payload = {
            "metadata": metadata
        }
        
        try:
            response = self.session.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error creating deposition: {e}", file=sys.stderr)
            if e.response.status_code == 401:
                print("Error: Invalid API token. Please check your Zenodo API token.", file=sys.stderr)
            elif e.response.status_code == 403:
                print("Error: Forbidden. Your token may not have the required permissions.", file=sys.stderr)
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error creating deposition: {e}", file=sys.stderr)
            return None
    
    def upload_file(self, deposition_id: int, file_path: str) -> Optional[dict]:
        """
        Upload a file to an existing deposition.
        
        Args:
            deposition_id: The deposition ID
            file_path: Path to the file to upload
            
        Returns:
            File metadata, or None on error
        """
        url = f"{self.base_url}/deposit/depositions/{deposition_id}/files"
        
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}", file=sys.stderr)
            return None
        
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        print(f"Uploading: {file_name} ({file_size:,} bytes)")
        
        # For large files, use chunked upload
        if file_size > 100 * 1024 * 1024:  # > 100MB
            return self._upload_large_file(deposition_id, file_path)
        
        try:
            with open(file_path, "rb") as f:
                files = {"file": (file_name, f)}
                # Don't set Content-Type for file uploads - let requests do it
                response = self.session.post(
                    url,
                    files=files,
                    timeout=REQUEST_TIMEOUT * 2
                )
                response.raise_for_status()
                return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error uploading file: {e}", file=sys.stderr)
            try:
                error_data = e.response.json()
                print(f"Error details: {error_data}", file=sys.stderr)
            except:
                pass
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error uploading file: {e}", file=sys.stderr)
            return None
    
    def _upload_large_file(self, deposition_id: int, file_path: str) -> Optional[dict]:
        """
        Upload a large file using chunked upload.
        
        Args:
            deposition_id: The deposition ID
            file_path: Path to the file to upload
            
        Returns:
            File metadata, or None on error
        """
        url = f"{self.base_url}/deposit/depositions/{deposition_id}/files"
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        try:
            # Initialize upload
            init_response = self.session.post(
                url,
                json={"filename": file_name, "filesize": file_size},
                headers={"Content-Type": "application/json"},
                timeout=REQUEST_TIMEOUT
            )
            init_response.raise_for_status()
            init_data = init_response.json()
            
            upload_url = init_data.get("links", {}).get("self")
            if not upload_url:
                # Fallback to standard upload for smaller files or if chunked not supported
                return self.upload_file(deposition_id, file_path)
            
            # Upload in chunks
            chunk_size = 5 * 1024 * 1024  # 5MB chunks
            with open(file_path, "rb") as f:
                offset = 0
                while offset < file_size:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    
                    # Upload chunk
                    chunk_response = self.session.put(
                        upload_url,
                        headers={
                            "Content-Range": f"bytes {offset}-{offset + len(chunk) - 1}/{file_size}",
                            "Content-Type": "application/octet-stream"
                        },
                        data=chunk,
                        timeout=REQUEST_TIMEOUT
                    )
                    chunk_response.raise_for_status()
                    offset += len(chunk)
                    progress = (offset / file_size) * 100
                    print(f"  Upload progress: {progress:.1f}%", end="\r")
            
            print()  # New line after progress
            return init_data
            
        except requests.exceptions.RequestException as e:
            print(f"Error in large file upload: {e}", file=sys.stderr)
            return None
    
    def publish_deposition(self, deposition_id: int) -> Optional[dict]:
        """
        Publish a deposition to make it publicly visible.
        
        Args:
            deposition_id: The deposition ID
            
        Returns:
            Published deposition object, or None on error
        """
        url = f"{self.base_url}/deposit/depositions/{deposition_id}/actions/publish"
        
        try:
            response = self.session.post(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error publishing deposition: {e}", file=sys.stderr)
            return None
    
    def upload_and_publish(
        self,
        file_path: str,
        title: str,
        description: str,
        creators: list,
        keywords: Optional[list] = None,
        publish: bool = True
    ) -> Optional[dict]:
        """
        Complete workflow: create deposition, upload file, optionally publish.
        
        Args:
            file_path: Path to the file to upload
            title: Title of the deposition
            description: Description of the work
            creators: List of creator names
            keywords: Optional list of keywords
            publish: Whether to publish immediately
            
        Returns:
            Final deposition object, or None on error
        """
        # Build metadata
        metadata = {
            "title": title,
            "description": description,
            "creators": [{"name": creator} for creator in creators],
            "keywords": keywords or [],
            "publication_type": "article",
            "access_right": "open"
        }
        
        print(f"\n{'='*50}")
        print(f"Uploading to Zenodo")
        print(f"File: {file_path}")
        print(f"Title: {title}")
        print(f"Creators: {', '.join(creators)}")
        print(f"{'='*50}\n")
        
        # Step 1: Create deposition
        print("Creating deposition...")
        deposition = self.create_deposition(metadata)
        if not deposition:
            return None
        
        deposition_id = deposition.get("id")
        if deposition_id is None:
            print("Error: Could not get deposition ID from response", file=sys.stderr)
            return None
        print(f"Deposition created: ID {deposition_id}")
        
        # Step 2: Upload file
        print("Uploading file...")
        file_result = self.upload_file(deposition_id, file_path)
        if not file_result:
            return None
        
        file_result_id = file_result.get("id") if isinstance(file_result, dict) else None
        print(f"File uploaded successfully: {file_result.get('filename') if isinstance(file_result, dict) else 'unknown'}")
        
        # Step 3: Publish (optional)
        if publish:
            print("Publishing deposition...")
            # Add a small delay to ensure file is processed
            time.sleep(1)
            final_deposition = self.publish_deposition(deposition_id)
            if final_deposition:
                doi = final_deposition.get("metadata", {}).get("doi")
                print(f"\n{'='*50}")
                print(f"SUCCESS! Deposition published!")
                print(f"DOI: {doi}")
                print(f"URL: https://zenodo.org/record/{deposition_id}")
                print(f"{'='*50}")
                return final_deposition
            else:
                print("Warning: File uploaded but publication failed.", file=sys.stderr)
                print(f"You can manually publish at: https://zenodo.org/deposit/{deposition_id}")
                return deposition
        else:
            print(f"\nDeposition created (not published): https://zenodo.org/deposit/{deposition_id}")
            return deposition


def parse_creators(creators_str: str) -> list:
    """Parse creators from comma-separated string."""
    return [c.strip() for c in creators_str.split(",") if c.strip()]


def parse_keywords(keywords_str: str) -> list:
    """Parse keywords from comma-separated string."""
    return [k.strip() for k in keywords_str.split(",") if k.strip()]


def load_config(config_path: str) -> dict:
    """Load configuration from JSON file."""
    with open(config_path, "r") as f:
        return json.load(f)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Upload files to Zenodo",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    %(prog)s --file research.md --title "My Research" --description "Research paper" --creators "John Doe,Jane Smith"
    %(prog)s --file paper.docx --title "Paper Title" --description "Description" --creators "Author Name" --keywords "physics,quantum"
    %(prog)s --config config.json
    
Config file format (JSON):
    {
        "api_token": "your-zenodo-token",
        "use_sandbox": false,
        "files": [
            {
                "path": "file1.md",
                "title": "Title 1",
                "description": "Description 1",
                "creators": ["Author 1"],
                "keywords": ["keyword1"]
            }
        ]
    }
        """
    )
    
    # Main arguments
    parser.add_argument(
        "--file", "-f",
        help="Path to the file to upload"
    )
    parser.add_argument(
        "--title", "-t",
        help="Title of the deposition"
    )
    parser.add_argument(
        "--description", "-d",
        help="Description of the work"
    )
    parser.add_argument(
        "--creators", "-c",
        help="Comma-separated list of creator names"
    )
    parser.add_argument(
        "--keywords", "-k",
        help="Comma-separated list of keywords"
    )
    
    # Authentication
    parser.add_argument(
        "--token",
        help="Zenodo API token (or set ZENODO_TOKEN env variable)"
    )
    parser.add_argument(
        "--sandbox", "-s",
        action="store_true",
        help="Use Zenodo sandbox (for testing)"
    )
    
    # Options
    parser.add_argument(
        "--config", "-cfg",
        help="Path to JSON config file"
    )
    parser.add_argument(
        "--no-publish",
        action="store_true",
        help="Create deposition but don't publish"
    )
    
    args = parser.parse_args()
    
    # Get API token from args or environment
    api_token = args.token or os.environ.get("ZENODO_TOKEN")
    if not api_token:
        print("Error: API token required. Use --token or set ZENODO_TOKEN environment variable.", file=sys.stderr)
        print("\nTo get a Zenodo API token:")
        print("  1. Go to https://zenodo.org/account/settings/applications/tokens/new/")
        print("  2. Create a new token with 'deposit:write' scope")
        print("  3. Copy the token and use it with --token or set ZENODO_TOKEN")
        sys.exit(1)
    
    # Load from config file if provided
    if args.config:
        try:
            config = load_config(args.config)
            uploader = ZenodoUploader(
                api_token=config.get("api_token", api_token),
                use_sandbox=config.get("use_sandbox", args.sandbox)
            )
            
            for file_config in config.get("files", []):
                uploader.upload_and_publish(
                    file_path=file_config["path"],
                    title=file_config["title"],
                    description=file_config.get("description", ""),
                    creators=file_config.get("creators", []),
                    keywords=file_config.get("keywords"),
                    publish=not args.no_publish
                )
            return
        except FileNotFoundError:
            print(f"Error: Config file not found: {args.config}", file=sys.stderr)
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in config file: {e}", file=sys.stderr)
            sys.exit(1)
        except KeyError as e:
            print(f"Error: Missing required field in config: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Validate required arguments for single file upload
    if not args.file:
        parser.error("--file is required (or use --config)")
    if not args.title:
        parser.error("--title is required (or use --config)")
    if not args.creators:
        parser.error("--creators is required (or use --config)")
    
    # Parse creators and keywords
    creators = parse_creators(args.creators)
    keywords = parse_keywords(args.keywords) if args.keywords else []
    
    # Create uploader and upload
    uploader = ZenodoUploader(api_token=api_token, use_sandbox=args.sandbox)
    
    result = uploader.upload_and_publish(
        file_path=args.file,
        title=args.title,
        description=args.description or "",
        creators=creators,
        keywords=keywords,
        publish=not args.no_publish
    )
    
    if not result:
        print("\nUpload failed. Please check the errors above.", file=sys.stderr)
        sys.exit(1)
    
    print("\nDone!")


if __name__ == "__main__":
    main()
