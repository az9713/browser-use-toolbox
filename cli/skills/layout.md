---
name: layout
description: Visualize CSS layout properties for page elements
---

# browser layout

Returns computed CSS layout information (box model, position, dimensions) for elements on the page.

## Usage

```bash
node dist/browser.js layout <tab> [options]
```

## Options

- `--selector <sel>` - CSS selector to limit analysis to specific elements
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js layout 0 --selector ".container"
node dist/browser.js layout 0
```

## Output

Returns JSON:
```json
[
  {
    "selector": ".container",
    "display": "flex",
    "position": "relative",
    "width": 1200,
    "height": 800,
    "margin": {"top": 0, "right": "auto", "bottom": 0, "left": "auto"},
    "padding": {"top": 16, "right": 16, "bottom": 16, "left": 16}
  }
]
```

## Notes

- Returns computed values, not the declared CSS values
- Without `--selector`, analyzes key structural elements on the page
- Useful for debugging layout issues and understanding the box model
