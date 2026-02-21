import { connectToTab, resolveTab } from '../chrome/connector.js';

interface ConsoleMessage {
  type: string;
  args: string[];
  timestamp: number;
}

export async function consoleCommand(
  tab: number,
  options: { port?: string; host?: string; duration?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';
  const duration = options.duration ? parseInt(options.duration, 10) : 3000;

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      const messages: ConsoleMessage[] = [];

      client.Runtime.consoleAPICalled(
        (params: { type: string; args: Array<{ type: string; value?: any; description?: string }>; timestamp: number }) => {
          // Flatten each argument to a human-readable string
          const args = params.args.map((arg) => {
            if (arg.value !== undefined) {
              return typeof arg.value === 'string'
                ? arg.value
                : JSON.stringify(arg.value);
            }
            return arg.description ?? `[${arg.type}]`;
          });

          messages.push({
            type: params.type,
            args,
            timestamp: params.timestamp,
          });
        }
      );

      // Listen for the configured duration then report
      await new Promise<void>((resolve) => setTimeout(resolve, duration));

      console.log(
        JSON.stringify(
          {
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            durationMs: duration,
            messageCount: messages.length,
            messages,
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
