---
name: dom-history
description: Track DOM mutations over a time period
---

# browser dom-history

Observes and records DOM mutations (additions, removals, attribute changes) on the page over a specified duration.

## Usage

```bash
node dist/browser.js dom-history <tab> [options]
```

## Options

- `--duration <ms>` - How long to observe DOM changes in milliseconds (default: 5000)
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js dom-history 0 --duration 5000
```

## Output

Returns JSON:
```json
{
  "duration": 5000,
  "mutations": [
    {"type": "childList", "target": "#app", "added": 1, "removed": 0, "timestamp": 1200},
    {"type": "attributes", "target": ".spinner", "attribute": "class", "oldValue": "spinner active", "newValue": "spinner", "timestamp": 2400}
  ],
  "total": 2
}
```

## Notes

- Timestamps are milliseconds from when observation started
- Useful for debugging dynamic content loading and state changes
- Trigger page interactions during observation to capture mutation sequences
