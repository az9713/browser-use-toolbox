#!/usr/bin/env bash
# Start Chrome with remote debugging enabled
#
# Usage:
#   bash scripts/start-chrome.sh                    # Fresh temp profile
#   bash scripts/start-chrome.sh --profile           # Your REAL Chrome profile (Gmail, X, etc. already logged in)
#   bash scripts/start-chrome.sh --profile-dir PATH  # Custom profile directory
#   bash scripts/start-chrome.sh --port 9333         # Custom port
#
# Options:
#   --profile          Use your real Chrome profile (must close Chrome first!)
#   --profile-dir DIR  Use a specific profile directory
#   --port PORT        Remote debugging port (default: 9222)
#   --headless         Run headless (no visible window)

PORT=9222
PROFILE_DIR=""
USE_REAL_PROFILE=false
HEADLESS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      USE_REAL_PROFILE=true
      shift
      ;;
    --profile-dir)
      PROFILE_DIR="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --headless)
      HEADLESS=true
      shift
      ;;
    *)
      # Legacy: first positional arg is port
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        PORT="$1"
      fi
      shift
      ;;
  esac
done

# Detect Chrome path
if [[ "$OSTYPE" == "darwin"* ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  REAL_PROFILE_DIR="$HOME/Library/Application Support/Google/Chrome"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]] || [[ "$OSTYPE" == "cygwin" ]]; then
  # Git Bash / MSYS2 on Windows
  CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
  if [ ! -f "$CHROME" ]; then
    CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
  fi
  REAL_PROFILE_DIR="$LOCALAPPDATA/Google/Chrome/User Data"
else
  # Linux
  CHROME="$(which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null)"
  REAL_PROFILE_DIR="$HOME/.config/google-chrome"
fi

if [ ! -f "$CHROME" ] && [ -z "$CHROME" ]; then
  echo "Error: Chrome not found. Set CHROME env var to your Chrome path."
  exit 1
fi

# Determine profile directory
if [ -n "$PROFILE_DIR" ]; then
  # Explicit profile dir provided
  :
elif [ "$USE_REAL_PROFILE" = true ]; then
  PROFILE_DIR="$REAL_PROFILE_DIR"
else
  # Default: temp profile
  if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    PROFILE_DIR="$LOCALAPPDATA/Temp/chrome-cdp-profile"
  else
    PROFILE_DIR="${TMPDIR:-/tmp}/chrome-cdp-profile"
  fi
fi

# If using real profile, warn that Chrome must be closed first
if [ "$USE_REAL_PROFILE" = true ]; then
  echo "============================================"
  echo "  USING YOUR REAL CHROME PROFILE"
  echo "============================================"
  echo ""
  echo "IMPORTANT: You must close ALL Chrome windows"
  echo "first! Chrome only allows one instance per"
  echo "profile directory."
  echo ""
  echo "Profile: $PROFILE_DIR"
  echo ""
  echo "This will give the CLI access to your logged-in"
  echo "sessions (Gmail, X/Twitter, GitHub, etc.)"
  echo "============================================"
  echo ""
  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Kill existing Chrome debug instances on this port
if command -v lsof &>/dev/null; then
  lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null
elif command -v netstat &>/dev/null; then
  # Windows Git Bash fallback
  netstat -ano 2>/dev/null | grep ":$PORT " | awk '{print $5}' | sort -u | xargs -I{} taskkill //PID {} //F 2>/dev/null
fi

mkdir -p "$PROFILE_DIR" 2>/dev/null

echo "Starting Chrome on port $PORT..."
echo "Profile: $PROFILE_DIR"
if [ "$USE_REAL_PROFILE" = true ]; then
  echo "Mode: REAL PROFILE (logged-in sessions available)"
else
  echo "Mode: Temp profile (clean session)"
fi

# Build Chrome flags
CHROME_FLAGS=(
  "--remote-debugging-port=$PORT"
  "--user-data-dir=$PROFILE_DIR"
  "--no-first-run"
  "--no-default-browser-check"
  "--disable-background-timer-throttling"
  "--disable-backgrounding-occluded-windows"
  "--disable-renderer-backgrounding"
)

if [ "$HEADLESS" = true ]; then
  CHROME_FLAGS+=("--headless=new")
fi

# Launch Chrome
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]] || [[ "$OSTYPE" == "cygwin" ]]; then
  # On Windows/Git Bash, use PowerShell to properly detach Chrome
  ARGS=$(printf "'%s'," "${CHROME_FLAGS[@]}")
  ARGS="${ARGS%,}"  # Remove trailing comma
  powershell.exe -Command "Start-Process '$CHROME' -ArgumentList $ARGS" &
else
  "$CHROME" "${CHROME_FLAGS[@]}" &
fi

sleep 3

# Verify
if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
  echo ""
  echo "Chrome is ready on port $PORT"
  curl -s "http://localhost:$PORT/json/version" | head -5
  echo ""
  echo "You can now use the CLI:"
  echo "  node dist/browser.js list"
  echo "  node dist/browser.js open https://mail.google.com"
else
  echo "Warning: Chrome may not be ready yet. Check port $PORT."
fi
