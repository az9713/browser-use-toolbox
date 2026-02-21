import { resolveTab } from '../chrome/connector.js';

export async function closeCommand(
  tab: number,
  options: { port?: string; host?: string }
) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabInfo = await resolveTab(tab, port, host);

    const CDP = await import('chrome-remote-interface');
    await CDP.Close({ id: tabInfo.id, port, host });

    console.log(
      JSON.stringify(
        {
          success: true,
          tab,
          closed: {
            id: tabInfo.id,
            title: tabInfo.title,
            url: tabInfo.url,
          },
        },
        null,
        2
      )
    );
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
