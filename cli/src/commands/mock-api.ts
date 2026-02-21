import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function mockApiCommand(
  tab: number,
  url: string,
  response: string,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';
  const interceptDurationMs = 10000;

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      // Enable Fetch interception for requests matching the given URL pattern
      await client.Fetch.enable({
        patterns: [{ urlPattern: url }],
      });

      let mockedCount = 0;
      const interceptedRequests: Array<{ url: string; method: string }> = [];

      client.Fetch.requestPaused(
        async (params: {
          requestId: string;
          request: { url: string; method: string };
        }) => {
          mockedCount++;
          interceptedRequests.push({
            url: params.request.url,
            method: params.request.method,
          });

          // Determine the content type of the provided response body
          let responseBody = response;
          let contentType = 'text/plain';

          try {
            JSON.parse(response);
            contentType = 'application/json';
          } catch {
            // Not JSON — send as plain text
          }

          // Respond to the paused request with the mock body
          await client.Fetch.fulfillRequest({
            requestId: params.requestId,
            responseCode: 200,
            responseHeaders: [
              { name: 'Content-Type', value: contentType },
              { name: 'Access-Control-Allow-Origin', value: '*' },
            ],
            body: Buffer.from(responseBody).toString('base64'),
          }).catch(() => {
            // The request may have been cancelled; ignore errors here
          });
        }
      );

      // Wait for the intercept window then clean up
      await new Promise<void>((resolve) => setTimeout(resolve, interceptDurationMs));

      await client.Fetch.disable();

      console.log(
        JSON.stringify(
          {
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            urlPattern: url,
            interceptDurationMs,
            mocked: mockedCount,
            interceptedRequests,
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
