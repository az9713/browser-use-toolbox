---
name: forward
description: Navigate forward in browser history for a tab
---

# browser forward

Navigates the specified tab forward one step in its browser history.

## Usage

```bash
node dist/browser.js forward <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js forward 0
```

## Output

Returns JSON:
```json
{"success": true, "tab": 0, "url": "https://example.com/next-page"}
```

## Notes

- Has no effect if already at the most recent page in history
- Waits for the page to finish loading before returning
- Use `back` to go backward in history
