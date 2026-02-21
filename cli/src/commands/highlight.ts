import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function highlightCommand(
  tab: number,
  selector: string,
  options: { port?: string; host?: string; color?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';
  // Default highlight color: a vivid orange with semi-transparency
  const color = options.color || '#FF6600';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      // Escape selector and color for safe embedding
      const escapedSelector = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const escapedColor = color.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

      const { result, exceptionDetails } = await client.Runtime.evaluate({
        expression: `
          (function() {
            const elements = Array.from(document.querySelectorAll('${escapedSelector}'));
            const ATTR = 'data-cdp-highlight';

            // Remove any previous highlights
            document.querySelectorAll('[' + ATTR + ']').forEach(function(el) {
              el.removeAttribute(ATTR);
              el.style.removeProperty('outline');
              el.style.removeProperty('outline-offset');
              el.style.removeProperty('background-color');
              el.style.removeProperty('box-shadow');
            });

            for (const el of elements) {
              el.setAttribute(ATTR, 'true');
              el.style.outline = '3px solid ${escapedColor}';
              el.style.outlineOffset = '2px';
              el.style.boxShadow = '0 0 0 4px ${escapedColor}44';
            }

            // Scroll first match into view if any
            if (elements.length > 0) {
              elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return {
              highlighted: elements.length,
              selector: '${escapedSelector}',
              color: '${escapedColor}',
              tags: elements.slice(0, 10).map(function(el) {
                return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).join('.') : '');
              }),
            };
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

      const value = result.value as {
        highlighted: number;
        selector: string;
        color: string;
        tags: string[];
      };

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            highlighted: value.highlighted,
            selector: value.selector,
            color: value.color,
            matchedElements: value.tags,
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
