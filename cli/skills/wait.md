---
name: wait
description: Wait for a CSS selector, page navigation, or network idle
---

# browser wait

Waits until a CSS selector appears, a page navigation completes, or the network becomes idle.

## Usage

```bash
node dist/browser.js wait <tab> <target> [options]
```

## Options

- `<target>` - A CSS selector, `navigation`, or `idle`
- `--timeout <ms>` - Maximum time to wait in milliseconds (default: 5000)
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js wait 0 "#loaded" --timeout 5000
node dist/browser.js wait 0 navigation --timeout 10000
node dist/browser.js wait 0 idle
```

## Output

Returns JSON:
```json
{"success": true, "target": "#loaded", "elapsed": 1234}
```

## Notes

- `navigation` waits for a full page load
- `idle` waits until there are no network requests for 500ms
- Returns an error if the timeout is exceeded before the condition is met
