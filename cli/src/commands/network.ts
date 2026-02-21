import { connectToTab, resolveTab } from '../chrome/connector.js';

interface NetworkEntry {
  requestId: string;
  url: string;
  method: string;
  status: number | null;
  type: string | null;
  // Milliseconds from navigationStart to response finish (if available)
  timingMs: number | null;
}

export async function networkCommand(
  tab: number,
  options: { port?: string; host?: string; duration?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';
  const duration = options.duration ? parseInt(options.duration, 10) : 5000;

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Network.enable({});

      // Accumulate partial data keyed by requestId
      const entries = new Map<string, NetworkEntry>();

      client.Network.requestWillBeSent(
        (params: { requestId: string; request: { url: string; method: string }; type: string }) => {
          entries.set(params.requestId, {
            requestId: params.requestId,
            url: params.request.url,
            method: params.request.method,
            status: null,
            type: params.type ?? null,
            timingMs: null,
          });
        }
      );

      client.Network.responseReceived(
        (params: {
          requestId: string;
          response: { status: number; timing?: { receiveHeadersEnd: number; sendStart: number } };
          type: string;
        }) => {
          const entry = entries.get(params.requestId);
          if (entry) {
            entry.status = params.response.status;
            // Use resource type from the response event if not yet set
            if (!entry.type) {
              entry.type = params.type ?? null;
            }
            // Chrome provides timing relative to the request start (ms)
            if (params.response.timing) {
              entry.timingMs =
                params.response.timing.receiveHeadersEnd -
                params.response.timing.sendStart;
            }
          }
        }
      );

      // Monitor for the configured duration
      await new Promise<void>((resolve) => setTimeout(resolve, duration));

      const results = Array.from(entries.values());

      console.log(
        JSON.stringify(
          {
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            durationMs: duration,
            requestCount: results.length,
            requests: results,
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
