---
name: type
description: Type text into an input field
---

# browser type

Types the specified text into a focused or selected input field on the page.

## Usage

```bash
node dist/browser.js type <tab> <text> [options]
```

## Options

- `--selector <sel>` - CSS selector to target a specific input element
- `--clear` - Clear the input field before typing
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js type 0 "hello world" --selector "input[name=q]"
node dist/browser.js type 0 "new value" --selector "#email" --clear
```

## Output

Returns JSON:
```json
{"success": true, "selector": "input[name=q]", "text": "hello world"}
```

## Notes

- Without `--selector`, types into the currently focused element
- Use `--clear` to replace existing content rather than append
- Simulates real keystrokes, triggering input events
