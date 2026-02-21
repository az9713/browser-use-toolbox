---
name: browse-authenticated
description: Guide for using Chrome CLI with logged-in sessions (Gmail, X, GitHub, etc.)
---

# Authenticated Browser Automation

This skill explains how to use the Chrome CDP CLI with your real Chrome profile, giving the agent access to sites where you're already logged in (Gmail, X/Twitter, GitHub, Amazon, etc.).

## How It Works

Chrome stores your login sessions (cookies, localStorage, saved passwords) in a **profile directory**. By default, the CLI creates a fresh temp profile with no logins. The `--profile` flag tells the launcher to use your real Chrome profile instead.

## Quick Start

### Step 1 — Close Chrome completely

Chrome only allows one instance per profile. You must close ALL Chrome windows first.

- Windows: Check Task Manager (Ctrl+Shift+Esc) → End all "Google Chrome" processes
- macOS: Cmd+Q Chrome, or `killall "Google Chrome"`
- Linux: `killall chrome`

### Step 2 — Launch Chrome with your profile

**Git Bash (Windows):**
```bash
bash scripts/start-chrome.sh --profile
```

**PowerShell (Windows):**
```powershell
.\scripts\start-chrome.ps1 -Profile
```

**macOS / Linux:**
```bash
bash scripts/start-chrome.sh --profile
```

### Step 3 — Verify logged-in sessions

```bash
node dist/browser.js open https://mail.google.com
node dist/browser.js wait 0 networkidle
node dist/browser.js content 0
```

If you see your inbox content (not a login page), you're good.

### Step 4 — Use the CLI as normal

All 42 commands work exactly the same. The only difference is you now have access to authenticated pages.

## Profile Locations

The launcher auto-detects your profile. Here are the default paths:

| Platform | Default Chrome Profile Directory |
|----------|--------------------------------|
| Windows | `%LOCALAPPDATA%\Google\Chrome\User Data` |
| macOS | `~/Library/Application Support/Google/Chrome` |
| Linux | `~/.config/google-chrome` |

## Custom Profile Directory

If you use multiple Chrome profiles or want a dedicated automation profile:

```bash
# Bash
bash scripts/start-chrome.sh --profile-dir "/path/to/custom/profile"

# PowerShell
.\scripts\start-chrome.ps1 -ProfileDir "C:\path\to\custom\profile"
```

## Creating a Dedicated Automation Profile

For safety, you may want a separate Chrome profile just for automation:

1. Open Chrome normally
2. Click your profile icon (top right) → "Add" → Create a new profile
3. Log into Gmail, X, GitHub, etc. in this new profile
4. Note the profile directory (check `chrome://version` → "Profile Path")
5. Close Chrome
6. Launch with that specific profile:
   ```bash
   bash scripts/start-chrome.sh --profile-dir "/path/to/Profile 2"
   ```

## Security Considerations

- The CLI has full access to your logged-in sessions — treat it like leaving your browser open
- Never share your profile directory
- Use a dedicated automation profile to limit exposure
- The CLI only operates on `localhost` — no data leaves your machine unless a command explicitly navigates to a remote URL

## Troubleshooting

- **"Chrome didn't start"**: Another Chrome instance is using the profile. Close ALL Chrome windows and processes first.
- **"Not logged in"**: Your sessions may have expired. Open Chrome normally, log in, close it, then relaunch with `--profile`.
- **Wrong profile**: If you have multiple Chrome profiles, use `--profile-dir` with the specific path. Check `chrome://version` in Chrome to see your current profile path.

## Supported Sites

Any site where you're logged in via Chrome will work. Common examples:

| Site | What the CLI can do |
|------|-------------------|
| Gmail | Read emails, compose, send, search |
| X / Twitter | Post tweets, read timeline, reply |
| GitHub | Create issues, PRs, read repos |
| Google Docs | Read/edit documents |
| Amazon | Browse products, manage orders |
| LinkedIn | Read messages, browse profiles |
| Slack (web) | Read/send messages |
