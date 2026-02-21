import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function themeCommand(
  tab: number,
  css: string,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      // Escape backticks in the CSS to safely embed in template literal
      const escapedCss = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

      const expression = `
        (function() {
          const style = document.createElement('style');
          style.setAttribute('data-cdp-theme', 'true');
          style.textContent = \`${escapedCss}\`;
          document.head.appendChild(style);
          return { appended: true, elementId: style.getAttribute('data-cdp-theme') };
        })()
      `;

      const { result, exceptionDetails } = await client.Runtime.evaluate({
        expression,
        returnByValue: true,
      });

      if (exceptionDetails) {
        const errorText =
          exceptionDetails.exception?.description ??
          exceptionDetails.text ??
          'Unknown evaluation error';
        throw new Error(errorText);
      }

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            injectedCSS: css.substring(0, 100),
            result: result.value,
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
