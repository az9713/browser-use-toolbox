import CDP from 'chrome-remote-interface';
import { resolveTab } from '../chrome/connector.js';

export async function switchCommand(
  tab: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);

    // Connect at the browser level (no specific target) to call Target domain
    const client = await CDP({ port, host });

    try {
      await client.Target.activateTarget({ targetId: tabInfo.id });

      console.log(
        JSON.stringify(
          {
            success: true,
            action: 'switched_tab',
            tab: {
              index: tab,
              id: tabInfo.id,
              title: tabInfo.title,
              url: tabInfo.url,
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
