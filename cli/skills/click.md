---
name: click
description: Click an element by its visible text
---

# browser click

Finds and clicks an element on the page that matches the given visible text.

## Usage

```bash
node dist/browser.js click <tab> <text> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js click 0 "Sign In"
node dist/browser.js click 0 "Submit"
```

## Output

Returns JSON:
```json
{"success": true, "element": "button", "text": "Sign In"}
```

## Notes

- Matches the first element whose visible text contains the given string
- Text matching is case-sensitive
- For clicking by CSS selector, use `eval` with `document.querySelector`
- Waits briefly for navigation if the click triggers a page load
