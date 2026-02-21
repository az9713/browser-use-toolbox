---
name: console
description: Capture console output from a page for a specified duration
---

# browser console

Listens to and returns console output (log, warn, error, etc.) from the specified tab's page.

## Usage

```bash
node dist/browser.js console <tab> [options]
```

## Options

- `--duration <ms>` - How long to listen for console messages in milliseconds (default: 3000)
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js console 0 --duration 5000
```

## Output

Returns JSON:
```json
{
  "duration": 5000,
  "messages": [
    {"level": "log", "text": "App initialized", "timestamp": 1700000000000},
    {"level": "error", "text": "Failed to fetch /api/data", "timestamp": 1700000001000}
  ]
}
```

## Notes

- Captures log, info, warn, error, and debug levels
- Start monitoring before triggering the action that produces console output
- Useful for debugging JavaScript errors and application events
