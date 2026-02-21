import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function readCommand(
  tab: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      const { result, exceptionDetails } = await client.Runtime.evaluate({
        expression: `
          (function() {
            // Remove unwanted elements from a clone so we don't mutate the live DOM
            const docClone = document.cloneNode(true);
            const body = docClone.body || docClone.querySelector('body');
            if (!body) return { title: document.title, text: '', wordCount: 0 };

            const NOISE_SELECTORS = [
              'nav', 'header', 'footer', 'aside',
              '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
              '.sidebar', '.side-bar', '#sidebar',
              '.ad', '.ads', '.advertisement', '.promo',
              '.cookie-banner', '.newsletter-signup',
              'script', 'style', 'noscript',
            ];

            for (const sel of NOISE_SELECTORS) {
              body.querySelectorAll(sel).forEach(function(el) { el.remove(); });
            }

            // Priority: <article>, <main>, [role=main], then largest <div> by text length
            let contentEl =
              body.querySelector('article') ||
              body.querySelector('main') ||
              body.querySelector('[role="main"]');

            if (!contentEl) {
              // Find the block element with the most text content
              const candidates = Array.from(body.querySelectorAll('div, section'));
              let best = null;
              let bestLen = 0;
              for (const el of candidates) {
                const len = (el.textContent || '').trim().length;
                if (len > bestLen) { bestLen = len; best = el; }
              }
              contentEl = best || body;
            }

            // Extract clean text: collapse whitespace
            const raw = (contentEl.textContent || '').replace(/\\s+/g, ' ').trim();
            const wordCount = raw.split(/\\s+/).filter(Boolean).length;

            // Collect headings for structure
            const headings = Array.from(contentEl.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(function(h) {
              return { level: parseInt(h.tagName.slice(1), 10), text: (h.textContent || '').trim() };
            }).slice(0, 20);

            // Collect links
            const links = Array.from(contentEl.querySelectorAll('a[href]')).map(function(a) {
              return { text: (a.textContent || '').trim(), href: a.getAttribute('href') };
            }).filter(function(l) { return l.text.length > 0; }).slice(0, 30);

            return {
              title: document.title,
              url: window.location.href,
              wordCount: wordCount,
              text: raw.substring(0, 5000),
              headings: headings,
              links: links,
            };
          })()
        `,
        returnByValue: true,
        awaitPromise: false,
      });

      if (exceptionDetails) {
        const errorText =
          exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'Unknown evaluation error';
        throw new Error(errorText);
      }

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            article: result.value,
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
