import { connectToTab, resolveTab } from '../chrome/connector.js';

interface PageSnapshot {
  title: string;
  url: string;
  text: string;
  words: string[];
  meta: Record<string, string>;
  headings: string[];
  linkCount: number;
  imageCount: number;
}

async function getPageSnapshot(
  tabIndex: number,
  port: number,
  host: string
): Promise<PageSnapshot> {
  const tabInfo = await resolveTab(tabIndex, port, host);
  const client = await connectToTab(tabInfo.id, port, host);

  try {
    await client.Runtime.enable();

    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: `
        (function() {
          // Extract meta tags
          const meta = {};
          document.querySelectorAll('meta[name], meta[property]').forEach(function(m) {
            const key = m.getAttribute('name') || m.getAttribute('property');
            const val = m.getAttribute('content');
            if (key && val) meta[key] = val;
          });

          // Extract headings
          const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
            .map(function(h) { return (h.textContent || '').trim(); })
            .filter(Boolean)
            .slice(0, 20);

          // Clean body text
          const text = (document.body ? document.body.innerText : '').replace(/\\s+/g, ' ').trim();

          return {
            title: document.title,
            url: window.location.href,
            text: text.substring(0, 3000),
            meta: meta,
            headings: headings,
            linkCount: document.querySelectorAll('a[href]').length,
            imageCount: document.querySelectorAll('img').length,
          };
        })()
      `,
      returnByValue: true,
    });

    if (exceptionDetails) {
      const errorText =
        exceptionDetails.exception?.description ??
        exceptionDetails.text ??
        'Unknown evaluation error';
      throw new Error(`Tab ${tabIndex}: ${errorText}`);
    }

    const raw = result.value as Omit<PageSnapshot, 'words'> & { text: string };
    const words = raw.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);

    return { ...raw, words };
  } finally {
    await client.close();
  }
}

function computeTextSimilarity(words1: string[], words2: string[]): number {
  if (words1.length === 0 && words2.length === 0) return 1;
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter((w) => set2.has(w)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? Math.round((intersection.size / union.size) * 10000) / 100 : 0;
}

export async function diffCommand(
  tab1: number,
  tab2: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';

  try {
    // Fetch both pages concurrently
    const [snap1, snap2] = await Promise.all([
      getPageSnapshot(tab1, port, host),
      getPageSnapshot(tab2, port, host),
    ]);

    // Word-level diff
    const wordSet1 = new Set(snap1.words);
    const wordSet2 = new Set(snap2.words);

    const uniqueToTab1 = [...wordSet1].filter((w) => !wordSet2.has(w)).slice(0, 50);
    const uniqueToTab2 = [...wordSet2].filter((w) => !wordSet1.has(w)).slice(0, 50);

    const textSimilarity = computeTextSimilarity(snap1.words, snap2.words);

    // Heading diff
    const headingSet1 = new Set(snap1.headings);
    const headingSet2 = new Set(snap2.headings);
    const uniqueHeadingsTab1 = snap1.headings.filter((h) => !headingSet2.has(h));
    const uniqueHeadingsTab2 = snap2.headings.filter((h) => !headingSet1.has(h));

    // Meta diff
    const allMetaKeys = new Set([
      ...Object.keys(snap1.meta),
      ...Object.keys(snap2.meta),
    ]);
    const metaDifferences: Record<string, { tab1: string | null; tab2: string | null }> = {};
    for (const key of allMetaKeys) {
      const v1 = snap1.meta[key] ?? null;
      const v2 = snap2.meta[key] ?? null;
      if (v1 !== v2) {
        metaDifferences[key] = { tab1: v1, tab2: v2 };
      }
    }

    console.log(
      JSON.stringify(
        {
          success: true,
          tab1: { index: tab1, title: snap1.title, url: snap1.url },
          tab2: { index: tab2, title: snap2.title, url: snap2.url },
          differences: {
            titleMatch: snap1.title === snap2.title,
            urlMatch: snap1.url === snap2.url,
            textSimilarityPercent: textSimilarity,
            linkCountDiff: snap2.linkCount - snap1.linkCount,
            imageCountDiff: snap2.imageCount - snap1.imageCount,
            uniqueWordsToTab1: uniqueToTab1,
            uniqueWordsToTab2: uniqueToTab2,
            headings: {
              uniqueToTab1: uniqueHeadingsTab1,
              uniqueToTab2: uniqueHeadingsTab2,
            },
            metaDifferences,
          },
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
