import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function layoutCommand(
  tab: number,
  options: { port?: string; host?: string; selector?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';
  const selector = options.selector || 'body';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      // Escape the selector for embedding in the JS expression
      const escapedSelector = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      const { result, exceptionDetails } = await client.Runtime.evaluate({
        expression: `
          (function() {
            function getLayoutNode(el, depth) {
              if (depth > 4) return null;
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              const children = Array.from(el.children)
                .map(function(child) { return getLayoutNode(child, depth + 1); })
                .filter(Boolean)
                .slice(0, 10);

              return {
                tag: el.tagName.toLowerCase(),
                id: el.id || null,
                className: el.className || null,
                display: style.display,
                position: style.position,
                dimensions: {
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                },
                visible: rect.width > 0 && rect.height > 0,
                childrenCount: el.children.length,
                children: children,
              };
            }

            const root = document.querySelector('${escapedSelector}');
            if (!root) {
              return { error: 'Selector not found: ${escapedSelector}' };
            }

            return getLayoutNode(root, 0);
          })()
        `,
        returnByValue: true,
      });

      if (exceptionDetails) {
        const errorText =
          exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'Unknown evaluation error';
        throw new Error(errorText);
      }

      if (result.value && (result.value as any).error) {
        throw new Error((result.value as any).error);
      }

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            selector,
            layout: result.value,
          },
          null,
          2
        )
      );
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
