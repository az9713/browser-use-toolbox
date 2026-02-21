import { connectToTab, resolveTab } from '../chrome/connector.js';

interface DeviceProfile {
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
  userAgent: string;
}

// Preset device definitions
const DEVICES: Record<string, DeviceProfile> = {
  iPhone14: {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  },
  iPad: {
    width: 820,
    height: 1180,
    deviceScaleFactor: 2,
    mobile: false,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  },
  Pixel7: {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  },
  desktop: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  },
};

export async function emulateCommand(
  tab: number,
  device: string,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';

  const profile = DEVICES[device];
  if (!profile) {
    const available = Object.keys(DEVICES).join(', ');
    console.error(
      JSON.stringify({
        error: `Unknown device "${device}". Available presets: ${available}`,
      })
    );
    process.exit(1);
  }

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      // Apply viewport and device scale factor
      await client.Emulation.setDeviceMetricsOverride({
        width: profile.width,
        height: profile.height,
        deviceScaleFactor: profile.deviceScaleFactor,
        mobile: profile.mobile,
      });

      // Override the user-agent string
      await client.Emulation.setUserAgentOverride({
        userAgent: profile.userAgent,
      });

      console.log(
        JSON.stringify(
          {
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            device,
            applied: {
              width: profile.width,
              height: profile.height,
              deviceScaleFactor: profile.deviceScaleFactor,
              mobile: profile.mobile,
              userAgent: profile.userAgent,
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
