import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function perfCommand(
  tab: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Performance.enable({});
      await client.Runtime.enable();

      // Collect CDP Performance metrics
      const { metrics } = await client.Performance.getMetrics();

      // Build a keyed map for easier access
      const metricsMap: Record<string, number> = {};
      for (const m of metrics) {
        metricsMap[m.name] = m.value;
      }

      // Collect window.performance.timing from the page
      const { result: timingResult } = await client.Runtime.evaluate({
        expression: `
          (function() {
            const t = window.performance && window.performance.timing;
            if (!t) return null;
            const origin = t.navigationStart;
            return {
              navigationStart: t.navigationStart,
              dnsLookup: t.domainLookupEnd - t.domainLookupStart,
              tcpConnect: t.connectEnd - t.connectStart,
              ttfb: t.responseStart - t.requestStart,
              responseDownload: t.responseEnd - t.responseStart,
              domInteractive: t.domInteractive - origin,
              domContentLoaded: t.domContentLoadedEventEnd - origin,
              domComplete: t.domComplete - origin,
              loadEvent: t.loadEventEnd - origin,
            };
          })()
        `,
        returnByValue: true,
      });

      // Collect navigation entries
      const { result: navResult } = await client.Runtime.evaluate({
        expression: `
          (function() {
            const entries = window.performance && window.performance.getEntriesByType
              ? window.performance.getEntriesByType('navigation')
              : [];
            if (!entries || entries.length === 0) return null;
            const e = entries[0];
            return {
              type: e.type,
              redirectCount: e.redirectCount,
              dnsLookupMs: Math.round(e.domainLookupEnd - e.domainLookupStart),
              tcpConnectMs: Math.round(e.connectEnd - e.connectStart),
              ttfbMs: Math.round(e.responseStart - e.requestStart),
              responseMs: Math.round(e.responseEnd - e.responseStart),
              domInteractiveMs: Math.round(e.domInteractive),
              domCompleteMs: Math.round(e.domComplete),
              loadEventMs: Math.round(e.loadEventEnd),
              transferSize: e.transferSize,
              encodedBodySize: e.encodedBodySize,
              decodedBodySize: e.decodedBodySize,
            };
          })()
        `,
        returnByValue: true,
      });

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            metrics: {
              cdp: {
                taskDurationMs: Math.round((metricsMap['TaskDuration'] ?? 0) * 1000),
                scriptDurationMs: Math.round((metricsMap['ScriptDuration'] ?? 0) * 1000),
                layoutDurationMs: Math.round((metricsMap['LayoutDuration'] ?? 0) * 1000),
                recalcStyleDurationMs: Math.round((metricsMap['RecalcStyleDuration'] ?? 0) * 1000),
                jsHeapUsedSizeBytes: metricsMap['JSHeapUsedSize'] ?? 0,
                jsHeapTotalSizeBytes: metricsMap['JSHeapTotalSize'] ?? 0,
                nodes: metricsMap['Nodes'] ?? 0,
                documents: metricsMap['Documents'] ?? 0,
                frames: metricsMap['Frames'] ?? 0,
                layoutCount: metricsMap['LayoutCount'] ?? 0,
                recalcStyleCount: metricsMap['RecalcStyleCount'] ?? 0,
              },
              timing: timingResult.value ?? null,
              navigation: navResult.value ?? null,
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
