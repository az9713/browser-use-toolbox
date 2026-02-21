import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function backCommand(
  tab: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Page.enable();
      const history = await client.Page.getNavigationHistory();
      const { currentIndex, entries } = history;

      if (currentIndex <= 0) {
        console.log(
          JSON.stringify(
            {
              success: false,
              message: 'Already at the beginning of history',
              currentIndex,
              totalEntries: entries.length,
            },
            null,
            2
          )
        );
        return;
      }

      const targetEntry = entries[currentIndex - 1];
      await client.Page.navigateToHistoryEntry({ entryId: targetEntry.id });

      console.log(
        JSON.stringify(
          {
            success: true,
            action: 'navigated_back',
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            navigatedTo: {
              title: targetEntry.title,
              url: targetEntry.url,
            },
            historyIndex: currentIndex - 1,
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
