# Patch @astrojs/react to export jsx-dev-runtime for Vite dev HMR
# This modifies the pnpm store copy (safe until next install)

$pkgPath = node -e @"
const p = require.resolve('@astrojs/react/package.json', { paths: ['C:\\Users\\sandra\\Documents\\P31_Andromeda\\04_SOFTWARE\\p31ca'] });
console.log(p);
"@

Write-Host "Found package.json at: $pkgPath"

# Read current package.json
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json

# Check if already patched
if ($pkg.exports.'./jsx-dev-runtime') {
    Write-Host "Already patched"
    exit 0
}

# Add the jsx-dev-runtime export (convert to ordered PSCustomObject for clean output)
$exports = [ordered]@{
    "." = $pkg.exports."."
    "./actions" = $pkg.exports."./actions"
    "./client.js" = $pkg.exports."./client.js"
    "./client-v17.js" = $pkg.exports."./client-v17.js"
    "./server.js" = $pkg.exports."./server.js"
    "./server-v17.js" = $pkg.exports."./server-v17.js"
    "./jsx-dev-runtime" = "./dist/jsx-dev-runtime.js"
    "./jsx-runtime" = $pkg.exports."./jsx-runtime"
    "./package.json" = $pkg.exports."./package.json"
}
$pkg.exports = $exports

# Write back
$pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath
Write-Host "Patched exports map"

# Write the dist file
$distPath = $pkgPath -replace 'package\.json$', 'dist/jsx-dev-runtime.js'
@"
export { jsx, jsxs, jsxDEV, Fragment } from "react/jsx-dev-runtime";
"@ | Set-Content $distPath -NoNewline
Write-Host "Wrote dist file: $distPath"
