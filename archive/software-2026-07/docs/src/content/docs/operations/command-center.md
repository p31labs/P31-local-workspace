---
title: Command Center
description: Fleet status JSON in KV
---

The **Command Center** worker exposes a dashboard and **POST** API for `status.json` used by the operator pocket card and health pings.

**URL:** `https://command-center.trimtab-signal.workers.dev`

**Repo:** `software/cloudflare-worker/command-center/`

**Update status (local):** from `command-center/`, run `update-status.ps1` (Windows) or `update-status.sh` (Git Bash), or POST JSON to `/api/status` with `Authorization: Bearer <COMMAND_CENTER_STATUS_TOKEN>` (from repo-root `.env.master`, never commit).

Canonical JSON file: `status.json` next to the worker source.
