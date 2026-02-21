import { getAllTabs } from '../chrome/tabs.js';

export async function listCommand(options: { port?: string; host?: string }) {
  try {
    const tabs = await getAllTabs(Number(options.port) || 9222, options.host);
    console.log(JSON.stringify(tabs, null, 2));
  } catch (error: any) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}
