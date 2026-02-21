# Start Chrome with remote debugging enabled
# Usage: .\scripts\start-chrome.ps1 [-Port 9222]

param(
    [int]$Port = 9222
)

$ProfileDir = Join-Path $env:TEMP "chrome-cdp-profile"

# Find Chrome
$ChromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$Chrome = $null
foreach ($p in $ChromePaths) {
    if (Test-Path $p) {
        $Chrome = $p
        break
    }
}

if (-not $Chrome) {
    Write-Error "Chrome not found. Install Chrome or set path manually."
    exit 1
}

# Kill existing debug instances
$existing = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($existing) {
    $existing | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

if (-not (Test-Path $ProfileDir)) {
    New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
}

Write-Host "Starting Chrome on port $Port..."
Write-Host "Profile: $ProfileDir"

Start-Process -FilePath $Chrome -ArgumentList @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=$ProfileDir",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding"
)

Start-Sleep -Seconds 2

# Verify
try {
    $response = Invoke-RestMethod -Uri "http://localhost:$Port/json/version" -ErrorAction Stop
    Write-Host "Chrome is ready on port $Port"
    Write-Host "Browser: $($response.Browser)"
} catch {
    Write-Warning "Chrome may not be ready yet. Check port $Port."
}
