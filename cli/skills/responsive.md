---
name: responsive
description: Capture screenshots at multiple breakpoints for responsive testing
---

# browser responsive

Takes screenshots of the page at multiple standard breakpoints to test responsive layouts.

## Usage

```bash
node dist/browser.js responsive <tab> [options]
```

## Options

- `--output <dir>` - Directory to save breakpoint screenshots (default: `./shots`)
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js responsive 0 --output shots
```

## Output

Returns JSON:
```json
{
  "success": true,
  "output": "shots",
  "screenshots": [
    {"breakpoint": "mobile", "width": 375, "file": "shots/375.png"},
    {"breakpoint": "tablet", "width": 768, "file": "shots/768.png"},
    {"breakpoint": "desktop", "width": 1280, "file": "shots/1280.png"},
    {"breakpoint": "wide", "width": 1920, "file": "shots/1920.png"}
  ]
}
```

## Notes

- Screenshots are taken at 375, 768, 1280, and 1920px widths by default
- Output directory is created if it does not exist
- Combine with `emulate` first to test with specific device user agents
