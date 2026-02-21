---
name: cookies
description: List, set, or delete cookies for a tab
---

# browser cookies

Lists all cookies for the current tab, or sets/deletes a specific cookie.

## Usage

```bash
node dist/browser.js cookies <tab> [options]
```

## Options

- `--set <json>` - JSON object with cookie properties to set (name, value, domain, path, etc.)
- `--delete <name>` - Name of the cookie to delete
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js cookies 0
node dist/browser.js cookies 0 --set '{"name":"session","value":"abc123"}'
node dist/browser.js cookies 0 --delete "session"
```

## Output

Returns JSON:
```json
[
  {"name": "session", "value": "abc123", "domain": "example.com", "path": "/", "secure": true}
]
```

## Notes

- Without options, returns all cookies for the tab's current domain
- Use `--set` to add authentication cookies for testing
- Cookie changes take effect immediately for subsequent requests
