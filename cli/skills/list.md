---
name: list
description: List all open Chrome tabs with index, id, title, and url
---

# browser list

Lists all currently open Chrome tabs, returning their index, id, title, and URL.

## Usage

```bash
node dist/browser.js list [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js list
```

## Output

Returns JSON:
```json
[
  {"index": 0, "id": "ABC123", "title": "Google", "url": "https://google.com"},
  {"index": 1, "id": "DEF456", "title": "GitHub", "url": "https://github.com"}
]
```

## Notes

- Use the `index` value to reference tabs in other commands
- Requires Chrome to be running with `--remote-debugging-port=9222`
