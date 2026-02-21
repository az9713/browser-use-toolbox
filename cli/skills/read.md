---
name: read
description: Extract clean article content from a page (reader mode)
---

# browser read

Extracts the main article or content from the specified tab's page, stripping navigation, ads, and boilerplate.

## Usage

```bash
node dist/browser.js read <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js read 0
```

## Output

Returns JSON:
```json
{
  "title": "How to Build a CLI Tool",
  "byline": "Jane Doe",
  "publishedDate": "2024-01-15",
  "wordCount": 1240,
  "content": "Building a CLI tool can be straightforward if you..."
}
```

## Notes

- Works best on article and blog post pages
- Returns only the main content body, excluding headers, footers, and sidebars
- Uses readability heuristics — results may vary on non-article pages
