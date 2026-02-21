---
name: diff
description: Compare the content and structure of two tabs
---

# browser diff

Compares the text content, title, and structure of two open tabs and reports differences.

## Usage

```bash
node dist/browser.js diff <tab1> <tab2> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js diff 0 1
```

## Output

Returns JSON:
```json
{
  "tab1": {"index": 0, "url": "https://example.com/v1"},
  "tab2": {"index": 1, "url": "https://example.com/v2"},
  "titleChanged": true,
  "contentDiff": [
    {"type": "removed", "text": "Old pricing: $9/mo"},
    {"type": "added", "text": "New pricing: $12/mo"}
  ],
  "elementCountDiff": {"buttons": "+2", "links": "-1"}
}
```

## Notes

- Compares visible text content, not raw HTML
- Useful for A/B testing comparison or detecting page changes
- Both tab indices must be valid open tabs from the `list` command
