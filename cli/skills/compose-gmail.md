---
name: compose-gmail
description: Compose and send an email via Gmail using the browser CLI
---

# Compose and Send Gmail

Automates composing and sending an email through Gmail. Requires Chrome to be running with a profile that is already logged into Gmail (use `--profile` flag when starting Chrome).

Tested and verified against live Gmail (Feb 2026).

## Prerequisites

- Chrome started with `--profile` flag (real profile, logged into Gmail)
- CLI built: `npm run build`
- **Important**: Close ALL Chrome windows before launching with `--profile`

## Pre-Flight Checks

Before starting the workflow, handle these common blockers:

### 1. Chrome sign-in prompt

When launching Chrome with a real profile for the first time via `--remote-debugging-port`, Chrome may show a "Make Chrome your own" / "Continue as [Name]" prompt on an internal `chrome://signin-dice-web-intercept` page. This takes over tab 0 and pushes Gmail to tab 1.

**Fix**: Always run `list` first and look at the tab titles. If you see the sign-in page, either dismiss it or find Gmail on a different tab index.

```bash
node dist/browser.js list
# If tab 0 is chrome://signin-dice-web-intercept, Gmail will be on tab 1
```

### 2. Tab index shifting

Tabs can appear and disappear (Chrome internal pages, popups). **Always re-run `list` after any unexpected error** like "Tab index X out of range".

```bash
node dist/browser.js list   # Get fresh tab indices
```

### 3. Mobile notification popup

Gmail frequently shows a "Pause mobile notifications while you're using this device" dialog that blocks the inbox. Dismiss it first:

```bash
node dist/browser.js click <tab> "No thanks"
```

### 4. Profile crash state

If Chrome was force-killed previously, it sets `exit_type: "Crashed"` in Preferences, which can prevent the debug port from binding. Fix with PowerShell before launching:

```powershell
$prefs = Get-Content "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences" -Raw
$prefs = $prefs -replace '"exit_type":"Crashed"', '"exit_type":"Normal"'
Set-Content "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences" $prefs
```

## Workflow

### Step 1 — Open Gmail

```bash
node dist/browser.js open https://mail.google.com
```

Wait for Gmail to load (give it several seconds — Gmail is heavy):

```bash
sleep 5
node dist/browser.js list   # Confirm tab index and title
```

### Step 2 — Verify you're logged in

```bash
node dist/browser.js screenshot <tab>
```

If you see a sign-in page, the profile is not logged into Gmail. The user must log in manually in the Chrome window first, then continue.

### Step 3 — Dismiss popups

Check for and dismiss any blocking popups:

```bash
# Mobile notification popup
node dist/browser.js click <tab> "No thanks"

# Cookie consent (if present)
node dist/browser.js click <tab> "Accept all"
```

It's OK if these fail with "No element found" — it just means there's no popup.

### Step 4 — Click Compose

```bash
node dist/browser.js click <tab> "Compose"
```

Wait for the compose window to appear:

```bash
sleep 2
node dist/browser.js screenshot <tab>   # Verify compose window is open
```

### Step 5 — Fill in the To field

```bash
node dist/browser.js type <tab> "recipient@example.com" --selector "input[aria-label='To recipients']"
```

Press Tab to confirm the recipient (converts typed text into a contact chip):

```bash
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('input[aria-label=\"To recipients\"]'); el.dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab', keyCode: 9, bubbles: true})); return 'done'; })()"
```

### Step 6 — Fill in the Subject

```bash
node dist/browser.js type <tab> "Your subject here" --selector "input[name='subjectbox']"
```

### Step 7 — Type the email body

```bash
node dist/browser.js type <tab> "Your email body here" --selector "div[aria-label='Message Body']"
```

**Note**: The `type` command may escape special characters (e.g., `!` becomes `\!`). If you need exact text, use `eval` instead:

```bash
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('div[aria-label=\"Message Body\"]'); el.focus(); document.execCommand('insertText', false, 'Your exact message here!'); return 'typed'; })()"
```

### Step 8 — Verify before sending

Always screenshot to confirm all fields are correct before sending:

```bash
node dist/browser.js screenshot <tab>
```

### Step 9 — Send the email

**DO NOT use `click <tab> "Send"`** — it matches "Send feedback to Google" (a hidden Gmail element) instead of the actual Send button.

Use `eval` with a precise selector instead:

```bash
node dist/browser.js eval <tab> "(function(){ var btn = document.querySelector('div[aria-label^=\"Send\"][role=\"button\"]'); btn.click(); return 'sent'; })()"
```

### Step 10 — Confirm sent

```bash
sleep 2
node dist/browser.js screenshot <tab>
```

The compose window should be gone. If sending to yourself, the email should appear in your inbox.

## Full Working Example

This is the exact sequence that was tested and verified:

```bash
# 1. Open Gmail
node dist/browser.js open https://mail.google.com
sleep 5

# 2. Check tabs (Gmail may not be on tab 0)
node dist/browser.js list
# Note: use the correct tab index below (shown as <tab>)

# 3. Dismiss popups (OK if these fail)
node dist/browser.js click <tab> "No thanks" 2>/dev/null

# 4. Click Compose
node dist/browser.js click <tab> "Compose"
sleep 2

# 5. Fill To field
node dist/browser.js type <tab> "recipient@example.com" --selector "input[aria-label='To recipients']"
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('input[aria-label=\"To recipients\"]'); el.dispatchEvent(new KeyboardEvent('keydown', {key:'Tab', keyCode:9, bubbles:true})); return 'ok'; })()"

# 6. Fill Subject
node dist/browser.js type <tab> "Hello from CLI" --selector "input[name='subjectbox']"

# 7. Type body (use eval for exact text without escaping issues)
node dist/browser.js eval <tab> "(function(){ var el = document.querySelector('div[aria-label=\"Message Body\"]'); el.focus(); document.execCommand('insertText', false, 'This email was composed and sent using the Chrome CDP CLI!'); return 'typed'; })()"

# 8. Verify before sending
node dist/browser.js screenshot <tab>

# 9. Send (DO NOT use click "Send" — use eval)
node dist/browser.js eval <tab> "(function(){ var btn = document.querySelector('div[aria-label^=\"Send\"][role=\"button\"]'); btn.click(); return 'sent'; })()"

# 10. Confirm
sleep 2
node dist/browser.js screenshot <tab>
```

## Known Gotchas

| Problem | Cause | Fix |
|---------|-------|-----|
| `click "Send"` sends wrong email or fails | Matches "Send feedback to Google" hidden element | Use `eval` with `querySelector('div[aria-label^="Send"][role="button"]')` |
| "Tab index X out of range" | Chrome internal tabs appeared/disappeared | Re-run `list` to get fresh tab indices |
| `eval` fails with "Identifier already declared" | Previous `const` still in scope from prior eval | Wrap all eval JS in `(function(){ ... })()` IIFE |
| `type` escapes `!` to `\!` | Shell or CDP input escaping | Use `eval` with `execCommand('insertText', ...)` for exact text |
| Chrome doesn't bind debug port | `exit_type: "Crashed"` in Preferences | Fix Preferences file before launching (see Pre-Flight Checks) |
| "Make Chrome your own" prompt on tab 0 | First use of real profile with debug flag | Dismiss or ignore; find Gmail on a different tab index |
| "Pause mobile notifications" popup | Gmail prompt for active sessions | Click "No thanks" to dismiss |
| Compose window not appearing | Gmail still loading | Add `sleep 2` after clicking Compose, verify with screenshot |

## Notes

- Always verify with `screenshot` before clicking Send — there is no undo
- Gmail's DOM uses aria-labels that are relatively stable across updates
- For attachments, use `eval` to trigger the file input programmatically
- All `eval` expressions should use IIFE pattern `(function(){ ... })()` to avoid scope collisions
- The `type` command with `--selector` works well for standard input fields (To, Subject) but `eval` with `execCommand` is more reliable for contenteditable divs (body)
