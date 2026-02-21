---
name: compose-gmail
description: Compose and send an email via Gmail using the browser CLI
---

# Compose and Send Gmail

Automates composing and sending an email through Gmail. Requires Chrome to be running with a profile that is already logged into Gmail (use `--profile` flag when starting Chrome).

## Prerequisites

- Chrome started with `--profile` flag (real profile, logged into Gmail)
- CLI built: `npm run build`

## Workflow

### Step 1 — Open Gmail

```bash
node dist/browser.js open https://mail.google.com
```

Wait for Gmail to load:

```bash
node dist/browser.js wait 0 networkidle
```

### Step 2 — Verify you're logged in

```bash
node dist/browser.js content 0
```

If you see a sign-in page, the profile is not logged into Gmail. The user must log in manually first.

### Step 3 — Click Compose

```bash
node dist/browser.js click 0 "Compose"
```

Wait for the compose window to appear:

```bash
node dist/browser.js wait 0 "selector:div[aria-label='New Message']" --timeout 5000
```

### Step 4 — Fill in the To field

```bash
node dist/browser.js type 0 "recipient@example.com" --selector "input[aria-label='To recipients']"
```

Press Tab to confirm the recipient:

```bash
node dist/browser.js eval 0 "document.querySelector('input[aria-label=\"To recipients\"]').dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab', keyCode: 9, bubbles: true}))"
```

### Step 5 — Fill in the Subject

```bash
node dist/browser.js type 0 "Your subject here" --selector "input[name='subjectbox']"
```

### Step 6 — Type the email body

```bash
node dist/browser.js type 0 "Your email body here" --selector "div[aria-label='Message Body']"
```

### Step 7 — Send the email

```bash
node dist/browser.js click 0 "Send"
```

### Step 8 — Verify

Take a screenshot to confirm:

```bash
node dist/browser.js screenshot 0
```

## Full Example

```bash
# Open Gmail
node dist/browser.js open https://mail.google.com
node dist/browser.js wait 0 networkidle

# Compose
node dist/browser.js click 0 "Compose"
node dist/browser.js wait 0 "selector:div[aria-label='New Message']" --timeout 5000

# Fill fields
node dist/browser.js type 0 "friend@example.com" --selector "input[aria-label='To recipients']"
node dist/browser.js type 0 "Hello from CLI" --selector "input[name='subjectbox']"
node dist/browser.js type 0 "This email was sent using the Chrome CDP CLI!" --selector "div[aria-label='Message Body']"

# Send
node dist/browser.js click 0 "Send"
node dist/browser.js screenshot 0
```

## Troubleshooting

- **"Compose" not found**: Gmail may still be loading. Run `wait 0 networkidle` and retry.
- **Not logged in**: Start Chrome with `--profile` flag to use your real profile.
- **Type not working**: Gmail uses contenteditable divs. Use `eval` to set innerHTML if `type` fails:
  ```bash
  node dist/browser.js eval 0 "document.querySelector('div[aria-label=\"Message Body\"]').innerHTML = 'Your message here'"
  ```

## Notes

- Always verify with `content` or `screenshot` before clicking Send
- Gmail's DOM changes frequently — selectors may need updating
- For attachments, use `eval` to trigger the file input programmatically
