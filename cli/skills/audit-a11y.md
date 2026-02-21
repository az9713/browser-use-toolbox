---
name: audit-a11y
description: Audit a page for accessibility issues
---

# browser audit-a11y

Runs an accessibility audit on the specified tab's page and returns a list of violations and warnings.

## Usage

```bash
node dist/browser.js audit-a11y <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js audit-a11y 0
```

## Output

Returns JSON:
```json
{
  "violations": [
    {"rule": "image-alt", "severity": "error", "element": "<img src='logo.png'>", "help": "Images must have alternate text"},
    {"rule": "color-contrast", "severity": "warning", "element": "<p class='muted'>", "help": "Insufficient color contrast ratio"}
  ],
  "passed": 34,
  "failed": 2
}
```

## Notes

- Checks against WCAG 2.1 accessibility guidelines
- Severity levels: `error` (must fix), `warning` (should fix)
- Returns a summary count of passed and failed checks
