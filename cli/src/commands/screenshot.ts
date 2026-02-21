import fs from 'node:fs';
import path from 'node:path';
import { connectToTab } from '../chrome/connector.js';
import { resolveTab } from '../chrome/connector.js';

export async function screenshotCommand(
  tab: number,
  options: { port?: string; host?: string; output?: string; full?: boolean }
) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    await client.Page.enable();

    let clip: { x: number; y: number; width: number; height: number; scale: number } | undefined;

    if (options.full) {
      // Get the full page dimensions via Runtime so we can capture everything
      await client.Runtime.enable();
      const { result } = await client.Runtime.evaluate({
        expression: 'JSON.stringify({ width: document.body.scrollWidth, height: document.body.scrollHeight })',
        returnByValue: true,
      });
      const dims: { width: number; height: number } = JSON.parse(result.value as string);

      await client.Emulation.setDeviceMetricsOverride({
        width: dims.width,
        height: dims.height,
        deviceScaleFactor: 1,
        mobile: false,
      });

      clip = { x: 0, y: 0, width: dims.width, height: dims.height, scale: 1 };
    }

    const screenshotParams: Record<string, unknown> = { format: 'png' };
    if (clip) {
      screenshotParams.clip = clip;
    }

    const { data } = await client.Page.captureScreenshot(screenshotParams as any);
    await client.close();

    // Determine output path
    const timestamp = Date.now();
    const defaultDir = 'screenshots';
    const defaultFilename = `screenshot-${tab}-${timestamp}.png`;
    const outputPath = options.output
      ? path.resolve(options.output)
      : path.resolve(defaultDir, defaultFilename);

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, Buffer.from(data as string, 'base64'));

    console.log(
      JSON.stringify(
        {
          success: true,
          tab,
          title: tabInfo.title,
          url: tabInfo.url,
          path: outputPath,
          full: options.full ?? false,
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
