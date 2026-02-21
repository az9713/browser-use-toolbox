# Chrome CDP Browser Agent CLI

A command-line tool that lets AI agents (Claude Code, etc.) control Chrome via the Chrome DevTools Protocol (CDP). 42 flat top-level commands, each in a separate file, covering navigation, interaction, analysis, performance, accessibility, and more.

Built on top of the [browser-use-toolbox](https://github.com/az9713/browser-use-toolbox) modules.

## Quick Start

```bash
# 1. Install dependencies
cd cli
npm install

# 2. Build
npm run build

# 3. Start Chrome with debugging enabled
bash scripts/start-chrome.sh        # macOS / Linux / Git Bash
# or
powershell scripts/start-chrome.ps1 # Windows PowerShell

# 4. Use the CLI
node dist/browser.js list
node dist/browser.js open https://example.com
node dist/browser.js screenshot 0
```

## Architecture

```
cli/
├── src/
│   ├── browser.ts              # CLI entry point (commander, registers all 42 commands)
│   ├── chrome/
│   │   ├── connector.ts        # connectToTab() / resolveTab() → CDP client
│   │   └── tabs.ts             # getAllTabs() → HTTP /json/list
│   ├── commands/               # 42 command files (one per command)
│   └── types/                  # TypeScript declarations
├── scripts/
│   ├── start-chrome.sh         # Bash launcher (macOS/Linux/WSL/Git Bash)
│   └── start-chrome.ps1        # PowerShell launcher (Windows)
├── skills/                     # 42 skill files for Claude Code
├── dist/                       # Compiled JS output
└── screenshots/                # Screenshot output directory
```

## Design Principles

- **Flat commands** — all 42 are top-level, no subcommand grouping
- **Text-based click** — the agent clicks by visible text, not CSS selectors
- **JSON output** — every command returns structured JSON to stdout
- **Tab by index** — tabs are referenced as 0, 1, 2... (re-run `list` after changes)
- **Cross-platform** — works on macOS, Linux, WSL, and Windows

## Global Options

All commands accept:

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --port <port>` | `9222` | Chrome remote debugging port |
| `-h, --host <host>` | `localhost` | Chrome remote debugging host |

## Dependencies

| Package | Purpose |
|---------|---------|
| `commander` | CLI framework |
| `chrome-remote-interface` | CDP client |
| `typescript` | Build toolchain (dev) |

---

## Complete Command Reference (42 Commands)

### Core Commands

These 12 commands cover the essential browser automation workflow: opening pages, reading content, finding elements, clicking, typing, and taking screenshots.

---

#### `list`

List all open Chrome tabs with their index, ID, title, and URL.

```bash
node dist/browser.js list
```

**Output:** Array of `{index, id, title, url}` objects. The `index` is what you pass to other commands.

**Toolbox module:** 02-tab-orchestrator | **CDP:** HTTP `/json/list`

---

#### `open <url>`

Navigate to a URL. By default navigates the first open tab. Use `--new-tab` to open in a new tab.

```bash
node dist/browser.js open https://example.com
node dist/browser.js open https://google.com --new-tab
```

| Option | Description |
|--------|-------------|
| `-n, --new-tab` | Open URL in a new tab instead of navigating current |

**Toolbox module:** 01-navigator | **CDP:** `CDP.New()`, `Page.navigate`

---

#### `screenshot <tab>`

Capture a PNG screenshot of the specified tab.

```bash
node dist/browser.js screenshot 0
node dist/browser.js screenshot 0 --output myshot.png --full
```

| Option | Description |
|--------|-------------|
| `-o, --output <path>` | Output file path (default: `screenshots/screenshot-{tab}-{timestamp}.png`) |
| `--full` | Capture full page (scrolls to capture everything) |

**Toolbox module:** 11-screenshotter | **CDP:** `Page.captureScreenshot`, `Emulation.setDeviceMetricsOverride`

---

#### `content <tab>`

Read the visible text content of a page using `document.body.innerText`.

```bash
node dist/browser.js content 0
```

**Output:** `{tab, title, url, text}`

**Toolbox module:** 05-content-scraper | **CDP:** `Runtime.evaluate`

---

#### `content-all`

Read visible text from every open tab. Continues even if individual tabs fail.

```bash
node dist/browser.js content-all
```

**Output:** Array of `{tab, title, url, text}` objects.

**Toolbox module:** 05-content-scraper | **CDP:** `Runtime.evaluate` (loop)

---

#### `click <tab> <text>`

Click an element by its visible text. Uses a TreeWalker to find text nodes, then locates the nearest clickable ancestor (`a`, `button`, `input`, `[role=button]`, `[onclick]`) and dispatches mouse events at its center.

```bash
node dist/browser.js click 0 "Sign In"
node dist/browser.js click 0 "More information"
```

**Toolbox module:** 06-clicker | **CDP:** `Runtime.evaluate` + `Input.dispatchMouseEvent`

---

#### `type <tab> <text>`

Type text into an input field. Targets the currently focused input by default, or a specific element via `--selector`.

```bash
node dist/browser.js type 0 "hello world"
node dist/browser.js type 0 "John" --selector "input[name=custname]"
node dist/browser.js type 0 "new value" --selector "#email" --clear
```

| Option | Description |
|--------|-------------|
| `-s, --selector <sel>` | CSS selector to target |
| `--clear` | Clear the field before typing |

**Toolbox module:** 07-typer | **CDP:** `Runtime.evaluate`, `Input.insertText`, `Input.dispatchKeyEvent`

---

#### `elements <tab>`

List all interactive elements on the page: links, buttons, inputs, selects, textareas, and elements with `[role=button]` or `[onclick]`.

```bash
node dist/browser.js elements 0
```

**Output:** Array of `{tag, text, href, type, name, id, class, rect}` objects.

**Toolbox module:** 03-dom-explorer | **CDP:** `Runtime.evaluate`

---

#### `close <tab>`

Close a tab by its index.

```bash
node dist/browser.js close 1
```

**Toolbox module:** 02-tab-orchestrator | **CDP:** `CDP.Close`

---

#### `html <tab>`

Get the raw HTML source of a page. Output is truncated to 50,000 characters.

```bash
node dist/browser.js html 0
```

**Output:** `{tab, url, length, truncated, html}`

**Toolbox module:** 05-content-scraper | **CDP:** `Runtime.evaluate`

---

#### `search <tab> <query>`

Search the page text for a query string. Uses a TreeWalker on text nodes and returns matches with surrounding context.

```bash
node dist/browser.js search 0 "pricing"
node dist/browser.js search 0 "example"
```

**Output:** `{query, matches: [{text, element, index}], total}`

**New command** | **CDP:** `Runtime.evaluate` (TreeWalker)

---

#### `desc <tab>`

Describe page metadata: title, meta description, keywords, Open Graph tags, canonical URL, h1, language, and all meta tags.

```bash
node dist/browser.js desc 0
```

**Toolbox module:** 04-accessibility-reader | **CDP:** `Runtime.evaluate`

---

### Navigation & Tab Commands

Control browser history and tab focus.

---

#### `back <tab>`

Go back one step in the tab's navigation history.

```bash
node dist/browser.js back 0
```

**Toolbox module:** 01-navigator | **CDP:** `Page.getNavigationHistory`, `Page.navigateToHistoryEntry`

---

#### `forward <tab>`

Go forward one step in the tab's navigation history.

```bash
node dist/browser.js forward 0
```

**Toolbox module:** 01-navigator | **CDP:** `Page.getNavigationHistory`, `Page.navigateToHistoryEntry`

---

#### `switch <tab>`

Activate and focus a tab (bring it to the foreground in Chrome).

```bash
node dist/browser.js switch 2
```

**Toolbox module:** 02-tab-orchestrator | **CDP:** `Target.activateTarget`

---

### Interaction Commands

Fill forms, scroll pages, and drag elements.

---

#### `fill-form <tab>`

Auto-fill form fields. With `--data`, fills specific fields from a JSON object. Without `--data`, auto-detects all form fields and returns their names, types, and current values.

```bash
# Detect form fields
node dist/browser.js fill-form 0

# Fill specific fields
node dist/browser.js fill-form 0 --data '{"name":"John","email":"john@test.com"}'
```

| Option | Description |
|--------|-------------|
| `-d, --data <json>` | JSON object of `{fieldName: value}` pairs |

**Toolbox module:** 08-form-filler | **CDP:** `Runtime.evaluate`, `Input.insertText`

---

#### `scroll <tab> <direction>`

Scroll the page. Direction can be `up`, `down`, `top`, `bottom`, or a CSS selector to scroll into view.

```bash
node dist/browser.js scroll 0 down
node dist/browser.js scroll 0 down --amount 1000
node dist/browser.js scroll 0 top
node dist/browser.js scroll 0 "#footer"
```

| Option | Description |
|--------|-------------|
| `-a, --amount <pixels>` | Pixels to scroll for up/down (default: 500) |

**Toolbox module:** 09-scroller | **CDP:** `Runtime.evaluate`

---

#### `drag <tab> <from> <to>`

Drag an element from one CSS selector to another. Dispatches a realistic sequence of mousePressed, multiple mouseMoved (interpolated path), and mouseReleased events.

```bash
node dist/browser.js drag 0 "#item1" "#dropzone"
```

**Toolbox module:** 10-drag-drop | **CDP:** `Input.dispatchMouseEvent` sequence

---

### Vision Commands

Screen recording and visual capture.

---

#### `record <tab> <action>`

Start a screencast recording. Captures frames for 5 seconds and saves them as numbered PNGs.

```bash
node dist/browser.js record 0 start --output frames
```

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Output directory for frames (default: `screenshots`) |

**Toolbox module:** 12-screen-recorder | **CDP:** `Page.startScreencast`, `Page.stopScreencast`

---

### Execution Commands

Run JavaScript and monitor console output.

---

#### `eval <tab> <js>`

Execute arbitrary JavaScript in the page context. Supports async expressions (`awaitPromise: true`).

```bash
node dist/browser.js eval 0 "document.title"
node dist/browser.js eval 0 "document.querySelectorAll('a').length"
```

**Output:** `{result, type}` — the evaluated value and its CDP type.

**Toolbox module:** 13-js-executor | **CDP:** `Runtime.evaluate`

---

#### `console <tab>`

Listen for console output (log, warn, error, etc.) for a specified duration.

```bash
node dist/browser.js console 0
node dist/browser.js console 0 --duration 10000
```

| Option | Description |
|--------|-------------|
| `--duration <ms>` | Listen duration in milliseconds (default: 3000) |

**Output:** Array of `{type, args, timestamp}` entries.

**Toolbox module:** 14-console-monitor | **CDP:** `Runtime.enable`, `Runtime.consoleAPICalled`

---

### Network Commands

Monitor and intercept HTTP traffic.

---

#### `network <tab>`

Monitor all HTTP requests for a specified duration. Collects request/response pairs with timing data.

```bash
node dist/browser.js network 0
node dist/browser.js network 0 --duration 10000
```

| Option | Description |
|--------|-------------|
| `--duration <ms>` | Listen duration in milliseconds (default: 5000) |

**Output:** Array of `{requestId, url, method, status, type, timingMs}`.

**Toolbox module:** 15-request-watcher | **CDP:** `Network.enable`, `Network.requestWillBeSent`, `Network.responseReceived`

---

#### `mock-api <tab> <url> <response>`

Intercept HTTP requests matching a URL pattern and respond with mock data. Listens for 10 seconds.

```bash
node dist/browser.js mock-api 0 "/api/users" '{"users":[]}'
```

**Output:** `{pattern, mocked, duration}` — how many requests were intercepted.

**Toolbox module:** 16-api-mocker | **CDP:** `Fetch.enable`, `Fetch.requestPaused`, `Fetch.fulfillRequest`

---

### Context Commands

Manage cookies, emulate devices, handle dialogs, and wait for conditions.

---

#### `cookies <tab>`

List, set, or delete cookies for the current page.

```bash
# List all cookies
node dist/browser.js cookies 0

# Set a cookie
node dist/browser.js cookies 0 --set '{"name":"token","value":"abc123","domain":".example.com"}'

# Delete a cookie
node dist/browser.js cookies 0 --delete "token"
```

| Option | Description |
|--------|-------------|
| `--set <json>` | Set a cookie (JSON with name, value, domain) |
| `--delete <name>` | Delete a cookie by name |

**Toolbox module:** 17-cookie-manager | **CDP:** `Network.getCookies`, `Network.setCookie`, `Network.deleteCookies`

---

#### `emulate <tab> <device>`

Emulate a device viewport and user agent. Preset devices available.

```bash
node dist/browser.js emulate 0 iPhone14
node dist/browser.js emulate 0 iPad
node dist/browser.js emulate 0 Pixel7
node dist/browser.js emulate 0 desktop
```

| Device | Viewport | DPR |
|--------|----------|-----|
| `iPhone14` | 390x844 | 3 |
| `iPad` | 820x1180 | 2 |
| `Pixel7` | 412x915 | 2.625 |
| `desktop` | 1920x1080 | 1 |

**Toolbox module:** 18-device-emulator | **CDP:** `Emulation.setDeviceMetricsOverride`, `Emulation.setUserAgentOverride`

---

#### `dialog <tab> <action>`

Handle JavaScript dialog boxes (alert, confirm, prompt). Waits up to 5 seconds for a dialog to appear.

```bash
node dist/browser.js dialog 0 accept
node dist/browser.js dialog 0 dismiss
node dist/browser.js dialog 0 accept --text "my input"
```

| Option | Description |
|--------|-------------|
| `--text <text>` | Text to enter in a prompt dialog |

**Toolbox module:** 19-dialog-handler | **CDP:** `Page.javascriptDialogOpening`, `Page.handleJavaScriptDialog`

---

#### `wait <tab> <target>`

Wait for a condition before proceeding. Target can be a CSS selector, `"navigation"`, or `"idle"` (network idle).

```bash
node dist/browser.js wait 0 "#loaded"
node dist/browser.js wait 0 navigation --timeout 15000
node dist/browser.js wait 0 idle
```

| Option | Description |
|--------|-------------|
| `--timeout <ms>` | Maximum wait time (default: 10000) |

**Toolbox module:** 20-wait-strategies | **CDP:** `Runtime.evaluate` (polling), `Page.loadEventFired`, `Network` events

---

### Advanced — Theming & Accessibility

Inject styles and audit accessibility.

---

#### `theme <tab> <css>`

Inject custom CSS into the page by appending a `<style>` element to `<head>`.

```bash
node dist/browser.js theme 0 "body{background:#1a1a2e;color:#eee}"
```

**Toolbox module:** 21-ui-themer | **CDP:** `Runtime.evaluate`

---

#### `audit-a11y <tab>`

Run an accessibility audit. Analyzes the full accessibility tree for missing alt text, missing form labels, low contrast indicators, empty buttons/links, and missing ARIA roles.

```bash
node dist/browser.js audit-a11y 0
```

**Output:** `{issues: [...], score, totalNodes}` — each issue includes type, severity, element, and suggestion.

**Toolbox module:** 22-accessibility-auditor | **CDP:** `Accessibility.getFullAXTree`, `Runtime.evaluate`

---

### Advanced — Performance & Analysis

Measure performance, memory, and network timing.

---

#### `perf <tab>`

Collect page performance metrics from Chrome's Performance domain, `window.performance.timing`, and Navigation Timing entries.

```bash
node dist/browser.js perf 0
```

**Toolbox module:** 23-performance-xray | **CDP:** `Performance.getMetrics`, `Runtime.evaluate`

---

#### `waterfall <tab>`

Generate a network request timing waterfall. Reloads the page, collects all request/response timing, and outputs sorted by start time.

```bash
node dist/browser.js waterfall 0
```

**Output:** Array of `{url, method, status, startTime, endTime, duration, size}` sorted by start time.

**Toolbox module:** 23-performance-xray | **CDP:** `Network.enable`, `Page.reload`

---

#### `memory <tab>`

Get JavaScript heap memory usage from `Runtime.getHeapUsage` and `performance.memory`.

```bash
node dist/browser.js memory 0
```

**Output:** `{jsHeapUsedSize, jsHeapTotalSize, usedPercentage}`

**Toolbox module:** 23-performance-xray | **CDP:** `Runtime.getHeapUsage`

---

### Advanced — Content & Layout

Extract content, analyze layout, control animations, and extract design tokens.

---

#### `read <tab>`

Extract article content in reader mode. Finds the main content area (`<article>`, `<main>`, `[role=main]`, or largest text block), strips navigation, sidebars, ads, and footers.

```bash
node dist/browser.js read 0
```

**Toolbox module:** 24-reading-mode | **CDP:** `Runtime.evaluate`

---

#### `layout <tab>`

Visualize CSS layout structure. Walks the DOM tree and reports each element's tag, display, position, dimensions, and children.

```bash
node dist/browser.js layout 0
node dist/browser.js layout 0 --selector ".container"
```

| Option | Description |
|--------|-------------|
| `-s, --selector <sel>` | Root element to analyze (default: `body`) |

**Toolbox module:** 25-layout-debugger | **CDP:** `Runtime.evaluate`, `DOM.getBoxModel`

---

#### `animation <tab>`

Control CSS/Web animation playback rate. Use 0 to pause, 1 for normal speed, 0.5 for slow motion.

```bash
node dist/browser.js animation 0 --rate 0      # pause
node dist/browser.js animation 0 --rate 0.5    # slow motion
node dist/browser.js animation 0 --rate 1      # resume normal
```

| Option | Description |
|--------|-------------|
| `--rate <speed>` | Playback rate: 0=pause, 1=normal (default: 0) |

**Toolbox module:** 27-animation-controller | **CDP:** `Animation.enable`, `Animation.setPlaybackRate`

---

#### `tokens <tab>`

Extract design tokens from the page: colors, font families, font sizes, spacing values, and border radii. Scans computed styles across up to 500 elements.

```bash
node dist/browser.js tokens 0
```

**Output:** `{colors: [...], fonts: [...], fontSizes: [...], spacing: [...], borderRadii: [...]}`

**Toolbox module:** 26-design-tokens | **CDP:** `Runtime.evaluate`, `CSS.getComputedStyleForNode`

---

### Advanced — Code Quality & Debugging

Responsive testing, dead code detection, DOM tracking, element highlighting, page comparison, and design review.

---

#### `responsive <tab>`

Take screenshots at multiple breakpoints: mobile (375x667), tablet (768x1024), and desktop (1440x900). Resets emulation after capture.

```bash
node dist/browser.js responsive 0
node dist/browser.js responsive 0 --output shots
```

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Output directory (default: `screenshots`) |

**Output:** `{screenshots: [{breakpoint, width, height, path}]}`

**Toolbox modules:** 28-responsive-tester | **CDP:** `Emulation.setDeviceMetricsOverride`, `Page.captureScreenshot`

---

#### `dead-code <tab>`

Find unused CSS rules and JavaScript code. Tracks coverage across a page reload.

```bash
node dist/browser.js dead-code 0
```

**Output:** `{css: {totalRules, usedRules, unusedPercentage}, js: {totalBytes, usedBytes, unusedPercentage, files: [...]}}`

**Toolbox module:** 29-dead-code-finder | **CDP:** `CSS.startRuleUsageTracking`, `Profiler.startPreciseCoverage`

---

#### `dom-history <tab>`

Track DOM mutations using a MutationObserver. Records childList, attribute, and characterData changes.

```bash
node dist/browser.js dom-history 0
node dist/browser.js dom-history 0 --duration 10000
```

| Option | Description |
|--------|-------------|
| `--duration <ms>` | Observation window (default: 5000) |

**Toolbox module:** 30-dom-historian | **CDP:** `Runtime.evaluate` (MutationObserver)

---

#### `highlight <tab> <selector>`

Highlight all elements matching a CSS selector with a colored overlay. Scrolls the first match into view.

```bash
node dist/browser.js highlight 0 "button"
node dist/browser.js highlight 0 ".error" --color "rgba(255,0,0,0.5)"
```

| Option | Description |
|--------|-------------|
| `--color <color>` | Highlight color (default: `rgba(255,0,0,0.3)`) |

**Toolbox module:** 31-element-highlighter | **CDP:** `Runtime.evaluate`, `DOM.highlightNode`

---

#### `diff <tab1> <tab2>`

Compare two open tabs. Extracts text, headings, and metadata from each, then computes word-level similarity (Jaccard) and lists unique content.

```bash
node dist/browser.js diff 0 1
```

**Output:** `{tab1: {title, url}, tab2: {title, url}, differences: {titleMatch, textSimilarity, uniqueToTab1, uniqueToTab2}}`

**Toolbox module:** 32-visual-differ | **CDP:** `Runtime.evaluate` on both tabs

---

#### `design-review <tab>`

Extract the full design structure of a page for AI-powered review: typography hierarchy, color usage, spacing patterns, image dimensions, layout structure, and responsiveness hints.

```bash
node dist/browser.js design-review 0
```

**Toolbox module:** 35-design-reviewer | **CDP:** `Runtime.evaluate`

---

## Launcher Scripts

### Bash (`scripts/start-chrome.sh`)

Works on macOS, Linux, WSL, and Git Bash on Windows. Auto-detects Chrome location.

```bash
bash scripts/start-chrome.sh          # default port 9222
bash scripts/start-chrome.sh 9333     # custom port
```

### PowerShell (`scripts/start-chrome.ps1`)

Works on Windows with PowerShell.

```powershell
.\scripts\start-chrome.ps1              # default port 9222
.\scripts\start-chrome.ps1 -Port 9333   # custom port
```

Both launchers:
- Kill existing Chrome debug instances on the port
- Create a temporary profile directory
- Start Chrome with `--remote-debugging-port`
- Verify the debug endpoint is responding

## Skills (for Claude Code)

The `skills/` directory contains 42 markdown files, one per command. Each skill file has frontmatter (`name`, `description`) and documents usage, options, example invocations, and expected JSON output. These files teach Claude Code how to use each command effectively.

## Module Mapping

| CLI Command | Toolbox Module |
|------------|----------------|
| `list`, `close`, `switch` | 02-tab-orchestrator |
| `open`, `back`, `forward` | 01-navigator |
| `elements` | 03-dom-explorer |
| `desc` | 04-accessibility-reader |
| `content`, `content-all`, `html` | 05-content-scraper |
| `click` | 06-clicker |
| `type` | 07-typer |
| `fill-form` | 08-form-filler |
| `scroll` | 09-scroller |
| `drag` | 10-drag-drop |
| `screenshot` | 11-screenshotter |
| `record` | 12-screen-recorder |
| `eval` | 13-js-executor |
| `console` | 14-console-monitor |
| `network` | 15-request-watcher |
| `mock-api` | 16-api-mocker |
| `cookies` | 17-cookie-manager |
| `emulate` | 18-device-emulator |
| `dialog` | 19-dialog-handler |
| `wait` | 20-wait-strategies |
| `theme` | 21-ui-themer |
| `audit-a11y` | 22-accessibility-auditor |
| `perf`, `waterfall`, `memory` | 23-performance-xray |
| `read` | 24-reading-mode |
| `layout` | 25-layout-debugger |
| `tokens` | 26-design-tokens |
| `animation` | 27-animation-controller |
| `responsive` | 28-responsive-tester |
| `dead-code` | 29-dead-code-finder |
| `dom-history` | 30-dom-historian |
| `highlight` | 31-element-highlighter |
| `diff` | 32-visual-differ |
| `design-review` | 35-design-reviewer |
| `search` | **NEW** (not in toolbox) |

## License

MIT
