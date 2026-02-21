import { connectToTab, resolveTab } from '../chrome/connector.js';

interface SearchMatch {
  text: string;
  context: string;
  element: string;
  index: number;
}

export async function searchCommand(
  tab: number,
  query: string,
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
        var query = ${JSON.stringify(query)};
        var queryLower = query.toLowerCase();
        var matches = [];
        var index = 0;

        var walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        var node;
        while ((node = walker.nextNode())) {
          var value = node.nodeValue || '';
          if (value.toLowerCase().includes(queryLower)) {
            var parent = node.parentElement;
            var elementTag = parent ? parent.tagName.toLowerCase() : 'unknown';
            var elementId = parent && parent.id ? '#' + parent.id : '';
            var elementClass = parent && parent.className
              ? '.' + String(parent.className).trim().split(/\\s+/).join('.')
              : '';

            // Build a short context window around the match
            var valueTrimmed = value.trim();
            var matchStart = valueTrimmed.toLowerCase().indexOf(queryLower);
            var contextStart = Math.max(0, matchStart - 40);
            var contextEnd = Math.min(valueTrimmed.length, matchStart + query.length + 40);
            var context = (contextStart > 0 ? '...' : '') +
              valueTrimmed.slice(contextStart, contextEnd) +
              (contextEnd < valueTrimmed.length ? '...' : '');

            matches.push({
              text: query,
              context: context,
              element: elementTag + elementId + elementClass,
              index: index++,
            });
          }
        }

        return JSON.stringify(matches);
      })()
    `;

    const { result } = await client.Runtime.evaluate({
      expression,
      returnByValue: true,
    });
    await client.close();

    const matches: SearchMatch[] = JSON.parse(result.value as string);

    console.log(
      JSON.stringify(
        {
          tab,
          title: tabInfo.title,
          url: tabInfo.url,
          query,
          total: matches.length,
          matches,
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
