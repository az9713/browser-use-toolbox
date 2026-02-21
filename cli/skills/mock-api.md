---
name: mock-api
description: Intercept and mock API calls matching a URL pattern
---

# browser mock-api

Intercepts network requests matching a URL pattern and returns a custom mock response.

## Usage

```bash
node dist/browser.js mock-api <tab> <url> <response> [options]
```

## Options

- `<url>` - URL pattern or path to intercept (supports partial matching)
- `<response>` - JSON string to return as the mock response body
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js mock-api 0 "/api/users" '{"users":[]}'
node dist/browser.js mock-api 0 "https://api.example.com/data" '{"status":"ok"}'
```

## Output

Returns JSON:
```json
{"success": true, "url": "/api/users", "active": true}
```

## Notes

- Interception is active until the tab is closed or the page navigates away
- URL matching is substring-based; be specific to avoid unintended matches
- Useful for testing error states or working with unavailable backends
