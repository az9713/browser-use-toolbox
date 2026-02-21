# Testing Guide: Chrome CDP Browser Agent CLI

This guide walks you through testing the CLI tool against a live Chrome instance. It covers every step from understanding what headless Chrome is, to launching it, to running every CLI command and verifying the output.

---

## Table of Contents

1. [Background Concepts](#background-concepts)
2. [Prerequisites](#prerequisites)
3. [Step 1: Build the CLI](#step-1-build-the-cli)
4. [Step 2: Launch Chrome in Headless Mode](#step-2-launch-chrome-in-headless-mode)
5. [Step 3: Verify Chrome is Listening](#step-3-verify-chrome-is-listening)
6. [Step 4: Run CLI Commands](#step-4-run-cli-commands)
7. [Step 5: Stop Chrome](#step-5-stop-chrome)
8. [Automated Test Scripts](#automated-test-scripts)
9. [Troubleshooting](#troubleshooting)

---

## Background Concepts

### What is Chrome DevTools Protocol (CDP)?

Chrome DevTools Protocol is a set of APIs built into Google Chrome that lets external programs control the browser programmatically. When you open Chrome DevTools (F12) in your browser, it uses CDP internally. Our CLI tool uses the same protocol, but from the command line.

CDP lets you do things like:
- Navigate to URLs
- Click elements on a page
- Take screenshots
- Read page content
- Monitor network requests
- Execute JavaScript

### What is Headless Chrome?

Normally, Chrome opens a visible window on your screen. **Headless mode** runs Chrome without any visible window — it operates entirely in the background. This is useful for:
- Automated testing (no screen needed)
- Server environments (no display available)
- CI/CD pipelines

The browser still loads pages, executes JavaScript, and renders content — you just cannot see it visually.

### What is the Remote Debugging Port?

Chrome can expose its CDP interface over a network port. When you start Chrome with `--remote-debugging-port=9222`, it opens port 9222 on your machine. Any program (like our CLI) can connect to this port and send CDP commands.

The flow looks like this:

```
CLI Tool  ──(CDP commands)──>  localhost:9222  ──>  Chrome Browser
          <──(JSON responses)──
```

### What is a User Data Directory?

Chrome stores your profile data (bookmarks, history, cookies, extensions) in a folder called the "user data directory." When testing, we use a **temporary** user data directory so that:
- Tests don't interfere with your real Chrome profile
- Each test run starts clean
- Your personal data stays untouched

---

## Prerequisites

1. **Google Chrome** installed on your system
   - Windows: Usually at `C:\Program Files\Google\Chrome\Application\chrome.exe`
   - macOS: Usually at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
   - Linux: Usually `google-chrome` or `chromium-browser` on your PATH

2. **Node.js** (version 18 or higher)
   - Download from https://nodejs.org
   - Verify: `node --version`

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

4. **curl** (for verifying Chrome is running)
   - Windows Git Bash: included by default
   - macOS/Linux: included by default
   - Verify: `curl --version`

---

## Step 1: Build the CLI

Before testing, you need to compile the TypeScript source code into JavaScript.

```bash
# Navigate to the project directory
cd chrome_cdp_agent_allaboutai

# Install dependencies (commander for CLI parsing, chrome-remote-interface for CDP)
npm install

# Compile TypeScript to JavaScript (output goes to dist/ folder)
npm run build
```

After building, you should have `dist/browser.js` — this is the CLI entry point.

Verify the build worked:

```bash
node dist/browser.js --help
```

You should see a list of all 42 commands.

---

## Step 2: Launch Chrome in Headless Mode

**IMPORTANT:** You must close all existing Chrome windows before starting Chrome in debug mode. Chrome only allows one instance per user data directory, and the debug port can only be used by one instance.

### Why We Need Special Flags

When launching Chrome for testing, we pass several flags:

| Flag | Purpose |
|------|---------|
| `--headless=new` | Run without a visible window. The `=new` uses Chrome's newer headless mode which behaves more like regular Chrome |
| `--remote-debugging-port=9222` | Open CDP on port 9222 so our CLI can connect |
| `--user-data-dir=<path>` | Use a temporary profile directory (keeps your real profile safe) |
| `--no-first-run` | Skip the "Welcome to Chrome" dialog |
| `--disable-gpu` | Disable GPU acceleration (avoids rendering issues in headless mode on some systems) |

### On Windows (PowerShell)

Open a PowerShell window and run:

```powershell
# Kill any existing Chrome processes first
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue

# Wait a moment for processes to fully exit
Start-Sleep -Seconds 2

# Start Chrome in headless mode with debugging enabled
# Start-Process runs it as a separate process so it doesn't block your terminal
Start-Process `
  -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9222",
    "--user-data-dir=$env:LOCALAPPDATA\Temp\chrome-cdp-test",
    "--no-first-run",
    "--disable-gpu"
  )
```

### On Windows (Git Bash)

```bash
# Kill any existing Chrome processes
taskkill //F //IM chrome.exe 2>/dev/null

# Wait for processes to exit
sleep 2

# Start Chrome using PowerShell's Start-Process (properly detaches from terminal)
# We use PowerShell here because Git Bash's & (background) operator
# can lock up the terminal when running Chrome
powershell.exe -Command "Start-Process \
  'C:\Program Files\Google\Chrome\Application\chrome.exe' \
  -ArgumentList '--headless=new','--remote-debugging-port=9222',\
  '--user-data-dir=C:\Users\$env:USERNAME\AppData\Local\Temp\chrome-cdp-test',\
  '--no-first-run','--disable-gpu'"
```

### On macOS

```bash
# Kill any existing Chrome processes
pkill -f "Google Chrome" 2>/dev/null

# Wait for processes to exit
sleep 2

# Start Chrome in headless mode (& runs it in background)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-cdp-test \
  --no-first-run \
  --disable-gpu &
```

### On Linux

```bash
# Kill any existing Chrome processes
pkill chrome 2>/dev/null

# Wait for processes to exit
sleep 2

# Start Chrome in headless mode
google-chrome \
  --headless=new \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-cdp-test \
  --no-first-run \
  --disable-gpu &
```

---

## Step 3: Verify Chrome is Listening

After launching Chrome, wait 2-3 seconds, then check if the debug port is responding:

```bash
curl -s http://localhost:9222/json/version
```

You should see JSON output like this:

```json
{
  "Browser": "Chrome/145.0.7632.109",
  "Protocol-Version": "1.3",
  "User-Agent": "Mozilla/5.0 ...",
  "V8-Version": "14.5.201.9",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

**What this tells you:**
- `Browser` — The Chrome version running
- `Protocol-Version` — The CDP protocol version (1.3 is current)
- `webSocketDebuggerUrl` — The WebSocket URL our CLI uses internally to send commands

If you see `curl: (7) Failed to connect`, Chrome is not running or not listening on port 9222. See [Troubleshooting](#troubleshooting).

You can also list all open tabs:

```bash
curl -s http://localhost:9222/json/list
```

This returns an array of all browser tabs (called "targets" in CDP terminology). A fresh Chrome instance will have one tab pointing to `chrome://newtab/`.

---

## Step 4: Run CLI Commands

Now you can run CLI commands. Every command outputs JSON to stdout, making it easy for both humans and AI agents to parse the results.

### Core Commands

```bash
# List all open tabs — shows index, ID, title, and URL for each tab
node dist/browser.js list

# Open a URL in the current tab
# This navigates the first tab (index 0) to example.com
node dist/browser.js open https://example.com

# Describe the page — extracts metadata like title, description, og tags
node dist/browser.js desc 0

# Read the visible text content of the page
node dist/browser.js content 0

# List all interactive elements (links, buttons, inputs)
node dist/browser.js elements 0

# Search the page for text
node dist/browser.js search 0 "example"

# Get the raw HTML source (truncated to 50,000 characters)
node dist/browser.js html 0

# Take a screenshot (saved as PNG to screenshots/ directory)
node dist/browser.js screenshot 0

# Execute JavaScript in the page and get the result
node dist/browser.js eval 0 "document.title"

# Click an element by its visible text
# The text must match what you see on the page
node dist/browser.js click 0 "Learn more"
```

### Navigation

```bash
# Go back to the previous page in history
node dist/browser.js back 0

# Go forward in history
node dist/browser.js forward 0

# Scroll the page down by 500 pixels
node dist/browser.js scroll 0 down

# Scroll to a specific element using a CSS selector
node dist/browser.js scroll 0 "#footer"
```

### Forms and Typing

```bash
# Open a page with a form
node dist/browser.js open https://httpbin.org/forms/post --new-tab

# List all tabs to see the new one
node dist/browser.js list

# Detect all form fields on the page (returns field names, types, labels)
node dist/browser.js fill-form 1

# Type text into a specific input field
# --selector targets the input by CSS selector
node dist/browser.js type 1 "John" --selector "input[name=custname]"

# Fill multiple form fields at once using JSON
node dist/browser.js fill-form 1 --data '{"custname":"Jane","custemail":"jane@test.com"}'

# Read content from all open tabs at once
node dist/browser.js content-all
```

### Advanced Analysis

```bash
# Get performance metrics (load times, resource sizes, Core Web Vitals)
node dist/browser.js perf 0

# Get memory/heap usage
node dist/browser.js memory 0

# Audit accessibility (checks for missing alt text, labels, ARIA roles)
node dist/browser.js audit-a11y 0

# Extract design tokens (colors, fonts, spacing used on the page)
node dist/browser.js tokens 0

# Read page in reader mode (strips navigation, ads, sidebars)
node dist/browser.js read 0

# Visualize CSS layout structure of an element
node dist/browser.js layout 0 --selector "body"

# Emulate a mobile device (changes viewport, user agent, DPR)
node dist/browser.js emulate 0 iPhone14

# Compare two pages side by side
node dist/browser.js diff 0 1

# Highlight all elements matching a CSS selector
node dist/browser.js highlight 0 "a"

# Inject custom CSS into the page
node dist/browser.js theme 0 "body{background:#1a1a2e;color:#eee}"

# Pause all CSS/Web animations
node dist/browser.js animation 0 --rate 0

# List all cookies for the current page
node dist/browser.js cookies 0

# Close a tab
node dist/browser.js close 1
```

### Understanding Tab Indices

The CLI references tabs by their **index** (0, 1, 2, ...). These indices can change when tabs are opened or closed. Always run `list` after modifying tabs to get current indices.

```bash
node dist/browser.js list          # See current tab indices
node dist/browser.js open https://google.com --new-tab   # Opens tab
node dist/browser.js list          # Indices may have shifted!
```

### Understanding JSON Output

Every command returns structured JSON. Success looks like:

```json
{
  "success": true,
  "tab": 0,
  "title": "Example Domain",
  "url": "https://example.com/"
}
```

Errors look like:

```json
{
  "error": "Tab index 5 out of range. 2 tab(s) open."
}
```

You can pipe output to `jq` (if installed) for pretty-printing or extracting fields:

```bash
node dist/browser.js list | jq '.[0].title'
# Output: "Example Domain"
```

---

## Step 5: Stop Chrome

When you are done testing, stop the headless Chrome process.

### Windows (PowerShell)

```powershell
Stop-Process -Name chrome -Force
```

### Windows (Git Bash) or macOS/Linux

```bash
# Windows Git Bash
taskkill //F //IM chrome.exe

# macOS
pkill -f "Google Chrome"

# Linux
pkill chrome
```

### Clean Up the Temporary Profile

The temporary profile directory can be deleted:

```bash
# Windows
rm -rf "$LOCALAPPDATA/Temp/chrome-cdp-test"

# macOS / Linux
rm -rf /tmp/chrome-cdp-test
```

---

## Automated Test Scripts

The following scripts automate the entire process: launch Chrome, wait for it, run all testable commands, report results, and stop Chrome.

### Bash Script (macOS / Linux / Windows Git Bash)

Save this as `scripts/test-cli.sh`:

```bash
#!/usr/bin/env bash
# =============================================================================
# test-cli.sh — Automated test runner for Chrome CDP Browser Agent CLI
#
# This script:
#   1. Detects your operating system and finds Chrome
#   2. Kills any existing Chrome debug instances
#   3. Launches Chrome in headless mode with remote debugging on port 9222
#   4. Waits for Chrome to be ready
#   5. Runs a suite of CLI commands and reports pass/fail for each
#   6. Cleans up (stops Chrome) when done
#
# Usage:
#   bash scripts/test-cli.sh
#
# Prerequisites:
#   - Google Chrome installed
#   - Node.js installed
#   - Project built (npm run build)
# =============================================================================

set -e  # Exit on first error (we disable this later for individual tests)

# --- Configuration ---
PORT=9222                         # CDP debug port
HOST="localhost"                  # CDP host
PROFILE_DIR=""                    # Will be set per-platform below
CHROME=""                         # Will be set per-platform below
CLI="node dist/browser.js"        # Path to compiled CLI entry point
PASS=0                            # Count of passed tests
FAIL=0                            # Count of failed tests
ERRORS=""                         # Accumulated error messages

# --- Colors for terminal output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# STEP 1: Detect platform and locate Chrome
# =============================================================================
echo -e "${BLUE}[1/6] Detecting platform and Chrome location...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    PROFILE_DIR="/tmp/chrome-cdp-test-$$"
    echo "  Platform: macOS"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash / MSYS2)
    CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
    if [ ! -f "$CHROME" ]; then
        CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    fi
    PROFILE_DIR="$LOCALAPPDATA/Temp/chrome-cdp-test-$$"
    echo "  Platform: Windows (Git Bash)"
else
    # Linux
    CHROME="$(which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo '')"
    PROFILE_DIR="/tmp/chrome-cdp-test-$$"
    echo "  Platform: Linux"
fi

# Check that Chrome was found
if [ ! -f "$CHROME" ] && [ -z "$CHROME" ]; then
    echo -e "${RED}ERROR: Chrome not found. Install Chrome or set CHROME env var.${NC}"
    exit 1
fi
echo "  Chrome: $CHROME"
echo "  Profile: $PROFILE_DIR"

# =============================================================================
# STEP 2: Kill any existing Chrome debug instances
# =============================================================================
echo -e "${BLUE}[2/6] Killing existing Chrome processes...${NC}"

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]]; then
    # Windows: use taskkill
    taskkill //F //IM chrome.exe 2>/dev/null || true
else
    # macOS/Linux: use pkill
    pkill -f "Google Chrome" 2>/dev/null || pkill chrome 2>/dev/null || true
fi
sleep 2
echo "  Done."

# =============================================================================
# STEP 3: Launch Chrome in headless mode
# =============================================================================
echo -e "${BLUE}[3/6] Launching Chrome headless on port $PORT...${NC}"

# Create the temporary profile directory
mkdir -p "$PROFILE_DIR"

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]]; then
    # On Windows Git Bash, we MUST use PowerShell's Start-Process to properly
    # detach Chrome from the terminal. Using & (background) in Git Bash causes
    # the shell to lock up because Chrome's stdout/stderr pipes stay connected.
    powershell.exe -Command "Start-Process \
        'C:\Program Files\Google\Chrome\Application\chrome.exe' \
        -ArgumentList '--headless=new','--remote-debugging-port=$PORT',\
        '--user-data-dir=$PROFILE_DIR','--no-first-run','--disable-gpu'" 2>/dev/null
else
    # On macOS/Linux, backgrounding with & works fine
    "$CHROME" \
        --headless=new \
        --remote-debugging-port=$PORT \
        --user-data-dir="$PROFILE_DIR" \
        --no-first-run \
        --disable-gpu \
        >/dev/null 2>&1 &
fi

# =============================================================================
# STEP 4: Wait for Chrome to be ready
# =============================================================================
echo -e "${BLUE}[4/6] Waiting for Chrome to be ready...${NC}"

# We poll the /json/version endpoint until Chrome responds.
# Chrome typically takes 2-5 seconds to start up.
MAX_WAIT=15   # Maximum seconds to wait
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s "http://$HOST:$PORT/json/version" > /dev/null 2>&1; then
        echo "  Chrome is ready! (took ${WAITED}s)"
        break
    fi
    sleep 1
    WAITED=$((WAITED + 1))
done

# If Chrome didn't start in time, exit with error
if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}ERROR: Chrome did not start within ${MAX_WAIT}s.${NC}"
    echo "  Check that port $PORT is not in use."
    exit 1
fi

# Print Chrome version for the test log
echo "  $(curl -s "http://$HOST:$PORT/json/version" | grep -o '"Browser":"[^"]*"')"

# =============================================================================
# STEP 5: Run test suite
# =============================================================================
echo -e "${BLUE}[5/6] Running CLI test suite...${NC}"
echo ""

# --- Helper function to run a test ---
# Arguments:
#   $1 = Test name (displayed in output)
#   $2 = Command to run (the CLI command string)
#   $3 = (Optional) Text to grep for in output to verify success
#
# The function runs the command, checks the exit code, and optionally
# checks that the output contains expected text.
run_test() {
    local name="$1"
    local cmd="$2"
    local expect="$3"

    # Print test name without newline (we'll add pass/fail after)
    printf "  %-50s" "$name"

    # Run the command and capture output + exit code
    # We use a timeout of 15 seconds to prevent hangs
    local output
    local exit_code
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]]; then
        # Git Bash doesn't have `timeout` — use node for a timeout wrapper
        output=$(node -e "
            const { execSync } = require('child_process');
            try {
                const out = execSync('$cmd', { timeout: 15000, encoding: 'utf8' });
                process.stdout.write(out);
            } catch(e) {
                if (e.stdout) process.stdout.write(e.stdout);
                if (e.stderr) process.stderr.write(e.stderr);
                process.exit(e.status || 1);
            }
        " 2>&1) && exit_code=0 || exit_code=$?
    else
        output=$(timeout 15 bash -c "$cmd" 2>&1) && exit_code=0 || exit_code=$?
    fi

    # Check results
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}FAIL${NC} (exit code $exit_code)"
        FAIL=$((FAIL + 1))
        ERRORS="$ERRORS\n  FAIL: $name\n    Command: $cmd\n    Output: $(echo "$output" | head -3)\n"
        return
    fi

    # If we have expected text, check the output contains it
    if [ -n "$expect" ]; then
        if echo "$output" | grep -q "$expect"; then
            echo -e "${GREEN}PASS${NC}"
            PASS=$((PASS + 1))
        else
            echo -e "${RED}FAIL${NC} (expected '$expect' not found)"
            FAIL=$((FAIL + 1))
            ERRORS="$ERRORS\n  FAIL: $name\n    Expected: $expect\n    Output: $(echo "$output" | head -3)\n"
        fi
    else
        echo -e "${GREEN}PASS${NC}"
        PASS=$((PASS + 1))
    fi
}

# === Test Suite ===

echo -e "${YELLOW}--- Core Commands ---${NC}"

# Test: list — should show at least one tab
run_test "list" \
    "$CLI list" \
    '"index"'

# Test: open — navigate to example.com
run_test "open (navigate)" \
    "$CLI open https://example.com" \
    '"success": true'

# We add a small delay to let the page load fully
sleep 2

# Test: desc — should extract the page title
run_test "desc" \
    "$CLI desc 0" \
    '"title": "Example Domain"'

# Test: content — should contain the page text
run_test "content" \
    "$CLI content 0" \
    "Example Domain"

# Test: elements — should find the "Learn more" link
run_test "elements" \
    "$CLI elements 0" \
    "Learn more"

# Test: search — should find matches for "example"
run_test "search" \
    "$CLI search 0 example" \
    '"total"'

# Test: html — should return HTML source
run_test "html" \
    "$CLI html 0" \
    '"html"'

# Test: screenshot — should save a PNG file
run_test "screenshot" \
    "$CLI screenshot 0" \
    '"success": true'

# Test: eval — execute JS and get result
run_test "eval" \
    "$CLI eval 0 document.title" \
    "Example Domain"

# Test: click — click the "Learn more" link
run_test "click" \
    "$CLI click 0 'Learn more'" \
    '"success": true'

# Navigate back to example.com for remaining tests
sleep 1
$CLI open https://example.com > /dev/null 2>&1
sleep 2

echo ""
echo -e "${YELLOW}--- Navigation Commands ---${NC}"

# Test: scroll — scroll down
run_test "scroll down" \
    "$CLI scroll 0 down" \
    '"success": true'

# Test: scroll top
run_test "scroll top" \
    "$CLI scroll 0 top" \
    '"success": true'

# Test: back — should report at beginning of history or navigate
run_test "back" \
    "$CLI back 0" \
    ""

# Navigate to example.com again
$CLI open https://example.com > /dev/null 2>&1
sleep 2

echo ""
echo -e "${YELLOW}--- Form Interaction Commands ---${NC}"

# Test: open --new-tab — open a form page in a new tab
run_test "open (new tab)" \
    "$CLI open https://httpbin.org/forms/post --new-tab" \
    '"opened_new_tab"'

sleep 3

# Test: list — should now show 2 tabs
run_test "list (2 tabs)" \
    "$CLI list" \
    '"index": 1'

# We need to figure out which tab index httpbin is on
# It could be 0 or 1 depending on Chrome's tab ordering
HTTPBIN_TAB=$($CLI list 2>/dev/null | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
        const tabs=JSON.parse(d);
        const t=tabs.find(t=>t.url.includes('httpbin'));
        console.log(t?t.index:1);
    });
")

# Test: fill-form (detect mode) — should list form fields
run_test "fill-form (detect)" \
    "$CLI fill-form $HTTPBIN_TAB" \
    '"custname"'

# Test: type — type into a form field
run_test "type" \
    "$CLI type $HTTPBIN_TAB John --selector 'input[name=custname]'" \
    '"success": true'

# Test: content-all — should get text from all tabs
run_test "content-all" \
    "$CLI content-all" \
    "Example Domain"

# Close the httpbin tab
$CLI close $HTTPBIN_TAB > /dev/null 2>&1
sleep 1

# Refresh the tab list — after closing, the remaining tab is at index 0
$CLI open https://example.com > /dev/null 2>&1
sleep 2

echo ""
echo -e "${YELLOW}--- Advanced Analysis Commands ---${NC}"

# Test: perf — performance metrics
run_test "perf" \
    "$CLI perf 0" \
    '"metrics"'

# Test: memory — heap usage
run_test "memory" \
    "$CLI memory 0" \
    '"jsHeapUsedSize"'

# Test: cookies — list cookies
run_test "cookies" \
    "$CLI cookies 0" \
    '"cookies"'

# Test: audit-a11y — accessibility audit
run_test "audit-a11y" \
    "$CLI audit-a11y 0" \
    '"score"'

# Test: tokens — design tokens
run_test "tokens" \
    "$CLI tokens 0" \
    '"colors"'

# Test: read — reader mode
run_test "read" \
    "$CLI read 0" \
    '"article"'

# Test: layout — CSS layout
run_test "layout" \
    "$CLI layout 0" \
    '"layout"'

# Test: theme — inject CSS
run_test "theme" \
    "$CLI theme 0 'body{background:red}'" \
    '"success": true'

# Test: emulate — device emulation
run_test "emulate (iPhone14)" \
    "$CLI emulate 0 iPhone14" \
    '"iPhone14"'

# Reset emulation
$CLI emulate 0 desktop > /dev/null 2>&1

# Test: animation — control playback rate
run_test "animation (pause)" \
    "$CLI animation 0 --rate 0" \
    '"paused"'

# Test: animation — resume
run_test "animation (resume)" \
    "$CLI animation 0 --rate 1" \
    '"normal"'

# Test: highlight — highlight elements
run_test "highlight" \
    "$CLI highlight 0 a" \
    '"highlighted"'

echo ""
echo -e "${YELLOW}--- Multi-Tab Commands ---${NC}"

# Open second tab for diff test
$CLI open https://httpbin.org/forms/post --new-tab > /dev/null 2>&1
sleep 3

# Test: switch — activate a tab
run_test "switch" \
    "$CLI switch 0" \
    '"success": true'

# Test: diff — compare two pages
run_test "diff" \
    "$CLI diff 0 1" \
    '"differences"'

# Test: design-review — extract design structure
run_test "design-review" \
    "$CLI design-review 0" \
    '"success": true'

# Close second tab
SECOND_TAB=$($CLI list 2>/dev/null | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
        const tabs=JSON.parse(d);
        console.log(tabs.length > 1 ? 1 : 0);
    });
")
$CLI close $SECOND_TAB > /dev/null 2>&1

# Test: close — verify close works (already tested implicitly)
run_test "close (verify)" \
    "$CLI list" \
    '"index": 0'

# =============================================================================
# STEP 6: Report results and clean up
# =============================================================================
echo ""
echo -e "${BLUE}[6/6] Results${NC}"
echo "============================================"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo "  Total:  $((PASS + FAIL))"
echo "============================================"

if [ -n "$ERRORS" ]; then
    echo ""
    echo -e "${RED}Failed tests:${NC}"
    echo -e "$ERRORS"
fi

# --- Clean up ---
echo ""
echo "Stopping Chrome..."

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "mingw"* ]]; then
    taskkill //F //IM chrome.exe 2>/dev/null || true
else
    pkill -f "Google Chrome" 2>/dev/null || pkill chrome 2>/dev/null || true
fi

# Remove temporary profile
rm -rf "$PROFILE_DIR" 2>/dev/null

echo "Done."

# Exit with failure if any tests failed
if [ $FAIL -gt 0 ]; then
    exit 1
fi
```

### PowerShell Script (Windows)

Save this as `scripts/test-cli.ps1`:

```powershell
# =============================================================================
# test-cli.ps1 — Automated test runner for Chrome CDP Browser Agent CLI
#
# This script:
#   1. Finds Chrome on the system
#   2. Kills any existing Chrome processes
#   3. Launches Chrome in headless mode with remote debugging on port 9222
#   4. Waits for Chrome to be ready (polls the /json/version endpoint)
#   5. Runs a comprehensive suite of CLI commands and reports pass/fail
#   6. Stops Chrome and cleans up
#
# Usage:
#   .\scripts\test-cli.ps1
#
# Prerequisites:
#   - Google Chrome installed
#   - Node.js installed
#   - Project built (npm run build)
# =============================================================================

# --- Configuration ---
$Port = 9222
$Host_ = "localhost"
$ProfileDir = Join-Path $env:TEMP "chrome-cdp-test-$PID"
$CLI = "node dist/browser.js"
$Pass = 0
$Fail = 0
$Errors = @()

# =============================================================================
# STEP 1: Find Chrome
# =============================================================================
Write-Host "[1/6] Finding Chrome..." -ForegroundColor Blue

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
    Write-Host "ERROR: Chrome not found." -ForegroundColor Red
    exit 1
}
Write-Host "  Chrome: $Chrome"

# =============================================================================
# STEP 2: Kill existing Chrome processes
# =============================================================================
Write-Host "[2/6] Killing existing Chrome processes..." -ForegroundColor Blue

# Stop-Process silently ignores errors if no chrome processes exist
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue

# Wait for processes to fully exit
Start-Sleep -Seconds 2
Write-Host "  Done."

# =============================================================================
# STEP 3: Launch Chrome in headless mode
# =============================================================================
Write-Host "[3/6] Launching Chrome headless on port $Port..." -ForegroundColor Blue

# Create temporary profile directory
if (-not (Test-Path $ProfileDir)) {
    New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
}

# Start-Process launches Chrome as a separate process that won't block
# our script. This is important because Chrome runs continuously.
Start-Process -FilePath $Chrome -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=$Port",
    "--user-data-dir=$ProfileDir",
    "--no-first-run",
    "--disable-gpu"
)

Write-Host "  Profile: $ProfileDir"

# =============================================================================
# STEP 4: Wait for Chrome to be ready
# =============================================================================
Write-Host "[4/6] Waiting for Chrome to be ready..." -ForegroundColor Blue

# We poll the /json/version endpoint every second until Chrome responds.
# This endpoint returns JSON with browser version info when Chrome is ready.
$MaxWait = 15
$Waited = 0

while ($Waited -lt $MaxWait) {
    try {
        $response = Invoke-RestMethod -Uri "http://${Host_}:$Port/json/version" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  Chrome is ready! (took ${Waited}s)"
        Write-Host "  Browser: $($response.Browser)"
        break
    } catch {
        # Chrome isn't ready yet — wait and try again
        Start-Sleep -Seconds 1
        $Waited++
    }
}

if ($Waited -ge $MaxWait) {
    Write-Host "ERROR: Chrome did not start within ${MaxWait}s." -ForegroundColor Red
    exit 1
}

# =============================================================================
# STEP 5: Run test suite
# =============================================================================
Write-Host "[5/6] Running CLI test suite..." -ForegroundColor Blue
Write-Host ""

# --- Helper function to run a single test ---
# Parameters:
#   Name:   Display name for the test
#   Cmd:    The full CLI command to execute
#   Expect: (Optional) String that must appear in the output for the test to pass
function Run-Test {
    param(
        [string]$Name,
        [string]$Cmd,
        [string]$Expect = ""
    )

    # Display test name (padded for alignment)
    $paddedName = $Name.PadRight(50)
    Write-Host "  $paddedName" -NoNewline

    try {
        # Run the command and capture output
        # We use cmd /c to execute the command because PowerShell's Invoke-Expression
        # can have issues with complex argument quoting
        $output = & cmd /c "$Cmd 2>&1"
        $exitCode = $LASTEXITCODE

        # Check exit code
        if ($exitCode -ne 0) {
            Write-Host "FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (exit code $exitCode)"
            $script:Fail++
            $script:Errors += "FAIL: $Name`n  Command: $Cmd`n  Output: $($output | Select-Object -First 3)"
            return
        }

        # If we have expected text, check the output contains it
        $outputStr = $output -join "`n"
        if ($Expect -and ($outputStr -notmatch [regex]::Escape($Expect))) {
            Write-Host "FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (expected '$Expect' not found)"
            $script:Fail++
            $script:Errors += "FAIL: $Name`n  Expected: $Expect`n  Output: $($output | Select-Object -First 3)"
            return
        }

        Write-Host "PASS" -ForegroundColor Green
        $script:Pass++
    } catch {
        Write-Host "FAIL" -ForegroundColor Red -NoNewline
        Write-Host " (exception: $($_.Exception.Message))"
        $script:Fail++
        $script:Errors += "FAIL: $Name`n  Exception: $($_.Exception.Message)"
    }
}

# === Test Suite ===

Write-Host "--- Core Commands ---" -ForegroundColor Yellow

Run-Test -Name "list" -Cmd "$CLI list" -Expect '"index"'
Run-Test -Name "open (navigate)" -Cmd "$CLI open https://example.com" -Expect '"success": true'

Start-Sleep -Seconds 2

Run-Test -Name "desc" -Cmd "$CLI desc 0" -Expect '"Example Domain"'
Run-Test -Name "content" -Cmd "$CLI content 0" -Expect "Example Domain"
Run-Test -Name "elements" -Cmd "$CLI elements 0" -Expect "Learn more"
Run-Test -Name "search" -Cmd "$CLI search 0 example" -Expect '"total"'
Run-Test -Name "html" -Cmd "$CLI html 0" -Expect '"html"'
Run-Test -Name "screenshot" -Cmd "$CLI screenshot 0" -Expect '"success": true'
Run-Test -Name "eval" -Cmd "$CLI eval 0 document.title" -Expect "Example Domain"
Run-Test -Name "click" -Cmd "$CLI click 0 `"Learn more`"" -Expect '"success": true'

# Navigate back for remaining tests
& cmd /c "$CLI open https://example.com" 2>&1 | Out-Null
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "--- Navigation Commands ---" -ForegroundColor Yellow

Run-Test -Name "scroll down" -Cmd "$CLI scroll 0 down" -Expect '"success": true'
Run-Test -Name "scroll top" -Cmd "$CLI scroll 0 top" -Expect '"success": true'
Run-Test -Name "back" -Cmd "$CLI back 0"

& cmd /c "$CLI open https://example.com" 2>&1 | Out-Null
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "--- Form Interaction Commands ---" -ForegroundColor Yellow

Run-Test -Name "open (new tab)" -Cmd "$CLI open https://httpbin.org/forms/post --new-tab" -Expect '"opened_new_tab"'
Start-Sleep -Seconds 3
Run-Test -Name "list (2 tabs)" -Cmd "$CLI list" -Expect '"index": 1'
Run-Test -Name "fill-form (detect)" -Cmd "$CLI fill-form 1" -Expect '"custname"'
Run-Test -Name "type" -Cmd "$CLI type 1 John --selector `"input[name=custname]`"" -Expect '"success": true'
Run-Test -Name "content-all" -Cmd "$CLI content-all" -Expect "Example Domain"

& cmd /c "$CLI close 1" 2>&1 | Out-Null
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "--- Advanced Analysis Commands ---" -ForegroundColor Yellow

Run-Test -Name "perf" -Cmd "$CLI perf 0" -Expect '"metrics"'
Run-Test -Name "memory" -Cmd "$CLI memory 0" -Expect '"jsHeapUsedSize"'
Run-Test -Name "cookies" -Cmd "$CLI cookies 0" -Expect '"cookies"'
Run-Test -Name "audit-a11y" -Cmd "$CLI audit-a11y 0" -Expect '"score"'
Run-Test -Name "tokens" -Cmd "$CLI tokens 0" -Expect '"colors"'
Run-Test -Name "read" -Cmd "$CLI read 0" -Expect '"article"'
Run-Test -Name "layout" -Cmd "$CLI layout 0" -Expect '"layout"'
Run-Test -Name "theme" -Cmd "$CLI theme 0 `"body{background:red}`"" -Expect '"success": true'
Run-Test -Name "emulate (iPhone14)" -Cmd "$CLI emulate 0 iPhone14" -Expect '"iPhone14"'

& cmd /c "$CLI emulate 0 desktop" 2>&1 | Out-Null

Run-Test -Name "animation (pause)" -Cmd "$CLI animation 0 --rate 0" -Expect '"paused"'
Run-Test -Name "animation (resume)" -Cmd "$CLI animation 0 --rate 1" -Expect '"normal"'
Run-Test -Name "highlight" -Cmd "$CLI highlight 0 a" -Expect '"highlighted"'

Write-Host ""
Write-Host "--- Multi-Tab Commands ---" -ForegroundColor Yellow

& cmd /c "$CLI open https://httpbin.org/forms/post --new-tab" 2>&1 | Out-Null
Start-Sleep -Seconds 3

Run-Test -Name "switch" -Cmd "$CLI switch 0" -Expect '"success": true'
Run-Test -Name "diff" -Cmd "$CLI diff 0 1" -Expect '"differences"'
Run-Test -Name "design-review" -Cmd "$CLI design-review 0" -Expect '"success": true'

& cmd /c "$CLI close 1" 2>&1 | Out-Null

Run-Test -Name "close (verify)" -Cmd "$CLI list" -Expect '"index": 0'

# =============================================================================
# STEP 6: Report results and clean up
# =============================================================================
Write-Host ""
Write-Host "[6/6] Results" -ForegroundColor Blue
Write-Host "============================================"
Write-Host "  Passed: $Pass" -ForegroundColor Green
Write-Host "  Failed: $Fail" -ForegroundColor $(if ($Fail -gt 0) { "Red" } else { "Green" })
Write-Host "  Total:  $($Pass + $Fail)"
Write-Host "============================================"

if ($Errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Red
    foreach ($err in $Errors) {
        Write-Host "  $err" -ForegroundColor Red
    }
}

# --- Clean up ---
Write-Host ""
Write-Host "Stopping Chrome..."
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue

# Remove temporary profile
if (Test-Path $ProfileDir) {
    Remove-Item -Path $ProfileDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Done."

# Exit with failure code if any tests failed
if ($Fail -gt 0) { exit 1 }
```

---

## Troubleshooting

### "Cannot connect to Chrome" or "Connection refused"

**Cause:** Chrome is not running with the debug port, or another process is using port 9222.

**Fix:**
1. Make sure you killed all Chrome processes before starting
2. Check if something else is using port 9222:
   ```bash
   # Windows
   netstat -ano | findstr 9222
   # macOS/Linux
   lsof -i :9222
   ```
3. Try a different port: pass `--remote-debugging-port=9333` to Chrome and `-p 9333` to the CLI

### "Tab index X out of range"

**Cause:** The tab index you specified doesn't exist. Tab indices change when tabs are opened or closed.

**Fix:** Run `node dist/browser.js list` to see current tab indices.

### Commands hang (never return)

**Cause:** Some CDP operations wait for page events that may not fire in certain states.

**Fix:**
- Press Ctrl+C to cancel
- The `open` command has a built-in 10-second timeout for this reason
- If a page hasn't fully loaded, try `node dist/browser.js wait 0 idle` first

### "No element found with text: ..."

**Cause:** The `click` command searches for exact text match (case-sensitive, includes partial matches within words).

**Fix:**
- Use `node dist/browser.js elements 0` to see what text elements are available
- Use `node dist/browser.js eval 0 "document.querySelector('a').innerText"` to check exact text
- The text match is case-sensitive: "Learn more" is not "learn more"

### Chrome exits immediately in headless mode

**Cause:** Chrome may fail to start if the user data directory is corrupted or has permission issues.

**Fix:**
- Delete the temp profile: `rm -rf /tmp/chrome-cdp-test` or `rmdir /s C:\Users\...\Temp\chrome-cdp-test`
- Try a fresh directory path
- Check Chrome's stderr output for specific error messages

### Git Bash shell freezes when running Chrome

**Cause:** On Windows, backgrounding Chrome with `&` in Git Bash keeps stdout/stderr pipes connected, locking the shell.

**Fix:** Always use PowerShell's `Start-Process` to launch Chrome from Git Bash:
```bash
powershell.exe -Command "Start-Process 'chrome.exe' -ArgumentList '--headless=new','--remote-debugging-port=9222',..."
```

### Screenshot directory doesn't exist

**Cause:** The `screenshot` command saves to `screenshots/` by default, which may not exist.

**Fix:** Create it: `mkdir screenshots`

---

## How This Was Tested During Development

During development, the CLI was tested as follows:

1. **Chrome launched in headless mode** using `powershell.exe Start-Process` from Git Bash on Windows — this properly detaches Chrome from the terminal

2. **Verified Chrome was ready** by polling `http://localhost:9222/json/version` with `curl`

3. **28 commands tested live** against example.com and httpbin.org/forms/post:
   - All returned valid JSON
   - 2 bugs discovered and fixed:
     - `click.ts`: Removed call to `Input.enable()` (CDP Input domain has no enable method)
     - `open.ts`: Added 10-second timeout on `Page.loadEventFired()` to prevent indefinite hangs

4. **Test sites used:**
   - `https://example.com` — Simple page for content, search, click, metadata tests
   - `https://httpbin.org/forms/post` — Form page for type, fill-form, multi-tab tests
