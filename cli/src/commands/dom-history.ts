import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function domHistoryCommand(
  tab: number,
  options: { port?: string; host?: string; duration?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';
  const duration = Number(options.duration) || 3000;

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      // Install the MutationObserver in the page
      const { exceptionDetails: installError } = await client.Runtime.evaluate({
        expression: `
          (function() {
            // Clear any previous observer
            if (window.__cdpMutationObserver) {
              window.__cdpMutationObserver.disconnect();
            }
            window.__cdpMutations = [];
            const MAX_RECORDS = 200;

            window.__cdpMutationObserver = new MutationObserver(function(records) {
              for (const record of records) {
                if (window.__cdpMutations.length >= MAX_RECORDS) break;

                const entry = {
                  type: record.type,
                  timestamp: Date.now(),
                  target: record.target
                    ? (record.target.tagName
                        ? record.target.tagName.toLowerCase() +
                          (record.target.id ? '#' + record.target.id : '') +
                          (record.target.className
                            ? '.' + String(record.target.className).split(' ').filter(Boolean).join('.')
                            : '')
                        : '#text')
                    : 'unknown',
                };

                if (record.type === 'childList') {
                  entry.addedNodes = record.addedNodes.length;
                  entry.removedNodes = record.removedNodes.length;
                  const firstAdded = record.addedNodes[0];
                  if (firstAdded) {
                    entry.addedSample = firstAdded.tagName
                      ? firstAdded.tagName.toLowerCase()
                      : (firstAdded.textContent || '').substring(0, 40);
                  }
                } else if (record.type === 'attributes') {
                  entry.attributeName = record.attributeName;
                  entry.oldValue = record.oldValue;
                  entry.newValue = record.target.getAttribute
                    ? record.target.getAttribute(record.attributeName)
                    : null;
                } else if (record.type === 'characterData') {
                  entry.oldValue = (record.oldValue || '').substring(0, 60);
                  entry.newValue = (record.target.textContent || '').substring(0, 60);
                }

                window.__cdpMutations.push(entry);
              }
            });

            window.__cdpMutationObserver.observe(document.documentElement, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeOldValue: true,
              characterData: true,
              characterDataOldValue: true,
            });

            return { observing: true };
          })()
        `,
        returnByValue: true,
      });

      if (installError) {
        const errorText =
          installError.exception?.description ??
          installError.text ??
          'Failed to install MutationObserver';
        throw new Error(errorText);
      }

      // Wait for the observation period
      await new Promise<void>((resolve) => setTimeout(resolve, duration));

      // Collect the recorded mutations
      const { result: collectResult, exceptionDetails: collectError } = await client.Runtime.evaluate({
        expression: `
          (function() {
            if (window.__cdpMutationObserver) {
              window.__cdpMutationObserver.disconnect();
            }
            return window.__cdpMutations || [];
          })()
        `,
        returnByValue: true,
      });

      if (collectError) {
        const errorText =
          collectError.exception?.description ??
          collectError.text ??
          'Failed to collect mutations';
        throw new Error(errorText);
      }

      const mutations = Array.isArray(collectResult.value) ? collectResult.value : [];

      const summary = {
        total: mutations.length,
        childList: mutations.filter((m: any) => m.type === 'childList').length,
        attributes: mutations.filter((m: any) => m.type === 'attributes').length,
        characterData: mutations.filter((m: any) => m.type === 'characterData').length,
      };

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            observationDurationMs: duration,
            summary,
            mutations,
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
