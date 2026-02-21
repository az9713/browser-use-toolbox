import { connectToTab, resolveTab } from '../chrome/connector.js';

const HTML_MAX_LENGTH = 50000;

export async function htmlCommand(
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
      expression: 'document.documentElement.outerHTML',
      returnByValue: true,
    });
    await client.close();

    const rawHtml = (result.value as string) ?? '';
    const truncated = rawHtml.length > HTML_MAX_LENGTH;
    const html = truncated ? rawHtml.slice(0, HTML_MAX_LENGTH) : rawHtml;

    console.log(
      JSON.stringify(
        {
          tab,
          title: tabInfo.title,
          url: tabInfo.url,
          length: rawHtml.length,
          truncated,
          html,
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
