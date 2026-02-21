---
name: open
description: Navigate to a URL in the current or a new tab
---

# browser open

Navigates to the specified URL, either in the current active tab or in a new tab.

## Usage

```bash
node dist/browser.js open <url> [options]
```

## Options

- `--new-tab` - Open the URL in a new tab instead of the current tab
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js open https://example.com --new-tab
```

## Output

Returns JSON:
```json
{"success": true, "url": "https://example.com", "tab": 1}
```

## Notes

- Without `--new-tab`, navigates the currently active tab
- Waits for the page to finish loading before returning
