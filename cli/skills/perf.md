---
name: perf
description: Get performance metrics for a page
---

# browser perf

Retrieves performance timing and Core Web Vitals metrics for the specified tab's page.

## Usage

```bash
node dist/browser.js perf <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js perf 0
```

## Output

Returns JSON:
```json
{
  "domContentLoaded": 342,
  "load": 891,
  "firstPaint": 210,
  "firstContentfulPaint": 310,
  "largestContentfulPaint": 750,
  "timeToInteractive": 1200,
  "totalBlockingTime": 45,
  "cumulativeLayoutShift": 0.02
}
```

## Notes

- All timing values are in milliseconds
- `cumulativeLayoutShift` is a unitless score (lower is better)
- Navigate to the page fresh before measuring for accurate results
- Use `memory` command for heap usage metrics
