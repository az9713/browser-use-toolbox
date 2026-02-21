import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function contentCommand(
  tab: number,
  options: { port?: string; host?: string }
) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    await client.Runtime.enable();
    const { result } = await client.Runtime.evaluate({
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    await client.close();

    console.log(
      JSON.stringify(
        {
          tab,
          title: tabInfo.title,
          url: tabInfo.url,
          text: result.value as string,
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
