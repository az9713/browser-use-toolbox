---
name: record
description: Start or stop a screencast recording, saving frames to a directory
---

# browser record

Starts or stops a screencast recording of the specified tab, saving frames as images to a directory.

## Usage

```bash
node dist/browser.js record <tab> <action> [options]
```

## Options

- `<action>` - Either `start` or `stop`
- `--output <dir>` - Directory to save frame images (default: `./frames`)
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js record 0 start --output frames
node dist/browser.js record 0 stop
```

## Output

Returns JSON:
```json
{"success": true, "action": "start", "output": "frames"}
{"success": true, "action": "stop", "frames": 42, "output": "frames"}
```

## Notes

- Frames are saved as numbered PNG files in the output directory
- Run `start` before actions and `stop` when done to capture the sequence
- Combine with `screenshot` or convert frames to video with ffmpeg
