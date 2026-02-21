import { connectToTab, resolveTab } from '../chrome/connector.js';

interface Point {
  x: number;
  y: number;
}

interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function centerOf(rect: BoundingRect): Point {
  return {
    x: Math.round(rect.x + rect.width / 2),
    y: Math.round(rect.y + rect.height / 2),
  };
}

export async function dragCommand(
  tab: number,
  from: string,
  to: string,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      // Get bounding rect for a CSS selector via Runtime.evaluate
      async function getBoundingRect(selector: string): Promise<BoundingRect> {
        const escaped = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const result = await client.Runtime.evaluate({
          expression: `
            (function() {
              const el = document.querySelector('${escaped}');
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { x: r.left, y: r.top, width: r.width, height: r.height };
            })()
          `,
          returnByValue: true,
        });

        const rect = result.result.value as BoundingRect | null;
        if (!rect) {
          throw new Error(`Element not found for selector: "${selector}"`);
        }
        if (rect.width === 0 || rect.height === 0) {
          throw new Error(`Element has zero size for selector: "${selector}"`);
        }
        return rect;
      }

      const fromRect = await getBoundingRect(from);
      const toRect = await getBoundingRect(to);

      const fromPoint = centerOf(fromRect);
      const toPoint = centerOf(toRect);

      // Dispatch the drag sequence: mousePressed -> mouseMoved -> mouseReleased
      await client.Input.dispatchMouseEvent({
        type: 'mousePressed',
        x: fromPoint.x,
        y: fromPoint.y,
        button: 'left',
        clickCount: 1,
      });

      // Interpolate movement in several steps to simulate a realistic drag
      const STEPS = 10;
      for (let step = 1; step <= STEPS; step++) {
        const progress = step / STEPS;
        const mx = Math.round(fromPoint.x + (toPoint.x - fromPoint.x) * progress);
        const my = Math.round(fromPoint.y + (toPoint.y - fromPoint.y) * progress);

        await client.Input.dispatchMouseEvent({
          type: 'mouseMoved',
          x: mx,
          y: my,
          button: 'left',
        });
      }

      await client.Input.dispatchMouseEvent({
        type: 'mouseReleased',
        x: toPoint.x,
        y: toPoint.y,
        button: 'left',
        clickCount: 1,
      });

      console.log(
        JSON.stringify(
          {
            success: true,
            action: 'dragged',
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            from: { selector: from, center: fromPoint },
            to: { selector: to, center: toPoint },
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
