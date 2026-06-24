#!/bin/bash
set -e
npm run build
npx wrangler pages deploy dist --project-name phosphorus31-org --branch=main --commit-dirty=true
