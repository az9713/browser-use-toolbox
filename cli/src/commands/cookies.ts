import { connectToTab, resolveTab } from '../chrome/connector.js';

interface CookieSpec {
  name: string;
  value?: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
}

export async function cookiesCommand(
  tab: number,
  options: { port?: string; host?: string; set?: string; delete?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Network.enable({});

      // ── SET ──────────────────────────────────────────────────────────────
      if (options.set) {
        let cookieSpec: CookieSpec;
        try {
          cookieSpec = JSON.parse(options.set) as CookieSpec;
        } catch {
          throw new Error(
            `Invalid JSON for --set. Expected an object like {"name":"key","value":"val","domain":"example.com"}`
          );
        }

        if (!cookieSpec.name) {
          throw new Error('Cookie spec must include a "name" field');
        }

        await client.Network.setCookie({
          name: cookieSpec.name,
          value: cookieSpec.value ?? '',
          domain: cookieSpec.domain,
          path: cookieSpec.path ?? '/',
          secure: cookieSpec.secure ?? false,
          httpOnly: cookieSpec.httpOnly ?? false,
          sameSite: cookieSpec.sameSite as any,
        });

        console.log(
          JSON.stringify(
            {
              action: 'set',
              tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
              cookie: cookieSpec,
            },
            null,
            2
          )
        );
        return;
      }

      // ── DELETE ───────────────────────────────────────────────────────────
      if (options.delete) {
        // Derive the domain from the tab's URL when not explicitly provided
        const tabUrl = new URL(tabInfo.url);
        await client.Network.deleteCookies({
          name: options.delete,
          domain: tabUrl.hostname,
        });

        console.log(
          JSON.stringify(
            {
              action: 'delete',
              tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
              deletedName: options.delete,
              domain: tabUrl.hostname,
            },
            null,
            2
          )
        );
        return;
      }

      // ── LIST (default) ───────────────────────────────────────────────────
      const { cookies } = await client.Network.getCookies({ urls: [tabInfo.url] });

      console.log(
        JSON.stringify(
          {
            action: 'list',
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            cookieCount: cookies.length,
            cookies,
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
