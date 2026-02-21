import { connectToTab, resolveTab } from '../chrome/connector.js';

interface MetaTag {
  name: string | null;
  property: string | null;
  content: string | null;
}

interface PageDescription {
  tab: number;
  title: string;
  url: string;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonical: string | null;
  h1: string | null;
  language: string | null;
  metaTags: MetaTag[];
}

export async function descCommand(
  tab: number,
  options: { port?: string; host?: string }
) {
  try {
    const port = Number(options.port) || 9222;
    const host = options.host || 'localhost';
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    await client.Runtime.enable();

    const expression = `
      (function() {
        function getMeta(nameOrProp) {
          var el =
            document.querySelector('meta[name="' + nameOrProp + '"]') ||
            document.querySelector('meta[property="' + nameOrProp + '"]');
          return el ? el.getAttribute('content') : null;
        }

        var canonical = document.querySelector('link[rel="canonical"]');
        var h1 = document.querySelector('h1');
        var allMeta = Array.from(document.querySelectorAll('meta')).map(function(m) {
          return {
            name: m.getAttribute('name'),
            property: m.getAttribute('property'),
            content: m.getAttribute('content'),
          };
        });

        return JSON.stringify({
          title: document.title || null,
          description: getMeta('description'),
          keywords: getMeta('keywords'),
          ogTitle: getMeta('og:title'),
          ogDescription: getMeta('og:description'),
          ogImage: getMeta('og:image'),
          canonical: canonical ? canonical.getAttribute('href') : null,
          h1: h1 ? h1.innerText.trim() : null,
          language: document.documentElement.lang || null,
          metaTags: allMeta,
        });
      })()
    `;

    const { result } = await client.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    await client.close();

    const pageData = JSON.parse(result.value as string);

    const output: PageDescription = {
      tab,
      title: pageData.title ?? tabInfo.title,
      url: tabInfo.url,
      description: pageData.description,
      keywords: pageData.keywords,
      ogTitle: pageData.ogTitle,
      ogDescription: pageData.ogDescription,
      ogImage: pageData.ogImage,
      canonical: pageData.canonical,
      h1: pageData.h1,
      language: pageData.language,
      metaTags: pageData.metaTags,
    };

    console.log(JSON.stringify(output, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
