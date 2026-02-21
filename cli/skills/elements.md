---
name: elements
description: List all interactive elements on a page
---

# browser elements

Returns a list of all interactive elements (buttons, links, inputs, etc.) found on the page.

## Usage

```bash
node dist/browser.js elements <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js elements 0
```

## Output

Returns JSON:
```json
[
  {"type": "button", "text": "Sign In", "selector": "#login-btn"},
  {"type": "input", "name": "email", "selector": "input[name=email]"},
  {"type": "a", "text": "Home", "href": "/", "selector": "nav a:first-child"}
]
```

## Notes

- Includes buttons, links, inputs, textareas, selects, and other interactive elements
- Use returned selectors with `type`, `click`, or `eval` commands
- Useful for discovering what actions are available on a page
