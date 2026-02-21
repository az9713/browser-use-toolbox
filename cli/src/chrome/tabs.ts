import http from 'node:http';

export interface TabInfo {
  index: number;
  id: string;
  title: string;
  url: string;
}

interface ChromeTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
}

export async function getAllTabs(
  port: number = 9222,
  host: string = 'localhost'
): Promise<TabInfo[]> {
  return new Promise((resolve, reject) => {
    http
      .get(`http://${host}:${port}/json/list`, (res) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          try {
            const targets: ChromeTarget[] = JSON.parse(data);
            const pages = targets
              .filter((t) => t.type === 'page')
              .map((t, i) => ({
                index: i,
                id: t.id,
                title: t.title,
                url: t.url,
              }));
            resolve(pages);
          } catch (e) {
            reject(new Error('Failed to parse Chrome targets'));
          }
        });
      })
      .on('error', (err) => {
        reject(
          new Error(
            `Cannot connect to Chrome on ${host}:${port}. Is Chrome running with --remote-debugging-port=${port}?`
          )
        );
      });
  });
}
