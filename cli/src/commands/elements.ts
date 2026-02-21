import { connectToTab, resolveTab } from '../chrome/connector.js';

interface ElementInfo {
  tag: string;
  text: string;
  href: string | null;
  type: string | null;
  name: string | null;
  id: string | null;
  class: string | null;
  rect: { x: number; y: number; width: number; height: number };
}

export async function elementsCommand(
  tab: number,
  options: { port?: string; host?: string }
) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    await client.Runtime.enable();

    const expression = `
      (function() {
        var selector = 'a, button, input, select, textarea, [role="button"], [onclick]';
        var elements = Array.from(document.querySelectorAll(selector));
        return JSON.stringify(elements.map(function(el) {
          var rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.value || el.getAttribute('placeholder') || '').trim().slice(0, 200),
            href: el.getAttribute('href') || null,
            type: el.getAttribute('type') || null,
            name: el.getAttribute('name') || null,
            id: el.getAttribute('id') || null,
            class: el.getAttribute('class') || null,
            rect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
          };
        }));
      })()
    `;

    const { result } = await client.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    await client.close();

    const elements: ElementInfo[] = JSON.parse(result.value as string);

    console.log(
      JSON.stringify(
        {
          tab,
          title: tabInfo.title,
          url: tabInfo.url,
          count: elements.length,
          elements,
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
