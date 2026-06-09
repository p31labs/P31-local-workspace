# P31 Labs — Status update (Windows). Same contract as update-status.sh (CWP-043).
# Usage:
#   .\update-status.ps1
#   .\update-status.ps1 [path\to\status.json]
#   .\update-status.ps1 -EnvFile C:\path\to\env   # file containing COMMAND_CENTER_STATUS_TOKEN=...
# Token resolution (first match wins):
#   1) Environment variable COMMAND_CENTER_STATUS_TOKEN
#   2) -EnvFile path
#   3) Repo root .env.master (from git toplevel)

param(
  [string] $StatusFile = (Join-Path $PSScriptRoot 'status.json'),
  [string] $EnvFile = ''
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $StatusFile)) {
  Write-Error "Status file not found: $StatusFile"
}

$repoRoot = (& git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
  $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
}

$null = Get-Content -LiteralPath $StatusFile -Raw -Encoding UTF8 | ConvertFrom-Json

$token = [string] $env:COMMAND_CENTER_STATUS_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
  $envFile = if ($EnvFile -and (Test-Path -LiteralPath $EnvFile)) {
    $EnvFile
  } else {
    Join-Path $repoRoot '.env.master'
  }
  if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Error @"
No status token available.

Set the variable for this session:
  `$env:COMMAND_CENTER_STATUS_TOKEN = 'your-token-here'
  .\update-status.ps1

Or point at any env file that contains COMMAND_CENTER_STATUS_TOKEN=...:
  .\update-status.ps1 -EnvFile 'C:\path\to\your.env'

Default file (not found): $(Join-Path $repoRoot '.env.master')
"@
  }
  $tokenLine = Select-String -LiteralPath $envFile -Pattern '^COMMAND_CENTER_STATUS_TOKEN=' | Select-Object -First 1
  if (-not $tokenLine) { Write-Error "COMMAND_CENTER_STATUS_TOKEN not found in $envFile" }
  $token = ($tokenLine.Line -split '=', 2)[1].Trim()
}
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Error 'COMMAND_CENTER_STATUS_TOKEN is empty after trim.'
}

$body = Get-Content -LiteralPath $StatusFile -Raw -Encoding UTF8
$uri = 'https://command-center.trimtab-signal.workers.dev/api/status'

Write-Host "Pushing $StatusFile to command-center..."
$response = Invoke-WebRequest -Uri $uri -Method POST -UseBasicParsing `
  -Headers @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
  } -Body $body

if ($response.StatusCode -eq 200) {
  Write-Host "Status updated successfully"
  Write-Host "  Dashboard: https://command-center.trimtab-signal.workers.dev"
} else {
  Write-Error "Failed: HTTP $($response.StatusCode) $($response.Content)"
}
