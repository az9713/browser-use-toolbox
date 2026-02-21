---
name: content-all
description: Get visible text content from all open tabs
---

# browser content-all

Extracts and returns the visible text content from every open Chrome tab at once.

## Usage

```bash
node dist/browser.js content-all [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js content-all
```

## Output

Returns JSON:
```json
[
  {"tab": 0, "url": "https://google.com", "content": "Search the web..."},
  {"tab": 1, "url": "https://github.com", "content": "Where the world builds software..."}
]
```

## Notes

- Returns an array with one entry per open tab
- Useful for scanning all tabs for specific content
- Equivalent to running `content` on each tab individually
