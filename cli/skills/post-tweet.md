---
name: post-tweet
description: Post a tweet on X (Twitter) using the browser CLI
---

# Post a Tweet on X (Twitter)

Automates posting a tweet on X. Requires Chrome to be running with a profile that is already logged into X (use `--profile` flag when starting Chrome).

## Prerequisites

- Chrome started with `--profile` flag (real profile, logged into X)
- CLI built: `npm run build`

## Workflow

### Step 1 — Open X

```bash
node dist/browser.js open https://x.com/compose/post
```

This goes directly to the compose screen. Wait for it to load:

```bash
node dist/browser.js wait 0 networkidle
```

### Step 2 — Verify you're logged in

```bash
node dist/browser.js content 0
```

If you see a sign-in/sign-up page, the profile is not logged into X. The user must log in manually first.

### Step 3 — Type the tweet

The compose box is a contenteditable div:

```bash
node dist/browser.js type 0 "Your tweet text here" --selector "div[data-testid='tweetTextarea_0']"
```

If `type` doesn't work with the selector, use eval:

```bash
node dist/browser.js eval 0 "const el = document.querySelector('div[data-testid=\"tweetTextarea_0\"]'); el.focus(); document.execCommand('insertText', false, 'Your tweet text here')"
```

### Step 4 — Post the tweet

```bash
node dist/browser.js click 0 "Post"
```

### Step 5 — Verify

```bash
node dist/browser.js screenshot 0
```

## Full Example

```bash
# Open X compose
node dist/browser.js open https://x.com/compose/post
node dist/browser.js wait 0 networkidle

# Type tweet
node dist/browser.js eval 0 "const el = document.querySelector('div[data-testid=\"tweetTextarea_0\"]'); el.focus(); document.execCommand('insertText', false, 'Hello from Chrome CDP CLI! 🚀')"

# Post
node dist/browser.js click 0 "Post"
node dist/browser.js screenshot 0
```

## Alternative: Post from the Home Feed

```bash
# Open X home
node dist/browser.js open https://x.com/home
node dist/browser.js wait 0 networkidle

# Click the compose area ("What is happening?!")
node dist/browser.js click 0 "What is happening"

# Type
node dist/browser.js eval 0 "const el = document.querySelector('div[data-testid=\"tweetTextarea_0\"]'); el.focus(); document.execCommand('insertText', false, 'Your tweet here')"

# Post
node dist/browser.js click 0 "Post"
```

## Posting a Reply

```bash
# Open the tweet to reply to
node dist/browser.js open https://x.com/username/status/1234567890
node dist/browser.js wait 0 networkidle

# Click the reply area
node dist/browser.js click 0 "Post your reply"

# Type reply
node dist/browser.js eval 0 "const el = document.querySelector('div[data-testid=\"tweetTextarea_0\"]'); el.focus(); document.execCommand('insertText', false, 'Your reply here')"

# Click Reply
node dist/browser.js click 0 "Reply"
```

## Troubleshooting

- **"Post" button not found**: X may still be loading. Run `wait 0 networkidle` and retry.
- **Not logged in**: Start Chrome with `--profile` flag to use your real profile.
- **Type not working**: X uses contenteditable divs with complex React state. The `eval` + `execCommand('insertText')` approach works best because it simulates real user typing that React detects.
- **Tweet not posting**: X may require accepting cookies first. Check `content 0` for cookie banners and dismiss them with `click 0 "Accept"`.

## Notes

- Always verify with `content` or `screenshot` before clicking Post
- X's DOM uses `data-testid` attributes which are relatively stable
- For threads, repeat the type + post sequence after each tweet posts
- Character limit is 280 (or more for X Premium)
