---
name: search
description: Search a page's text content for matching strings
---

# browser search

Searches the visible text content of the specified tab for occurrences of the given query.

## Usage

```bash
node dist/browser.js search <tab> <query> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js search 0 "pricing"
node dist/browser.js search 0 "error"
```

## Output

Returns JSON:
```json
{
  "query": "pricing",
  "count": 3,
  "matches": [
    {"context": "See our pricing plans below", "selector": "h2.pricing-header"},
    {"context": "Pricing starts at $9/mo", "selector": "p.price-desc"}
  ]
}
```

## Notes

- Returns surrounding context for each match
- Search is case-insensitive by default
- Useful for verifying page content or finding specific sections
