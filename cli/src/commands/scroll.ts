import { connectToTab, resolveTab } from '../chrome/connector.js';

type ScrollDirection = 'up' | 'down' | 'top' | 'bottom' | string;

const NAMED_DIRECTIONS = new Set<string>(['up', 'down', 'top', 'bottom']);

function buildScrollExpression(direction: ScrollDirection, amount: number): string {
  switch (direction) {
    case 'up':
      return `window.scrollBy({ top: -${amount}, behavior: 'smooth' }); true`;

    case 'down':
      return `window.scrollBy({ top: ${amount}, behavior: 'smooth' }); true`;

    case 'top':
      return `window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); true`;

    case 'bottom':
      return `window.scrollTo({ top: document.body.scrollHeight, left: 0, behavior: 'smooth' }); true`;

    default: {
      // Treat direction as a CSS selector and scroll the element into view
      const escaped = direction.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `
        (function() {
          const el = document.querySelector('${escaped}');
          if (!el) return false;
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        })()
      `;
    }
  }
}

export async function scrollCommand(
  tab: number,
  direction: string,
  options: { port?: string; host?: string; amount?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';
  const amount = options.amount ? parseInt(options.amount, 10) : 300;

  if (isNaN(amount) || amount <= 0) {
    console.error(JSON.stringify({ error: '--amount must be a positive integer' }));
    process.exit(1);
  }

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      const expression = buildScrollExpression(direction, amount);
      const result = await client.Runtime.evaluate({
        expression,
        returnByValue: true,
      });

      const actionSucceeded = result.result.value !== false;

      if (!actionSucceeded) {
        throw new Error(`Selector not found: "${direction}"`);
      }

      const isSelector = !NAMED_DIRECTIONS.has(direction);

      console.log(
        JSON.stringify(
          {
            success: true,
            action: 'scrolled',
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            direction,
            ...(isSelector
              ? { selector: direction }
              : { amount: NAMED_DIRECTIONS.has(direction) && direction !== 'up' && direction !== 'down' ? undefined : amount }),
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
