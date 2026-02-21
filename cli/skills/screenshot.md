---
name: screenshot
description: Capture a PNG screenshot of a tab
---

# browser screenshot

Captures a PNG screenshot of the specified tab, with an option to capture the full scrollable page.

## Usage

```bash
node dist/browser.js screenshot <tab> [options]
```

## Options

- `--output <path>` - File path to save the PNG (default: stdout or temp file)
- `--full` - Capture the full scrollable page, not just the visible viewport
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js screenshot 0 --output shot.png
node dist/browser.js screenshot 0 --full --output fullpage.png
```

## Output

Returns JSON:
```json
{"success": true, "path": "shot.png", "width": 1280, "height": 800}
```

## Notes

- `<tab>` is the index from `list` command
- Use `--full` to capture content below the fold
