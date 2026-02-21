---
name: waterfall
description: Show network request timing waterfall for a page
---

# browser waterfall

Captures and displays the network request timing waterfall for the specified tab's page load.

## Usage

```bash
node dist/browser.js waterfall <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js waterfall 0
```

## Output

Returns JSON:
```json
{
  "requests": [
    {"url": "https://example.com/", "start": 0, "dns": 12, "connect": 45, "ttfb": 134, "download": 23, "total": 214, "size": 8192},
    {"url": "https://example.com/style.css", "start": 220, "dns": 0, "connect": 0, "ttfb": 45, "download": 12, "total": 57, "size": 4096}
  ],
  "totalTime": 891
}
```

## Notes

- All times are in milliseconds, relative to navigation start
- `ttfb` is Time To First Byte
- Reload the page before running to capture full waterfall data
