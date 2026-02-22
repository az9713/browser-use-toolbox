---
name: post-tweet
description: Post a tweet on X (Twitter) using the browser CLI
---

# Post a Tweet on X (Twitter)

Automates posting a tweet on X. Requires Chrome to be running with a profile that is already logged into X (use `--profile` flag when starting Chrome).

Tested and verified against live X (Feb 2026).

## Prerequisites

- Chrome started with `--profile` flag (real profile, logged into X)
- CLI built: `npm run build`
- **Important**: Close ALL Chrome windows before launching with `--profile`

## Pre-Flight Checks

### 1. Chrome profile crash state

If Chrome was force-killed previously, fix the crash state before launching:

```powershell
$prefs = Get-Content "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences" -Raw
$prefs = $prefs -replace '"exit_type":"Crashed"', '"exit_type":"Normal"'
Set-Content "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences" $prefs
```

### 2. Chrome sign-in prompt

On first launch with a real profile, Chrome may show a "Make Chrome your own" / "Continue as [Name]" page on `chrome://signin-dice-web-intercept`. This takes over tab 0.

**Fix**: Run `list` to check tab titles. X may be on a different tab index.

### 3. X login page

If X shows "Happening now" / "Join today" instead of your feed, you're not logged in. Options:
- Click "Sign in as [Name]" via Google SSO (may need manual OAuth interaction)
- Log in manually in the Chrome window, then continue with CLI

## Workflow

### Step 1 — Open X compose page

Navigate directly to the compose URL (this opens the compose dialog as a modal overlay):

```bash
node dist/browser.js open https://x.com/compose/post
```

Wait for it to load:

```bash
sleep 3
node dist/browser.js screenshot <tab>   # Verify compose dialog is visible
```

You should see the "What's happening?" compose dialog with a Post button.

### Step 2 — Check tabs

Always verify tab indices after navigation:

```bash
node dist/browser.js list
```

### Step 3 — Type the tweet

**Use `eval` with `execCommand('insertText')` — this is the most reliable method.** X uses contenteditable divs with React state management, and `execCommand` triggers the proper React event handlers.

```bash
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('div[data-testid=\"tweetTextarea_0\"]'); el.focus(); document.execCommand('insertText', false, 'Your tweet text here'); return 'typed'; })()"
```

**Important**: Always wrap `eval` expressions in `(function(){ ... })()` IIFE to avoid "Identifier already declared" errors from consecutive eval calls.

**Note**: The `type` command with `--selector` may also work but `eval` is more reliable for X's contenteditable divs:

```bash
# Alternative (less reliable)
node dist/browser.js type <tab> "Your tweet text here" --selector "div[data-testid='tweetTextarea_0']"
```

### Step 4 — Verify before posting

Always screenshot to confirm the tweet text looks correct:

```bash
node dist/browser.js screenshot <tab>
```

Check that:
- The tweet text is visible in the compose box
- URLs are auto-detected and highlighted (X auto-linkifies URLs)
- Character count is within limit

### Step 5 — Post the tweet

**Use `eval` with `data-testid="tweetButton"` — this is the reliable method.**

```bash
node dist/browser.js eval <tab> "(function(){ var btn = document.querySelector('button[data-testid=\"tweetButton\"]'); btn.click(); return 'posted'; })()"
```

**DO NOT use `click <tab> "Post"`** — while it may work on X (unlike Gmail's "Send"), the `eval` approach with `data-testid` is more precise and avoids potential text collisions with other elements containing "Post".

### Step 6 — Confirm posted

```bash
sleep 3
node dist/browser.js screenshot <tab>
```

The compose dialog should be gone. To verify the tweet exists, navigate to your profile:

```bash
node dist/browser.js open https://x.com/<your_username>
sleep 3
node dist/browser.js scroll <tab> down
node dist/browser.js screenshot <tab>
```

Your tweet should appear at the top of your Posts tab.

## Full Working Example

This is the exact sequence that was tested and verified:

```bash
# 1. Open compose dialog
node dist/browser.js open https://x.com/compose/post
sleep 3

# 2. Check tabs
node dist/browser.js list
# Note the correct tab index (shown as <tab>)

# 3. Type tweet (using IIFE to avoid scope issues)
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('div[data-testid=\"tweetTextarea_0\"]'); el.focus(); document.execCommand('insertText', false, 'Your tweet text here! github.com/az9713/browser-use-toolbox'); return 'typed'; })()"

# 4. Verify
node dist/browser.js screenshot <tab>

# 5. Post (use eval with data-testid, NOT click "Post")
node dist/browser.js eval <tab> "(function(){ var btn = document.querySelector('button[data-testid=\"tweetButton\"]'); btn.click(); return 'posted'; })()"

# 6. Confirm
sleep 3
node dist/browser.js screenshot <tab>
```

## Alternative: Post from the Home Feed

```bash
# Open X home
node dist/browser.js open https://x.com/home
sleep 3

# Click the compose area
node dist/browser.js click <tab> "What is happening"
sleep 1

# Type (always use IIFE)
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('div[data-testid=\"tweetTextarea_0\"]'); el.focus(); document.execCommand('insertText', false, 'Your tweet here'); return 'typed'; })()"

# Post
node dist/browser.js eval <tab> "(function(){ var btn = document.querySelector('button[data-testid=\"tweetButton\"]'); btn.click(); return 'posted'; })()"
```

## Posting a Reply

```bash
# Open the tweet to reply to
node dist/browser.js open https://x.com/username/status/1234567890
sleep 3

# Click the reply area
node dist/browser.js click <tab> "Post your reply"
sleep 1

# Type reply (use IIFE)
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('div[data-testid=\"tweetTextarea_0\"]'); el.focus(); document.execCommand('insertText', false, 'Your reply here'); return 'typed'; })()"

# Click Reply
node dist/browser.js eval <tab> "(function(){ var btn = document.querySelector('button[data-testid=\"tweetButton\"]'); btn.click(); return 'posted'; })()"
```

## Finding Your Profile Username

If you don't know your X handle, use this:

```bash
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('a[data-testid=\"AppTabBar_Profile_Link\"]'); return el ? el.getAttribute('href') : 'not found'; })()"
```

Returns something like `/az9713`.

## Known Gotchas

| Problem | Cause | Fix |
|---------|-------|-----|
| Compose dialog doesn't appear | X still loading or redirect | Use `sleep 3` after `open`, verify with `screenshot` |
| `eval` fails with "Identifier already declared" | Previous `const` still in scope | Wrap all eval JS in `(function(){ ... })()` IIFE |
| `type` command doesn't trigger React state | X uses contenteditable with React | Use `eval` with `execCommand('insertText', ...)` instead |
| Not logged in (shows "Join today") | No active X session in profile | Log in manually via Chrome window, or use Google SSO |
| Chrome sign-in prompt on tab 0 | First real-profile launch | Run `list`, find X on different tab index |
| Tweet not visible on "For you" feed | X algorithm delays | Check your profile page directly (`x.com/<username>`) |
| URL in tweet not linkified | Need to wait for X to process | Wait 2-3 seconds after typing before screenshotting |
| Profile crash state blocks debug port | Chrome `exit_type: "Crashed"` | Fix Preferences file before launching (see Pre-Flight) |

## X DOM Selectors Reference

These `data-testid` selectors are stable and used throughout X's interface:

| Selector | Element |
|----------|---------|
| `div[data-testid="tweetTextarea_0"]` | Compose text area |
| `button[data-testid="tweetButton"]` | Post/Reply button |
| `a[data-testid="AppTabBar_Profile_Link"]` | Profile link in sidebar |
| `div[data-testid="tweetText"]` | Tweet text in timeline |
| `article[data-testid="tweet"]` | Tweet article container |

## Notes

- Always verify with `screenshot` before posting — there is no undo for tweets (edit is limited)
- X's `data-testid` attributes are the most reliable selectors (more stable than class names)
- All `eval` expressions must use IIFE pattern `(function(){ ... })()` to avoid scope collisions
- URLs in tweets are automatically shortened and linkified by X
- GitHub URLs generate rich card previews (repo name, description, stats)
- Character limit is 280 for free accounts, more for X Premium
- For threads, repeat the compose → type → post sequence after each tweet
