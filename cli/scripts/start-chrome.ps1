# Start Chrome with remote debugging enabled
#
# Usage:
#   .\scripts\start-chrome.ps1                          # Fresh temp profile
#   .\scripts\start-chrome.ps1 -Profile                  # Your REAL Chrome profile (Gmail, X, etc.)
#   .\scripts\start-chrome.ps1 -ProfileDir "C:\my\prof"  # Custom profile directory
#   .\scripts\start-chrome.ps1 -Port 9333                # Custom port
#
# Options:
#   -Profile          Use your real Chrome profile (must close Chrome first!)
#   -ProfileDir DIR   Use a specific profile directory
#   -Port PORT        Remote debugging port (default: 9222)
#   -Headless         Run headless (no visible window)

param(
    [int]$Port = 9222,
    [switch]$Profile,
    [string]$ProfileDir = "",
    [switch]$Headless
)

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

# Determine the real Chrome profile path
$RealProfileDir = "$env:LOCALAPPDATA\Google\Chrome\User Data"

# Determine which profile to use
if ($ProfileDir -ne "") {
    # Explicit profile dir provided
} elseif ($Profile) {
    $ProfileDir = $RealProfileDir
} else {
    # Default: temp profile
    $ProfileDir = Join-Path $env:TEMP "chrome-cdp-profile"
}

# If using real profile, warn the user
if ($Profile) {
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host "  USING YOUR REAL CHROME PROFILE" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANT: You must close ALL Chrome windows"
    Write-Host "first! Chrome only allows one instance per"
    Write-Host "profile directory."
    Write-Host ""
    Write-Host "Profile: $ProfileDir"
    Write-Host ""
    Write-Host "This will give the CLI access to your logged-in"
    Write-Host "sessions (Gmail, X/Twitter, GitHub, etc.)"
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Continue? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Aborted."
        exit 0
    }
}

# Kill existing debug instances on this port
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
if ($Profile) {
    Write-Host "Mode: REAL PROFILE (logged-in sessions available)" -ForegroundColor Green
} else {
    Write-Host "Mode: Temp profile (clean session)"
}

# Build Chrome flags
$ChromeArgs = @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=$ProfileDir",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding"
)

if ($Headless) {
    $ChromeArgs += "--headless=new"
}

Start-Process -FilePath $Chrome -ArgumentList $ChromeArgs

Start-Sleep -Seconds 3

# Verify
try {
    $response = Invoke-RestMethod -Uri "http://localhost:$Port/json/version" -ErrorAction Stop
    Write-Host ""
    Write-Host "Chrome is ready on port $Port" -ForegroundColor Green
    Write-Host "Browser: $($response.Browser)"
    Write-Host ""
    Write-Host "You can now use the CLI:"
    Write-Host "  node dist/browser.js list"
    Write-Host "  node dist/browser.js open https://mail.google.com"
} catch {
    Write-Warning "Chrome may not be ready yet. Check port $Port."
}
