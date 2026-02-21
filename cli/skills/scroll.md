---
name: scroll
description: Scroll a page up, down, to top/bottom, or to a CSS selector
---

# browser scroll

Scrolls the specified tab's page in the given direction or to a specific element.

## Usage

```bash
node dist/browser.js scroll <tab> <direction> [options]
```

## Options

- `<direction>` - One of: `up`, `down`, `top`, `bottom`, or a CSS selector
- `--amount <px>` - Number of pixels to scroll (for `up`/`down`, default: 300)
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js scroll 0 down --amount 500
node dist/browser.js scroll 0 top
node dist/browser.js scroll 0 "#footer"
```

## Output

Returns JSON:
```json
{"success": true, "direction": "down", "amount": 500}
```

## Notes

- Use `top` or `bottom` to jump to the beginning or end of the page
- Passing a CSS selector scrolls that element into view
- Use `--amount` with `up` or `down` to control scroll distance
