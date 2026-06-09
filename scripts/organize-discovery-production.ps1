# One-time organizer for Discovery_Production_2025CV936 — run from repo root:
#   powershell -ExecutionPolicy Bypass -File scripts/organize-discovery-production.ps1

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') 'Discovery_Production_2025CV936')).Path

$comp = Join-Path $root 'compliance'
$hand = Join-Path $root 'handoff'
$k4 = Join-Path (Join-Path $root 'tooling') 'k4-cage-misplaced'
New-Item -ItemType Directory -Force -Path @($comp, $hand, $k4) | Out-Null

function Move-IfExists {
  param([string]$Name, [string]$DestDir)
  $src = Join-Path $root $Name
  if (Test-Path -LiteralPath $src) {
    Move-Item -LiteralPath $src -Destination $DestDir -Force
    Write-Host "Moved $Name -> $DestDir"
  }
}

Move-IfExists 'COMPLIANCE_INSTRUCTIONS.md' $comp
Move-IfExists 'PHYSICAL_MEDIA_SERVICE_PROTOCOL.md' $comp
Move-IfExists 'EMAIL_TEMPLATE.txt' $comp
Move-IfExists 'P31_HEARING_OPS_SYNTHESIS.md' $hand
Move-IfExists 'NEW_CHAT_CONTEXT_PROMPT.md' $hand
Move-IfExists 'POCKET_CARD_MAINTENANCE.md' $hand
Move-IfExists 'pocket-card.html' $hand
Move-IfExists 'pocket-card (1).html' $hand
Move-IfExists 'hearing_prep.jsx' $hand
Move-IfExists 'index.js' $k4
Move-IfExists 'wrangler.toml' $k4
Move-IfExists 'deploy.sh' $k4

Get-ChildItem -LiteralPath $root -Filter 'compass_artifact*.md' -File -ErrorAction SilentlyContinue | ForEach-Object {
  Move-Item -LiteralPath $_.FullName -Destination $hand -Force
  Write-Host "Moved $($_.Name) -> handoff"
}

Write-Host 'Done.'
