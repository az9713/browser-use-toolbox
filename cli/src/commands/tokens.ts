import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function tokensCommand(
  tab: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      const { result, exceptionDetails } = await client.Runtime.evaluate({
        expression: `
          (function() {
            const elements = Array.from(document.querySelectorAll('*')).slice(0, 500);

            const colorSet = new Set();
            const fontFamilySet = new Set();
            const fontSizeSet = new Set();
            const spacingSet = new Set();
            const borderRadiusSet = new Set();

            for (const el of elements) {
              const style = window.getComputedStyle(el);

              // Colors: foreground and background
              const props = [
                'color', 'backgroundColor', 'borderColor',
                'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor',
                'outlineColor', 'textDecorationColor',
              ];
              for (const prop of props) {
                const val = style[prop];
                if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
                  colorSet.add(val);
                }
              }

              // Font families
              const ff = style.fontFamily;
              if (ff) {
                ff.split(',').forEach(function(f) {
                  const trimmed = f.trim().replace(/['"]/g, '');
                  if (trimmed) fontFamilySet.add(trimmed);
                });
              }

              // Font sizes
              const fs = style.fontSize;
              if (fs && fs !== '0px') fontSizeSet.add(fs);

              // Spacing: margins and paddings
              const spacingProps = [
                'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
              ];
              for (const sp of spacingProps) {
                const val = style[sp];
                if (val && val !== '0px') spacingSet.add(val);
              }

              // Border radius
              const brProps = [
                'borderTopLeftRadius', 'borderTopRightRadius',
                'borderBottomLeftRadius', 'borderBottomRightRadius',
              ];
              for (const br of brProps) {
                const val = style[br];
                if (val && val !== '0px') borderRadiusSet.add(val);
              }
            }

            // Sort spacing and font sizes numerically
            function parseNumeric(val) {
              return parseFloat(val) || 0;
            }

            return {
              colors: Array.from(colorSet).slice(0, 60),
              fonts: Array.from(fontFamilySet).slice(0, 20),
              fontSizes: Array.from(fontSizeSet).sort(function(a, b) { return parseNumeric(a) - parseNumeric(b); }).slice(0, 30),
              spacing: Array.from(spacingSet).sort(function(a, b) { return parseNumeric(a) - parseNumeric(b); }).slice(0, 40),
              borderRadii: Array.from(borderRadiusSet).sort(function(a, b) { return parseNumeric(a) - parseNumeric(b); }).slice(0, 20),
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
        throw new Error(errorText);
      }

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            tokens: result.value,
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
