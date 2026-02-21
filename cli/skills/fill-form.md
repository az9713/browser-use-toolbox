---
name: fill-form
description: Auto-fill a form using field name to value mappings
---

# browser fill-form

Automatically fills form fields on the page using the provided JSON key/value pairs.

## Usage

```bash
node dist/browser.js fill-form <tab> [options]
```

## Options

- `--data <json>` - JSON object mapping field names or labels to values
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js fill-form 0 --data '{"name":"John","email":"j@test.com","message":"Hello"}'
```

## Output

Returns JSON:
```json
{
  "success": true,
  "filled": ["name", "email", "message"],
  "skipped": []
}
```

## Notes

- Matches fields by `name`, `id`, `placeholder`, or associated `<label>` text
- Skips fields that cannot be found on the page
- Does not submit the form — use `click` to submit after filling
