import { connectToTab } from '../chrome/connector.js';
import { getAllTabs } from '../chrome/tabs.js';

export async function openCommand(
  url: string,
  options: { port?: string; host?: string; newTab?: boolean }
) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabs = await getAllTabs(port, host);

    if (options.newTab || tabs.length === 0) {
      const CDP = await import('chrome-remote-interface');
      const target = await CDP.New({ port, host, url });
      console.log(
        JSON.stringify(
          { success: true, action: 'opened_new_tab', id: target.id, url },
          null,
          2
        )
      );
    } else {
      const tab = tabs[0];
      const client = await connectToTab(tab.id, port, host);
      await client.Page.enable();
      await client.Page.navigate({ url });
      await client.Page.loadEventFired();
      await client.close();
      console.log(
        JSON.stringify(
          { success: true, action: 'navigated', id: tab.id, url },
          null,
          2
        )
      );
    }
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
