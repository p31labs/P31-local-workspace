#!/usr/bin/env bash
# yaml-parser.sh — Pure-Bash YAML Section Extractor
# P31 CWP-006: Shelf Manifest Viewer
#
# Provides minimal YAML parsing for flat, 2-space indented structures.
# No Python, Perl, Ruby, or external parsers. POSIX awk/sed/grep only.
#
# Functions:
#   yaml_get_section <file> <section_name>  — prints lines under a top-level section
#   yaml_get_value <file> <section> <key>   — prints first matching value for a key
#   yaml_list_sections <file>               — prints top-level section names
#
# Exit codes:
#   0  Success
#   1  File not found
#   2  Parse error

set -euo pipefail

YAML_PARSER_VERSION="1.0.0"

yaml_get_section() {
  local file="$1"
  local section="$2"

  if [[ ! -f "$file" ]]; then
    echo "ERROR: file not found: $file" >&2
    return 1
  fi

  # Extract lines under a top-level YAML section (e.g., "shelf:")
  # Matches the section header and all indented child lines until the next
  # top-level key (no indent, starts with a letter/underscore).
  awk -v sec="$section" '
    BEGIN { in_section=0 }
    # Match the target section (optional leading spaces, then exact name, then colon)
    $0 ~ "^[[:space:]]*" sec ":" { in_section=1; next }
    # If we are in the section and see an unindented key, stop
    in_section && /^[[:space:]]*[a-zA-Z_]/ && !/^[[:space:]]{2,}/ { in_section=0 }
    # Print lines while inside the section
    in_section { print }
  ' "$file"
}

yaml_get_value() {
  local file="$1"
  local section="$2"
  local key="$3"

  if [[ ! -f "$file" ]]; then
    echo "ERROR: file not found: $file" >&2
    return 1
  fi

  # Get the section, then extract the first matching key value
  yaml_get_section "$file" "$section" | \
    sed -n "s/^[[:space:]]*${key}[[:space:]]*:[[:space:]]*//p" | \
    head -1 | \
    sed 's/^"//;s/"$//' | \
    xargs 2>/dev/null || true
}

yaml_list_sections() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    echo "ERROR: file not found: $file" >&2
    return 1
  fi

  # Print all top-level section names (lines starting at column 0 with a word + colon)
  grep -E '^[a-zA-Z_][a-zA-Z0-9_-]*:' "$file" | sed 's/:.*//' | sort -u
}

# Self-test when run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "yaml-parser.sh v${YAML_PARSER_VERSION}"
  echo "Functions: yaml_get_section, yaml_get_value, yaml_list_sections"
  echo "Usage: source $0"
fi
