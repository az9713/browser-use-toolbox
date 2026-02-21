import { connectToTab, resolveTab } from '../chrome/connector.js';

const NAVIGATION_TARGET = 'navigation';
const IDLE_TARGET = 'idle';
const NETWORK_IDLE_QUIET_PERIOD_MS = 500;
const POLL_INTERVAL_MS = 250;

export async function waitCommand(
  tab: number,
  target: string,
  options: { port?: string; host?: string; timeout?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';
  const timeoutMs = options.timeout ? parseInt(options.timeout, 10) : 10000;

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Page.enable();
      await client.Network.enable({});

      const startTime = Date.now();

      const elapsed = () => Date.now() - startTime;
      const timedOut = () => elapsed() > timeoutMs;

      // ── NAVIGATION ───────────────────────────────────────────────────────
      if (target === NAVIGATION_TARGET) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Timed out after ${timeoutMs}ms waiting for navigation`));
          }, timeoutMs);

          client.Page.loadEventFired(() => {
            clearTimeout(timer);
            resolve();
          });
        });

        console.log(
          JSON.stringify(
            {
              tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
              target,
              success: true,
              elapsedMs: elapsed(),
            },
            null,
            2
          )
        );
        return;
      }

      // ── NETWORK IDLE ─────────────────────────────────────────────────────
      if (target === IDLE_TARGET) {
        let activeRequests = 0;
        let lastActivityAt = Date.now();

        client.Network.requestWillBeSent(() => {
          activeRequests++;
          lastActivityAt = Date.now();
        });

        client.Network.loadingFinished(() => {
          activeRequests = Math.max(0, activeRequests - 1);
          lastActivityAt = Date.now();
        });

        client.Network.loadingFailed(() => {
          activeRequests = Math.max(0, activeRequests - 1);
          lastActivityAt = Date.now();
        });

        await new Promise<void>((resolve, reject) => {
          const interval = setInterval(() => {
            if (timedOut()) {
              clearInterval(interval);
              reject(new Error(`Timed out after ${timeoutMs}ms waiting for network idle`));
              return;
            }
            const quietFor = Date.now() - lastActivityAt;
            if (activeRequests === 0 && quietFor >= NETWORK_IDLE_QUIET_PERIOD_MS) {
              clearInterval(interval);
              resolve();
            }
          }, POLL_INTERVAL_MS);
        });

        console.log(
          JSON.stringify(
            {
              tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
              target,
              success: true,
              elapsedMs: elapsed(),
            },
            null,
            2
          )
        );
        return;
      }

      // ── CSS SELECTOR ─────────────────────────────────────────────────────
      // Treat any other target string as a CSS selector and poll for it
      const selector = target;

      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          if (timedOut()) {
            clearInterval(interval);
            reject(
              new Error(
                `Timed out after ${timeoutMs}ms waiting for selector "${selector}"`
              )
            );
            return;
          }

          try {
            const { result } = await client.Runtime.evaluate({
              expression: `document.querySelector(${JSON.stringify(selector)}) !== null`,
              returnByValue: true,
            });

            if (result.value === true) {
              clearInterval(interval);
              resolve();
            }
          } catch {
            // Evaluation may fail transiently during navigation; keep polling
          }
        }, POLL_INTERVAL_MS);
      });

      console.log(
        JSON.stringify(
          {
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            target,
            success: true,
            elapsedMs: elapsed(),
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
