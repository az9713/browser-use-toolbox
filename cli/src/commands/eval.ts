import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function evalCommand(
  tab: number,
  js: string,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      const response = await client.Runtime.evaluate({
        expression: js,
        // Return the result as a JSON-serialisable object when possible
        returnByValue: true,
        // Surface unhandled promise rejections from async expressions
        awaitPromise: true,
      });

      const { result, exceptionDetails } = response;

      if (exceptionDetails) {
        // The expression threw — surface the error text
        const errorText =
          exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'Unknown evaluation error';
        console.error(JSON.stringify({ error: errorText }));
        process.exit(1);
      }

      // For object subtypes (null, array, etc.) Chrome sets `subtype`
      const type = result.subtype ?? result.type ?? 'undefined';

      // `value` is populated for primitives and objects returned by value;
      // for non-serialisable objects fall back to the `description` string.
      const value =
        result.value !== undefined
          ? result.value
          : result.description ?? null;

      console.log(
        JSON.stringify(
          {
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            expression: js,
            result: {
              value,
              type,
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
