---
name: highlight
description: Highlight matching elements on a page with a colored overlay
---

# browser highlight

Applies a colored highlight overlay to all elements matching the given CSS selector on the page.

## Usage

```bash
node dist/browser.js highlight <tab> <selector> [options]
```

## Options

- `--color <color>` - CSS color value for the highlight (default: `rgba(255,255,0,0.4)`)
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js highlight 0 "button" --color "rgba(255,0,0,0.3)"
node dist/browser.js highlight 0 ".error" --color "rgba(255,165,0,0.5)"
```

## Output

Returns JSON:
```json
{"success": true, "selector": "button", "count": 8, "color": "rgba(255,0,0,0.3)"}
```

## Notes

- Highlights all elements matching the selector, not just the first
- Combine with `screenshot` to capture the highlighted result
- Highlights persist until the page is refreshed or navigated
