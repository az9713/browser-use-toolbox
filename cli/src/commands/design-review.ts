import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function designReviewCommand(
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
            const allElements = Array.from(document.querySelectorAll('*')).slice(0, 600);

            // --- Typography hierarchy ---
            const headings = ['h1','h2','h3','h4','h5','h6'].flatMap(function(tag) {
              return Array.from(document.querySelectorAll(tag)).slice(0, 5).map(function(el) {
                const style = window.getComputedStyle(el);
                return {
                  tag: tag,
                  text: (el.textContent || '').trim().substring(0, 60),
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  fontFamily: style.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
                  color: style.color,
                  lineHeight: style.lineHeight,
                };
              });
            });

            // --- Color usage ---
            const colorUsage = new Map();
            for (const el of allElements) {
              const style = window.getComputedStyle(el);
              const toTrack = [
                { role: 'text', value: style.color },
                { role: 'background', value: style.backgroundColor },
                { role: 'border', value: style.borderColor },
              ];
              for (const { role, value } of toTrack) {
                if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') continue;
                const key = role + ':' + value;
                colorUsage.set(key, (colorUsage.get(key) || 0) + 1);
              }
            }
            const topColors = Array.from(colorUsage.entries())
              .sort(function(a, b) { return b[1] - a[1]; })
              .slice(0, 20)
              .map(function(e) {
                const parts = e[0].split(':');
                return { role: parts[0], color: parts.slice(1).join(':'), count: e[1] };
              });

            // --- Spacing consistency ---
            const spacingValues = new Map();
            const spacingProps = ['marginTop','marginBottom','paddingTop','paddingBottom','gap'];
            for (const el of allElements.slice(0, 200)) {
              const style = window.getComputedStyle(el);
              for (const prop of spacingProps) {
                const val = style[prop];
                if (val && val !== '0px' && val !== 'normal') {
                  spacingValues.set(val, (spacingValues.get(val) || 0) + 1);
                }
              }
            }
            const topSpacing = Array.from(spacingValues.entries())
              .sort(function(a, b) { return b[1] - a[1]; })
              .slice(0, 15)
              .map(function(e) { return { value: e[0], count: e[1] }; });

            // --- Image inventory ---
            const images = Array.from(document.querySelectorAll('img')).slice(0, 20).map(function(img) {
              const rect = img.getBoundingClientRect();
              return {
                src: img.getAttribute('src') || '',
                alt: img.getAttribute('alt') || null,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                hasAlt: img.hasAttribute('alt') && (img.getAttribute('alt') || '').trim().length > 0,
              };
            });

            // --- Layout patterns ---
            const layoutHints = {
              hasFlexContainers: allElements.some(function(el) {
                return window.getComputedStyle(el).display === 'flex';
              }),
              hasGridContainers: allElements.some(function(el) {
                return window.getComputedStyle(el).display === 'grid';
              }),
              hasFixedElements: allElements.some(function(el) {
                return window.getComputedStyle(el).position === 'fixed';
              }),
              hasStickyElements: allElements.some(function(el) {
                return window.getComputedStyle(el).position === 'sticky';
              }),
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight,
              pageWidth: document.body.scrollWidth,
              pageHeight: document.body.scrollHeight,
              isScrollable: document.body.scrollHeight > window.innerHeight,
            };

            // --- Responsiveness hints ---
            const metaViewport = document.querySelector('meta[name="viewport"]');
            const mediaQueryLists = [
              { query: '(max-width: 768px)', label: 'mobile' },
              { query: '(max-width: 1024px)', label: 'tablet' },
              { query: '(prefers-color-scheme: dark)', label: 'dark-mode' },
              { query: '(prefers-reduced-motion: reduce)', label: 'reduced-motion' },
            ].map(function(mq) {
              return { label: mq.label, matches: window.matchMedia(mq.query).matches };
            });

            // --- Interaction elements ---
            const interactiveElements = {
              buttons: document.querySelectorAll('button, [role="button"]').length,
              links: document.querySelectorAll('a[href]').length,
              inputs: document.querySelectorAll('input, textarea, select').length,
              forms: document.querySelectorAll('form').length,
            };

            return {
              url: window.location.href,
              title: document.title,
              typography: {
                headings: headings,
                bodyFont: (function() {
                  const style = window.getComputedStyle(document.body);
                  return {
                    fontFamily: style.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
                    fontSize: style.fontSize,
                    lineHeight: style.lineHeight,
                    color: style.color,
                  };
                })(),
              },
              colors: topColors,
              spacing: topSpacing,
              images: images,
              layout: layoutHints,
              responsiveness: {
                hasViewportMeta: !!metaViewport,
                viewportContent: metaViewport ? metaViewport.getAttribute('content') : null,
                mediaQueries: mediaQueryLists,
              },
              interactive: interactiveElements,
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

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            designReview: result.value,
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
