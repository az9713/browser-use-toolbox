import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function clickCommand(
  tab: number,
  text: string,
  options: { port?: string; host?: string }
) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    await client.Runtime.enable();

    // Use a TreeWalker to find text nodes matching the search text, then walk
    // up to the nearest clickable ancestor and return its bounding rect center.
    const expression = `
      (function() {
        var searchText = ${JSON.stringify(text)};
        var walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        var node;
        var found = null;
        while ((node = walker.nextNode())) {
          if (node.nodeValue && node.nodeValue.trim().includes(searchText)) {
            found = node;
            break;
          }
        }
        if (!found) return null;

        // Walk up to nearest clickable ancestor
        var clickableSelectors = ['a', 'button', 'input', '[role="button"]', '[onclick]'];
        var el = found.parentElement;
        while (el && el !== document.body) {
          var tag = el.tagName.toLowerCase();
          if (
            tag === 'a' ||
            tag === 'button' ||
            tag === 'input' ||
            el.getAttribute('role') === 'button' ||
            el.hasAttribute('onclick')
          ) {
            break;
          }
          el = el.parentElement;
        }
        if (!el || el === document.body) {
          // Fall back to the direct parent if no clickable ancestor found
          el = found.parentElement;
        }

        var rect = el.getBoundingClientRect();
        return JSON.stringify({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          tag: el.tagName.toLowerCase(),
          text: el.innerText ? el.innerText.trim().slice(0, 100) : '',
        });
      })()
    `;

    const { result } = await client.Runtime.evaluate({
      expression,
      returnByValue: true,
    });

    if (!result.value) {
      await client.close();
      console.error(
        JSON.stringify({ error: `No element found with text: "${text}"` })
      );
      process.exit(1);
    }

    const coords: { x: number; y: number; tag: string; text: string } =
      JSON.parse(result.value as string);

    await client.Input.enable();

    await client.Input.dispatchMouseEvent({
      type: 'mousePressed',
      x: coords.x,
      y: coords.y,
      button: 'left',
      clickCount: 1,
    });

    await client.Input.dispatchMouseEvent({
      type: 'mouseReleased',
      x: coords.x,
      y: coords.y,
      button: 'left',
      clickCount: 1,
    });

    await client.close();

    console.log(
      JSON.stringify(
        {
          success: true,
          tab,
          clicked: {
            text,
            tag: coords.tag,
            matchedText: coords.text,
            x: coords.x,
            y: coords.y,
          },
        },
        null,
        2
      )
    );
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
