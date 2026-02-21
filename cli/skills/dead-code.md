---
name: dead-code
description: Find unused CSS and JavaScript on a page
---

# browser dead-code

Analyzes the specified tab's page to identify CSS rules and JavaScript functions that are loaded but never used.

## Usage

```bash
node dist/browser.js dead-code <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js dead-code 0
```

## Output

Returns JSON:
```json
{
  "css": {
    "unusedRules": 142,
    "totalRules": 890,
    "unusedPercent": 15.96,
    "sources": [{"file": "main.css", "unusedBytes": 12400, "totalBytes": 45000}]
  },
  "js": {
    "unusedBytes": 34000,
    "totalBytes": 120000,
    "unusedPercent": 28.3
  }
}
```

## Notes

- Uses Chrome Coverage API to measure code actually executed during page load
- Interact with the page before running to get more accurate results
- High unused percentages indicate opportunities to reduce bundle size
