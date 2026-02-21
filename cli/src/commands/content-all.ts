import { connectToTab } from '../chrome/connector.js';
import { getAllTabs } from '../chrome/tabs.js';

export async function contentAllCommand(options: {
  port?: string;
  host?: string;
}) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabs = await getAllTabs(port, host);

    const results: { tab: number; title: string; url: string; text: string }[] =
      [];

    for (const tabInfo of tabs) {
      try {
        const client = await connectToTab(tabInfo.id, port, host);
        await client.Runtime.enable();
        const { result } = await client.Runtime.evaluate({
          expression: 'document.body.innerText',
          returnByValue: true,
        });
        await client.close();
        results.push({
          tab: tabInfo.index,
          title: tabInfo.title,
          url: tabInfo.url,
          text: (result.value as string) ?? '',
        });
      } catch (tabError: any) {
        // Record the failure for this tab but continue processing others
        results.push({
          tab: tabInfo.index,
          title: tabInfo.title,
          url: tabInfo.url,
          text: `[error: ${tabError.message}]`,
        });
      }
    }

    console.log(JSON.stringify(results, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
