---
name: dialog
description: Handle JavaScript alert, confirm, or prompt dialogs
---

# browser dialog

Accepts or dismisses the next JavaScript dialog (alert, confirm, prompt) that appears in the tab.

## Usage

```bash
node dist/browser.js dialog <tab> <action> [options]
```

## Options

- `<action>` - Either `accept` or `dismiss`
- `--text <text>` - Text to enter into a prompt dialog before accepting
- `-p, --port <port>` - Chrome debugging port (default: 9222)
- `-h, --host <host>` - Chrome debugging host (default: localhost)

## Example

```bash
node dist/browser.js dialog 0 accept
node dist/browser.js dialog 0 dismiss
node dist/browser.js dialog 0 accept --text "my input"
```

## Output

Returns JSON:
```json
{"success": true, "action": "accept", "type": "confirm", "message": "Are you sure?"}
```

## Notes

- The command waits for a dialog to appear before acting
- Use `--text` only with `prompt` dialogs; ignored for `alert` and `confirm`
- Run this command before triggering the action that causes the dialog
