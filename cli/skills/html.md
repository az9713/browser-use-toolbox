---
name: html
description: Get the raw HTML source of a page (truncated to 50000 chars)
---

# browser html

Returns the raw HTML of the specified tab's page, truncated to 50000 characters.

## Usage

```bash
node dist/browser.js html <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js html 0
```

## Output

Returns JSON:
```json
{"tab": 0, "url": "https://example.com", "html": "<!DOCTYPE html><html>...</html>", "truncated": false}
```

## Notes

- Output is truncated at 50000 characters to avoid memory issues
- The `truncated` field indicates whether the HTML was cut off
- For just the visible text, use `content` instead
- Useful for inspecting page structure and finding CSS selectors
