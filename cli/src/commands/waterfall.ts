import { connectToTab, resolveTab } from '../chrome/connector.js';

interface WaterfallEntry {
  requestId: string;
  url: string;
  method: string;
  status: number | null;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  size: number | null;
  mimeType: string | null;
}

export async function waterfallCommand(
  tab: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Network.enable({});
      await client.Page.enable();

      const requests = new Map<string, WaterfallEntry>();

      // Capture outgoing requests
      client.Network.requestWillBeSent((params: any) => {
        requests.set(params.requestId, {
          requestId: params.requestId,
          url: params.request.url,
          method: params.request.method,
          status: null,
          startTime: params.timestamp * 1000, // convert to ms
          endTime: null,
          duration: null,
          size: null,
          mimeType: null,
        });
      });

      // Capture responses
      client.Network.responseReceived((params: any) => {
        const entry = requests.get(params.requestId);
        if (entry) {
          entry.status = params.response.status;
          entry.mimeType = params.response.mimeType ?? null;
        }
      });

      // Capture loading finish for timing and size
      client.Network.loadingFinished((params: any) => {
        const entry = requests.get(params.requestId);
        if (entry) {
          entry.endTime = params.timestamp * 1000;
          entry.duration = entry.endTime - entry.startTime;
          entry.size = params.encodedDataLength ?? null;
        }
      });

      // Reload the page and wait for it to fully load
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 15000);

        client.Page.loadEventFired(() => {
          // Give an extra 500ms for any late network events
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 500);
        });

        client.Page.reload({}).catch(reject);
      });

      // Build sorted waterfall
      const waterfall = Array.from(requests.values())
        .filter((e) => e.url && !e.url.startsWith('data:'))
        .sort((a, b) => a.startTime - b.startTime)
        .map((e) => ({
          url: e.url,
          method: e.method,
          status: e.status,
          startTimeMs: Math.round(e.startTime),
          endTimeMs: e.endTime !== null ? Math.round(e.endTime) : null,
          durationMs: e.duration !== null ? Math.round(e.duration) : null,
          sizeBytes: e.size,
          mimeType: e.mimeType,
        }));

      const totalDuration =
        waterfall.length > 0
          ? (waterfall[waterfall.length - 1].endTimeMs ?? 0) - (waterfall[0].startTimeMs ?? 0)
          : 0;

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            waterfall: {
              requestCount: waterfall.length,
              totalDurationMs: totalDuration,
              entries: waterfall,
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
