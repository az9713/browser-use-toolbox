---
name: close
description: Close a tab by its index
---

# browser close

Closes the Chrome tab at the specified index.

## Usage

```bash
node dist/browser.js close <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js close 1
```

## Output

Returns JSON:
```json
{"success": true, "closed": 1}
```

## Notes

- `<tab>` is the index from the `list` command
- After closing, remaining tab indices may shift — run `list` again to get updated indices
- Closing the last tab may have no effect depending on browser settings
