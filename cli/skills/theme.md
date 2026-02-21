---
name: theme
description: Inject custom CSS into a page
---

# browser theme

Injects a CSS string into the specified tab's page, allowing live style overrides.

## Usage

```bash
node dist/browser.js theme <tab> <css> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js theme 0 "body{background:black;color:white}"
node dist/browser.js theme 0 "* { font-family: monospace !important; }"
```

## Output

Returns JSON:
```json
{"success": true, "injected": true}
```

## Notes

- CSS is injected into a `<style>` tag appended to the document `<head>`
- Changes persist until the page is refreshed or navigated away
- Use `!important` to override existing styles
- Combine with `screenshot` to capture the styled result
