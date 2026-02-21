import { connectToTab, resolveTab } from '../chrome/connector.js';

interface A11yIssue {
  type: string;
  severity: 'error' | 'warning';
  description: string;
  nodeId?: number;
  selector?: string;
}

export async function auditA11yCommand(
  tab: number,
  options: { port?: string; host?: string }
): Promise<void> {
  const port = Number(options.port) || 9222;
  const host = options.host || 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Accessibility.enable();

      const { nodes } = await (client.Accessibility as any).getFullAXTree({});

      const issues: A11yIssue[] = [];
      let totalNodes = 0;

      for (const node of nodes) {
        totalNodes++;

        // Skip nodes with no role or ignored nodes
        if (!node.role || node.ignored) continue;

        const role = node.role.value as string | undefined;
        const name = node.name?.value as string | undefined;

        // Check images for missing alt text
        if (role === 'img') {
          if (!name || name.trim() === '') {
            issues.push({
              type: 'missing-alt-text',
              severity: 'error',
              description: 'Image element is missing alternative text (alt attribute or aria-label)',
              nodeId: node.nodeId,
            });
          }
        }

        // Check form inputs/textboxes for missing labels
        if (
          role === 'textbox' ||
          role === 'combobox' ||
          role === 'listbox' ||
          role === 'spinbutton' ||
          role === 'searchbox' ||
          role === 'slider' ||
          role === 'checkbox' ||
          role === 'radio'
        ) {
          if (!name || name.trim() === '') {
            issues.push({
              type: 'missing-form-label',
              severity: 'error',
              description: `Form control with role "${role}" is missing an accessible name (label, aria-label, or aria-labelledby)`,
              nodeId: node.nodeId,
            });
          }
        }

        // Check buttons for missing labels
        if (role === 'button' || role === 'link') {
          if (!name || name.trim() === '') {
            issues.push({
              type: 'missing-interactive-label',
              severity: 'error',
              description: `Interactive element with role "${role}" has no accessible name`,
              nodeId: node.nodeId,
            });
          }
        }

        // Check for generic containers that might need ARIA roles
        if (role === 'generic' || role === 'none') {
          // Only flag if it has interactive children indicators
          const hasKeyboardHandler =
            node.properties?.some(
              (p: any) =>
                p.name === 'focusable' && p.value?.value === true
            ) ?? false;
          if (hasKeyboardHandler) {
            issues.push({
              type: 'missing-aria-role',
              severity: 'warning',
              description: 'Focusable element lacks a semantic role; consider adding an ARIA role',
              nodeId: node.nodeId,
            });
          }
        }
      }

      // Use Runtime to check for potential contrast issues (elements with very light text)
      await client.Runtime.enable();
      const { result: contrastResult } = await client.Runtime.evaluate({
        expression: `
          (function() {
            const issues = [];
            const textElements = Array.from(document.querySelectorAll('p, span, a, li, td, th, h1, h2, h3, h4, h5, h6, label, button'));
            for (const el of textElements.slice(0, 200)) {
              const style = window.getComputedStyle(el);
              const color = style.color;
              const bg = style.backgroundColor;
              // Very naive check: flag rgba(0,0,0,0) or near-white text on white bg
              if (
                (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') &&
                el.textContent && el.textContent.trim().length > 0
              ) {
                issues.push({
                  type: 'low-contrast-indicator',
                  severity: 'warning',
                  selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''),
                  description: 'Element may have invisible text (transparent color detected)',
                });
              }
            }
            return issues.slice(0, 20);
          })()
        `,
        returnByValue: true,
      });

      const contrastIssues: A11yIssue[] = Array.isArray(contrastResult.value)
        ? (contrastResult.value as A11yIssue[])
        : [];

      const allIssues = [...issues, ...contrastIssues];
      const errorCount = allIssues.filter((i) => i.severity === 'error').length;
      const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

      // Score: start at 100, deduct 10 per error, 3 per warning, minimum 0
      const score = Math.max(0, 100 - errorCount * 10 - warningCount * 3);

      console.log(
        JSON.stringify(
          {
            success: true,
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            url: tabInfo.url,
            audit: {
              score,
              totalNodes,
              issueCount: allIssues.length,
              errors: errorCount,
              warnings: warningCount,
              issues: allIssues,
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
