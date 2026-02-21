---
name: emulate
description: Emulate a mobile or desktop device in a tab
---

# browser emulate

Sets the tab's viewport, user agent, and device pixel ratio to emulate a specific device.

## Usage

```bash
node dist/browser.js emulate <tab> <device> [options]
```

## Options

- `<device>` - Device to emulate: `iPhone14`, `iPad`, `Pixel7`, `desktop`
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js emulate 0 iPhone14
node dist/browser.js emulate 0 desktop
```

## Output

Returns JSON:
```json
{
  "success": true,
  "device": "iPhone14",
  "width": 390,
  "height": 844,
  "deviceScaleFactor": 3,
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0...)"
}
```

## Notes

- Use `desktop` to reset to standard desktop dimensions
- Emulation persists until changed or the tab is closed
- Combine with `screenshot` to capture mobile layouts
