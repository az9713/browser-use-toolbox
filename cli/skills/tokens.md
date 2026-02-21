---
name: tokens
description: Extract design tokens (colors, fonts, spacing) from a page
---

# browser tokens

Extracts design tokens including color palettes, typography, and spacing values from the page's computed styles.

## Usage

```bash
node dist/browser.js tokens <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js tokens 0
```

## Output

Returns JSON:
```json
{
  "colors": ["#1a1a2e", "#16213e", "#0f3460", "#e94560"],
  "fonts": ["Inter", "Georgia", "monospace"],
  "fontSizes": ["12px", "14px", "16px", "24px", "32px"],
  "spacing": ["4px", "8px", "16px", "24px", "32px", "48px"],
  "borderRadius": ["4px", "8px", "50%"]
}
```

## Notes

- Colors are deduplicated and sorted by frequency of use
- Extracts from computed styles across all visible elements
- Useful for reverse-engineering a design system or creating a style guide
