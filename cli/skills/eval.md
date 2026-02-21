---
name: eval
description: Execute JavaScript in a page and return the result
---

# browser eval

Executes arbitrary JavaScript in the context of the specified tab's page and returns the result.

## Usage

```bash
node dist/browser.js eval <tab> <js> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js eval 0 "document.title"
node dist/browser.js eval 0 "window.location.href"
node dist/browser.js eval 0 "document.querySelectorAll('a').length"
```

## Output

Returns JSON:
```json
{"result": "My Page Title", "type": "string"}
```

## Notes

- The JavaScript runs in the page's context with access to `document`, `window`, etc.
- Return values are serialized to JSON; complex objects may be simplified
- Errors thrown in the script are returned as error responses
- Use for advanced interactions not covered by other commands
