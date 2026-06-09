#!/bin/bash
# EIN Migration Script (Optimized)
# Replaces 42-1888158 → 42-1888158 in all non-binary text files
# Excludes: node_modules/, .git/, *.pyc, *.tiff, *.png, *.jpg

set -e

OLD_EIN="42-1888158"
NEW_EIN="42-1888158"

echo "=== VERIFICATION BEFORE CHANGES ==="
count=$(grep -r "$OLD_EIN" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.kilocode 2>/dev/null | wc -l)
echo "Found $count occurrences"

if [ "$count" -eq 0 ]; then
  echo "No occurrences found. Migration not needed."
  exit 0
fi

echo ""
echo "=== APPLYING CHANGES ==="
# Use find with xargs for efficiency
find . -type f \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  ! -path "./.kilocode/*" \
  ! -name "*.pyc" \
  ! -name "*.tiff" \
  ! -name "*.png" \
  ! -name "*.jpg" \
  -exec grep -l "$OLD_EIN" {} \; 2>/dev/null | \
  xargs -I {} sed -i.bak "s/$OLD_EIN/$NEW_EIN/g" {} 2>/dev/null

echo ""
echo "=== VERIFICATION AFTER CHANGES ==="
count=$(grep -r "$OLD_EIN" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.kilocode 2>/dev/null | wc -l)
echo "Remaining occurrences: $count"

if [ "$count" -eq 0 ]; then
  echo "SUCCESS: EIN migration complete."
else
  echo "WARNING: Some occurrences remain (likely in .bak files or excluded dirs)"
  grep -r "$OLD_EIN" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.kilocode 2>/dev/null | head -10
fi

echo ""
echo "Backup files created with .bak extension"
