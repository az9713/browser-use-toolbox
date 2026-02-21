import fs from 'node:fs';
import path from 'node:path';
import { connectToTab, resolveTab } from '../chrome/connector.js';

interface Breakpoint {
  name: string;
  width: number;
  height: number;
}

const BREAKPOINTS: Breakpoint[] = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

export async function responsiveCommand(
  tab: number,
  options: { port?: string; host?: string; output?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';
  const outputDir = options.output ? path.resolve(options.output) : path.resolve('screenshots', 'responsive');

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Page.enable();
      await client.Emulation.setDeviceMetricsOverride({
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const screenshots: Array<{ breakpoint: string; width: number; height: number; path: string }> = [];
      const timestamp = Date.now();

      for (const bp of BREAKPOINTS) {
        // Override device metrics for this breakpoint
        await client.Emulation.setDeviceMetricsOverride({
          width: bp.width,
          height: bp.height,
          deviceScaleFactor: 1,
          mobile: bp.name === 'mobile',
        });

        // Brief pause to allow layout reflow
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        const { data } = await client.Page.captureScreenshot({ format: 'png' });

        const filename = `${bp.name}-${bp.width}x${bp.height}-${timestamp}.png`;
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, Buffer.from(data as string, 'base64'));

        screenshots.push({
          breakpoint: bp.name,
          width: bp.width,
          height: bp.height,
          path: filePath,
        });
      }

      // Reset emulation to defaults (clear override)
      await client.Emulation.clearDeviceMetricsOverride();

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            outputDir,
            screenshots,
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
