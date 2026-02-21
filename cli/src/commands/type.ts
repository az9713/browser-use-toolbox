import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function typeCommand(
  tab: number,
  text: string,
  options: { port?: string; host?: string; selector?: string; clear?: boolean }
) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    await client.Runtime.enable();

    // If a selector is provided, focus that element first
    if (options.selector) {
      const focusExpression = `
        (function() {
          var el = document.querySelector(${JSON.stringify(options.selector)});
          if (!el) return false;
          el.focus();
          return true;
        })()
      `;
      const { result: focusResult } = await client.Runtime.evaluate({
        expression: focusExpression,
        returnByValue: true,
      });
      if (!focusResult.value) {
        await client.close();
        console.error(
          JSON.stringify({
            error: `No element found for selector: "${options.selector}"`,
          })
        );
        process.exit(1);
      }
    }

    // If --clear is set, select all text and delete it before typing
    if (options.clear) {
      await client.Input.dispatchKeyEvent({
        type: 'keyDown',
        modifiers: 8, // Meta/Ctrl modifier
        key: 'a',
        code: 'KeyA',
      });
      await client.Input.dispatchKeyEvent({
        type: 'keyUp',
        modifiers: 8,
        key: 'a',
        code: 'KeyA',
      });
      await client.Input.dispatchKeyEvent({
        type: 'keyDown',
        key: 'Delete',
        code: 'Delete',
      });
      await client.Input.dispatchKeyEvent({
        type: 'keyUp',
        key: 'Delete',
        code: 'Delete',
      });
    }

    // Insert the text using Input.insertText (fastest, no key-by-key simulation)
    await client.Input.insertText({ text });

    await client.close();

    console.log(
      JSON.stringify(
        {
          success: true,
          tab,
          selector: options.selector ?? null,
          cleared: options.clear ?? false,
          typed: text,
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
