// Webová náhrada za `index.ts` — widget na webu neexistuje, všechno no-op.
// Metro si `.web.ts` vybere pro platformu `web` automaticky.

import type { WidgetSnapshot } from './contract';

export function widgetBridgeReady(): boolean {
  return false;
}

export async function writeWidgetSnapshot(_snapshot: WidgetSnapshot): Promise<void> {
  // Na webu se widget nikdy nezapisuje.
}

export async function reloadWidgets(): Promise<void> {
  // Na webu není co překreslovat.
}

export { buildWidgetSnapshot, emptySnapshot } from './contract';
export type { WidgetSnapshot } from './contract';
