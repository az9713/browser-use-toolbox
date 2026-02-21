import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function fillFormCommand(
  tab: number,
  options: { port?: string; host?: string; data?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Runtime.enable();

      // If --data provided, parse and fill each field
      if (options.data) {
        let fieldMap: Record<string, string>;
        try {
          fieldMap = JSON.parse(options.data);
        } catch {
          throw new Error(
            '--data must be a valid JSON object, e.g. \'{"username":"alice","password":"secret"}\''
          );
        }

        const results: Array<{ field: string; success: boolean; error?: string }> = [];

        for (const [fieldName, value] of Object.entries(fieldMap)) {
          // Find the input by name, id, or associated label text, then fill it
          const fillExpression = `
            (function() {
              // Try by name attribute
              let el = document.querySelector('input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]');

              // Try by id attribute
              if (!el) {
                el = document.querySelector('#${fieldName}');
              }

              // Try by label text
              if (!el) {
                const labels = Array.from(document.querySelectorAll('label'));
                const label = labels.find(l => l.textContent && l.textContent.trim().toLowerCase() === '${fieldName}'.toLowerCase());
                if (label) {
                  const forAttr = label.getAttribute('for');
                  if (forAttr) {
                    el = document.getElementById(forAttr);
                  } else {
                    el = label.querySelector('input, textarea, select');
                  }
                }
              }

              if (!el) {
                return { found: false };
              }

              el.focus();

              if (el.tagName === 'SELECT') {
                const option = Array.from(el.options).find(o => o.value === '${value}' || o.text === '${value}');
                if (option) {
                  el.value = option.value;
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                }
              } else {
                // Clear existing value using native input value setter to trigger React/Vue reactivity
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
                if (nativeInputValueSetter && nativeInputValueSetter.set) {
                  nativeInputValueSetter.set.call(el, '');
                } else {
                  el.value = '';
                }
                el.dispatchEvent(new Event('input', { bubbles: true }));
              }

              return { found: true, tagName: el.tagName, type: el.type || null };
            })()
          `;

          const findResult = await client.Runtime.evaluate({
            expression: fillExpression,
            returnByValue: true,
          });

          const findValue = findResult.result.value as { found: boolean; tagName?: string; type?: string } | undefined;

          if (!findValue || !findValue.found) {
            results.push({ field: fieldName, success: false, error: 'Field not found' });
            continue;
          }

          // Use Input.insertText to type the value
          await client.Input.insertText({ text: String(value) });

          // Dispatch change event to trigger form validation
          await client.Runtime.evaluate({
            expression: `
              (function() {
                const el = document.activeElement;
                if (el) {
                  el.dispatchEvent(new Event('change', { bubbles: true }));
                  el.blur();
                }
              })()
            `,
          });

          results.push({ field: fieldName, success: true });
        }

        console.log(
          JSON.stringify(
            {
              success: true,
              action: 'filled_form',
              tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
              fields: results,
            },
            null,
            2
          )
        );
      } else {
        // Auto-detect all form fields and return their metadata
        const detectExpression = `
          (function() {
            const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
            return inputs
              .filter(el => {
                const type = el.type ? el.type.toLowerCase() : '';
                return type !== 'hidden' && type !== 'submit' && type !== 'button' && type !== 'reset' && type !== 'image';
              })
              .map(el => {
                // Find associated label
                let labelText = null;
                if (el.id) {
                  const label = document.querySelector('label[for="' + el.id + '"]');
                  if (label) labelText = label.textContent ? label.textContent.trim() : null;
                }
                if (!labelText) {
                  const parentLabel = el.closest('label');
                  if (parentLabel) labelText = parentLabel.textContent ? parentLabel.textContent.trim() : null;
                }

                return {
                  name: el.name || null,
                  id: el.id || null,
                  type: el.tagName === 'SELECT' ? 'select' : (el.tagName === 'TEXTAREA' ? 'textarea' : (el.type || 'text')),
                  label: labelText,
                  value: el.value || null,
                  placeholder: el.placeholder || null,
                  required: el.required || false,
                };
              });
          })()
        `;

        const detectResult = await client.Runtime.evaluate({
          expression: detectExpression,
          returnByValue: true,
        });

        const fields = detectResult.result.value;

        console.log(
          JSON.stringify(
            {
              success: true,
              action: 'detected_fields',
              tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
              fields,
            },
            null,
            2
          )
        );
      }
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
