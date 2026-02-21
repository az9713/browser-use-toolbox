import CDP from 'chrome-remote-interface';
import { getAllTabs } from './tabs.js';

export async function connectToTab(
  tabId: string,
  port: number = 9222,
  host: string = 'localhost'
): Promise<any> {
  const client = await CDP({ target: tabId, port, host });
  return client;
}

export async function resolveTab(
  tabIndex: number,
  port: number = 9222,
  host: string = 'localhost'
): Promise<{ id: string; title: string; url: string }> {
  const tabs = await getAllTabs(port, host);
  if (tabIndex < 0 || tabIndex >= tabs.length) {
    throw new Error(
      `Tab index ${tabIndex} out of range. ${tabs.length} tab(s) open.`
    );
  }
  return tabs[tabIndex];
}
