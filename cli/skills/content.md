---
name: content
description: Get the visible text content of a page
---

# browser content

Extracts and returns the visible text content of the specified tab's page.

## Usage

```bash
node dist/browser.js content <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js content 0
```

## Output

Returns JSON:
```json
{"tab": 0, "url": "https://example.com", "content": "Example Domain\nThis domain is for use in illustrative examples..."}
```

## Notes

- Only returns visible text, not hidden elements or scripts
- Useful for reading page data without parsing HTML
- For full HTML, use the `html` command instead
