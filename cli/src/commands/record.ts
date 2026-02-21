import fs from 'node:fs';
import path from 'node:path';
import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function recordCommand(
  tab: number,
  action: string,
  options: { port?: string; host?: string; output?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';
  const outputDir = options.output ?? 'screenshots';
  const captureDurationMs = 5000;

  if (action !== 'start' && action !== 'stop') {
    console.error(JSON.stringify({ error: `Unknown action "${action}". Use "start" or "stop".` }));
    process.exit(1);
  }

  // "stop" with no persistent state just reports that nothing is running
  if (action === 'stop') {
    console.log(
      JSON.stringify(
        {
          action: 'stop',
          message:
            'CLI is stateless between invocations. Use "start" to capture frames (runs for 5 seconds then stops automatically).',
        },
        null,
        2
      )
    );
    return;
  }

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      // Ensure the output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await client.Page.enable();

      const frames: string[] = [];

      // Collect screencast frames as base64 PNG data
      client.Page.screencastFrame(async (params: { data: string; sessionId: number }) => {
        frames.push(params.data);
        // Acknowledge the frame so Chrome continues sending
        await client.Page.screencastFrameAck({ sessionId: params.sessionId }).catch(() => {});
      });

      await client.Page.startScreencast({
        format: 'png',
        quality: 80,
        maxWidth: 1280,
        maxHeight: 800,
        everyNthFrame: 1,
      });

      // Capture for the configured duration then stop
      await new Promise<void>((resolve) => setTimeout(resolve, captureDurationMs));

      await client.Page.stopScreencast();

      // Write each frame to disk as a numbered PNG
      let savedCount = 0;
      for (let i = 0; i < frames.length; i++) {
        const filePath = path.join(outputDir, `frame_${String(i).padStart(4, '0')}.png`);
        fs.writeFileSync(filePath, Buffer.from(frames[i], 'base64'));
        savedCount++;
      }

      console.log(
        JSON.stringify(
          {
            action: 'start',
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            captureDurationMs,
            frameCount: savedCount,
            outputDir: path.resolve(outputDir),
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
