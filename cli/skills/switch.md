---
name: switch
description: Activate and focus a tab by index
---

# browser switch

Brings the specified tab to the foreground, making it the active focused tab.

## Usage

```bash
node dist/browser.js switch <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js switch 2
```

## Output

Returns JSON:
```json
{"success": true, "tab": 2, "title": "GitHub", "url": "https://github.com"}
```

## Notes

- `<tab>` is the index from the `list` command
- Useful before taking screenshots or interacting with a specific tab
- Does not navigate or change the tab's content
