---
name: design-review
description: Extract page structure and styling information for design review
---

# browser design-review

Extracts a structured overview of the page's design including layout hierarchy, typography, colors, and component breakdown.

## Usage

```bash
node dist/browser.js design-review <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js design-review 0
```

## Output

Returns JSON:
```json
{
  "title": "My App",
  "url": "https://myapp.com",
  "viewport": {"width": 1280, "height": 800},
  "sections": [
    {"tag": "header", "role": "banner", "children": 3},
    {"tag": "main", "role": "main", "children": 12},
    {"tag": "footer", "role": "contentinfo", "children": 5}
  ],
  "typography": {"headings": ["h1", "h2", "h3"], "bodyFont": "Inter", "baseFontSize": "16px"},
  "colorPalette": ["#ffffff", "#1a1a1a", "#007bff"],
  "components": {"buttons": 4, "forms": 1, "images": 6, "links": 22}
}
```

## Notes

- Combines data from `tokens`, `layout`, and `desc` into a single design-focused report
- Useful for handoff documentation and design audits
- Run after page is fully loaded for complete results
