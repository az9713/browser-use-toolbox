---
name: animation
description: Control CSS and Web animation playback rate
---

# browser animation

Controls the playback rate of CSS animations and Web Animations API transitions on the page.

## Usage

```bash
node dist/browser.js animation <tab> [options]
```

## Options

- `--rate <speed>` - Playback rate multiplier: `0` to pause, `1` for normal speed, `2` for double speed
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js animation 0 --rate 0
node dist/browser.js animation 0 --rate 1
node dist/browser.js animation 0 --rate 0.5
```

## Output

Returns JSON:
```json
{"success": true, "rate": 0, "animationsFound": 5}
```

## Notes

- Rate `0` pauses all animations on the page
- Rate `1` resumes normal playback
- Useful for capturing screenshots of animated states without blur
- Affects CSS transitions, CSS animations, and Web Animations API
