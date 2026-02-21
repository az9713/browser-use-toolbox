---
name: memory
description: Get JavaScript heap memory usage for a tab
---

# browser memory

Returns JavaScript heap memory usage statistics for the specified tab's page.

## Usage

```bash
node dist/browser.js memory <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js memory 0
```

## Output

Returns JSON:
```json
{
  "jsHeapSizeLimit": 4294705152,
  "totalJSHeapSize": 25165824,
  "usedJSHeapSize": 18874368,
  "usedPercent": 0.44
}
```

## Notes

- All sizes are in bytes
- `usedPercent` is `usedJSHeapSize / jsHeapSizeLimit`
- High `usedPercent` values (over 80%) may indicate a memory leak
- Use `perf` for page load timing metrics
