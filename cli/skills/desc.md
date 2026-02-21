---
name: desc
description: Get page metadata including title, description, and Open Graph tags
---

# browser desc

Retrieves metadata from the specified tab's page, including title, meta description, and Open Graph tags.

## Usage

```bash
node dist/browser.js desc <tab> [options]
```

## Options

- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js desc 0
```

## Output

Returns JSON:
```json
{
  "title": "Example Domain",
  "description": "An example website for documentation",
  "og:title": "Example Domain",
  "og:image": "https://example.com/image.png",
  "og:url": "https://example.com",
  "canonical": "https://example.com",
  "lang": "en"
}
```

## Notes

- Includes standard meta tags, Open Graph (og:), and Twitter card tags
- Missing tags are omitted from the output
- Useful for SEO audits and link preview debugging
