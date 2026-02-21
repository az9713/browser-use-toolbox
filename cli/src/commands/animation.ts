import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function animationCommand(
  tab: number,
  options: { port?: string; host?: string; rate?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';
  const playbackRate = Number(options.rate ?? '1');

  if (isNaN(playbackRate) || playbackRate < 0) {
    console.error(JSON.stringify({ error: 'Playback rate must be a non-negative number (e.g. 0.5 for half speed, 0 to pause, 2 for double speed).' }));
    process.exit(1);
  }

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await (client.Animation as any).enable();

      await (client.Animation as any).setPlaybackRate({ playbackRate });

      // Read back the current playback rate to confirm
      const { playbackRate: confirmedRate } = await (client.Animation as any).getPlaybackRate();

      const status =
        confirmedRate === 0
          ? 'paused'
          : confirmedRate === 1
          ? 'normal'
          : confirmedRate > 1
          ? 'fast-forward'
          : 'slow-motion';

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            animation: {
              playbackRate: confirmedRate,
              status,
            },
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
