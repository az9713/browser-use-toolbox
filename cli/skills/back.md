---
name: back
description: Navigate back in browser history for a tab
---

# browser back

Navigates the specified tab back one step in its browser history.

## Usage

```bash
node dist/browser.js back <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js back 0
```

## Output

Returns JSON:
```json
{"success": true, "tab": 0, "url": "https://example.com/previous-page"}
```

## Notes

- Has no effect if there is no history to go back to
- Waits for the page to finish loading before returning
- Use `forward` to go forward in history
