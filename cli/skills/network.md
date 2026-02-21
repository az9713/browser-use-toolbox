---
name: network
description: Monitor HTTP network requests made by a page
---

# browser network

Monitors and captures HTTP requests and responses made by the specified tab during a time window.

## Usage

```bash
node dist/browser.js network <tab> [options]
```

## Options

- `--duration <ms>` - How long to monitor in milliseconds (default: 3000)
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js network 0 --duration 5000
```

## Output

Returns JSON:
```json
{
  "duration": 5000,
  "requests": [
    {"method": "GET", "url": "https://api.example.com/users", "status": 200, "size": 1024, "time": 134},
    {"method": "POST", "url": "https://api.example.com/login", "status": 401, "size": 48, "time": 89}
  ]
}
```

## Notes

- Captures request method, URL, status code, response size, and timing
- Start monitoring before triggering the action that causes network traffic
- For detailed timing breakdown, use the `waterfall` command
