import { connectToTab, resolveTab } from '../chrome/connector.js';

export async function dialogCommand(
  tab: number,
  action: string,
  options: { port?: string; host?: string; text?: string }
): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : 9222;
  const host = options.host ?? 'localhost';
  const timeoutMs = 5000;

  if (action !== 'accept' && action !== 'dismiss') {
    console.error(
      JSON.stringify({
        error: `Unknown action "${action}". Use "accept" or "dismiss".`,
      })
    );
    process.exit(1);
  }

  try {
    const tabInfo = await resolveTab(tab, port, host);
    const client = await connectToTab(tabInfo.id, port, host);

    try {
      await client.Page.enable();

      let dialogHandled = false;

      const dialogResult = await new Promise<{
        handled: boolean;
        dialogType?: string;
        message?: string;
        defaultPrompt?: string;
      }>((resolve) => {
        // Listen for the dialog opening event
        client.Page.javascriptDialogOpening(
          async (params: {
            url: string;
            message: string;
            type: string;
            hasBrowserHandler: boolean;
            defaultPrompt?: string;
          }) => {
            dialogHandled = true;

            await client.Page.handleJavaScriptDialog({
              accept: action === 'accept',
              // Only relevant for prompt dialogs
              promptText: options.text,
            });

            resolve({
              handled: true,
              dialogType: params.type,
              message: params.message,
              defaultPrompt: params.defaultPrompt,
            });
          }
        );

        // Timeout if no dialog appears within the window
        setTimeout(() => {
          if (!dialogHandled) {
            resolve({ handled: false });
          }
        }, timeoutMs);
      });

      if (!dialogResult.handled) {
        console.log(
          JSON.stringify(
            {
              tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
              action,
              handled: false,
              message: `No dialog appeared within ${timeoutMs}ms.`,
            },
            null,
            2
          )
        );
        return;
      }

      console.log(
        JSON.stringify(
          {
            tab: { index: tab, id: tabInfo.id, title: tabInfo.title },
            action,
            handled: true,
            dialogType: dialogResult.dialogType,
            dialogMessage: dialogResult.message,
            defaultPrompt: dialogResult.defaultPrompt ?? null,
            promptText: options.text ?? null,
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
