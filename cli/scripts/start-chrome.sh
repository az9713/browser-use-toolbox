#!/usr/bin/env bash
# Start Chrome with remote debugging enabled
# Usage: bash scripts/start-chrome.sh [port]

PORT="${1:-9222}"
PROFILE_DIR="${TMPDIR:-/tmp}/chrome-cdp-profile"

# Detect Chrome path
if [[ "$OSTYPE" == "darwin"* ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]] || [[ "$OSTYPE" == "cygwin" ]]; then
  # Git Bash / MSYS2 on Windows
  CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
  if [ ! -f "$CHROME" ]; then
    CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
  fi
  PROFILE_DIR="$LOCALAPPDATA/Temp/chrome-cdp-profile"
else
  # Linux
  CHROME="$(which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null)"
fi

if [ ! -f "$CHROME" ] && [ -z "$CHROME" ]; then
  echo "Error: Chrome not found. Set CHROME env var to your Chrome path."
  exit 1
fi

# Kill existing Chrome debug instances on this port
if command -v lsof &>/dev/null; then
  lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null
elif command -v netstat &>/dev/null; then
  # Windows Git Bash fallback
  netstat -ano 2>/dev/null | grep ":$PORT " | awk '{print $5}' | sort -u | xargs -I{} taskkill //PID {} //F 2>/dev/null
fi

mkdir -p "$PROFILE_DIR"

echo "Starting Chrome on port $PORT..."
echo "Profile: $PROFILE_DIR"

"$CHROME" \
  --remote-debugging-port=$PORT \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  &

sleep 2

# Verify
if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
  echo "Chrome is ready on port $PORT"
  curl -s "http://localhost:$PORT/json/version" | head -5
else
  echo "Warning: Chrome may not be ready yet. Check port $PORT."
fi
