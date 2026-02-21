import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function memoryCommand(
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

      // CDP heap usage (V8-level stats)
      const { usedSize, totalSize } = await client.Runtime.getHeapUsage();

      // Page-level performance.memory (Chrome-only, may not exist on all pages)
      const { result: memResult } = await client.Runtime.evaluate({
        expression: `
          (function() {
            if (!window.performance || !window.performance.memory) return null;
            const m = window.performance.memory;
            return {
              jsHeapSizeLimit: m.jsHeapSizeLimit,
              totalJSHeapSize: m.totalJSHeapSize,
              usedJSHeapSize: m.usedJSHeapSize,
            };
          })()
        `,
        returnByValue: true,
      });

      const usedPercentage = totalSize > 0
        ? Math.round((usedSize / totalSize) * 100 * 100) / 100
        : 0;

      const pageMemory = memResult.value as {
        jsHeapSizeLimit: number;
        totalJSHeapSize: number;
        usedJSHeapSize: number;
      } | null;

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            memory: {
              // CDP Runtime.getHeapUsage — V8 isolate-level
              jsHeapUsedSize: usedSize,
              jsHeapTotalSize: totalSize,
              usedPercentage,
              // window.performance.memory — may be null if not available
              pageMemory: pageMemory
                ? {
                    jsHeapSizeLimit: pageMemory.jsHeapSizeLimit,
                    totalJSHeapSize: pageMemory.totalJSHeapSize,
                    usedJSHeapSize: pageMemory.usedJSHeapSize,
                    usedPercentage:
                      pageMemory.jsHeapSizeLimit > 0
                        ? Math.round(
                            (pageMemory.usedJSHeapSize / pageMemory.jsHeapSizeLimit) *
                              100 *
                              100
                          ) / 100
                        : 0,
                  }
                : null,
            },
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
