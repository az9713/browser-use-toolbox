import { connectToTab, resolveTab } from '../chrome/connector.js';

interface JSCoverageEntry {
  url: string;
  totalBytes: number;
  usedBytes: number;
}

export async function deadCodeCommand(
  tab: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.CSS.enable();
      await client.Profiler.enable();
      await client.Page.enable();

      // Start tracking before the reload
      await (client.CSS as any).startRuleUsageTracking();
      await client.Profiler.startPreciseCoverage({
        callCount: true,
        detailed: true,
      });

      // Reload and wait for load event
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 20000);
        client.Page.loadEventFired(() => {
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 500);
        });
        client.Page.reload({}).catch(reject);
      });

      // Stop and collect CSS usage
      const { ruleUsage } = await (client.CSS as any).stopRuleUsageTracking();
      const totalCSSRules: number = ruleUsage.length;
      const usedCSSRules: number = ruleUsage.filter((r: any) => r.used === true).length;
      const unusedCSSRules = totalCSSRules - usedCSSRules;
      const cssUnusedPercentage =
        totalCSSRules > 0
          ? Math.round((unusedCSSRules / totalCSSRules) * 10000) / 100
          : 0;

      // Stop and collect JS coverage
      const { result: jsCoverage } = await client.Profiler.takePreciseCoverage();
      await client.Profiler.stopPreciseCoverage();

      let totalJSBytes = 0;
      let usedJSBytes = 0;
      const fileBreakdown: JSCoverageEntry[] = [];

      for (const scriptCoverage of jsCoverage) {
        // Skip internal chrome-extension and DevTools scripts
        if (
          !scriptCoverage.url ||
          scriptCoverage.url.startsWith('chrome-extension://') ||
          scriptCoverage.url.startsWith('devtools://')
        ) {
          continue;
        }

        let scriptTotal = 0;
        let scriptUsed = 0;

        for (const fn of scriptCoverage.functions) {
          for (const range of fn.ranges) {
            const bytes = range.endOffset - range.startOffset;
            scriptTotal += bytes;
            if (range.count > 0) {
              scriptUsed += bytes;
            }
          }
        }

        totalJSBytes += scriptTotal;
        usedJSBytes += scriptUsed;

        fileBreakdown.push({
          url: scriptCoverage.url,
          totalBytes: scriptTotal,
          usedBytes: scriptUsed,
        });
      }

      const unusedJSBytes = totalJSBytes - usedJSBytes;
      const jsUnusedPercentage =
        totalJSBytes > 0
          ? Math.round((unusedJSBytes / totalJSBytes) * 10000) / 100
          : 0;

      // Sort files by most unused bytes first
      fileBreakdown.sort((a, b) => (b.totalBytes - b.usedBytes) - (a.totalBytes - a.usedBytes));

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            deadCode: {
              css: {
                totalRules: totalCSSRules,
                usedRules: usedCSSRules,
                unusedRules: unusedCSSRules,
                unusedPercentage: cssUnusedPercentage,
              },
              js: {
                totalBytes: totalJSBytes,
                usedBytes: usedJSBytes,
                unusedBytes: unusedJSBytes,
                unusedPercentage: jsUnusedPercentage,
                files: fileBreakdown.slice(0, 20),
              },
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
