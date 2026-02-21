---
name: drag
description: Drag an element from one CSS selector to another
---

# browser drag

Simulates a drag-and-drop operation, moving an element from the source selector to the target selector.

## Usage

```bash
node dist/browser.js drag <tab> <from> <to> [options]
```

## Options

- `<from>` - CSS selector for the element to drag
- `<to>` - CSS selector for the drop target
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js drag 0 "#item1" "#dropzone"
node dist/browser.js drag 0 ".card:first-child" ".column:last-child"
```

## Output

Returns JSON:
```json
{"success": true, "from": "#item1", "to": "#dropzone"}
```

## Notes

- Both selectors must exist on the page or the command will fail
- Uses mouse event simulation (mousedown, mousemove, mouseup)
- May not work with all drag-and-drop libraries that use pointer events
