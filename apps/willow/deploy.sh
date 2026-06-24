#!/bin/bash
set -e
npm run build
npx wrangler pages deploy dist --project-name willow --branch=main --commit-dirty=true
