// Bezpečný přístup k Nitro modulu widgetu.
//
// Guardováno jako `src/admob.ts`: v Expo Go, na webu a kdykoli kód ještě
// není zaregistrovaný v Nitro registru vrací `null` a volající nechá být.
// Žádné volání `createHybridObject` na úrovni modulu — až líně a v try/catch.

import type { SplittinglyWidget } from './src/SplittinglyWidget.nitro';

const HYBRID_NAME = 'SplittinglyWidget';

let cached: SplittinglyWidget | null = null;
let triedAndFailed = false;

export function getSplittinglyWidget(): SplittinglyWidget | null {
  if (cached) return cached;
  if (triedAndFailed) return null;
  try {
    // `require`, ne `import` — v Expo Go nativní část chybí a i tenhle require
    // může házet. Chytáme a degradujeme na no-op.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NitroModules } = require('react-native-nitro-modules');
    if (!NitroModules || typeof NitroModules.hasHybridObject !== 'function') {
      triedAndFailed = true;
      return null;
    }
    if (!NitroModules.hasHybridObject(HYBRID_NAME)) {
      triedAndFailed = true;
      return null;
    }
    cached = NitroModules.createHybridObject(HYBRID_NAME) as SplittinglyWidget;
    return cached;
  } catch {
    triedAndFailed = true;
    return null;
  }
}

export type { SplittinglyWidget } from './src/SplittinglyWidget.nitro';
