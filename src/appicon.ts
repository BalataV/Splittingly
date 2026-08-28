// Přepnutí ikony aplikace (Pro, batch 2).
//
// Napojeno na `expo-alternate-app-icons@8.0.0`. `require` je lazy a v
// try/catch — stejně jako `src/admob.ts` a `src/applock.ts` — protože balík
// při importu sahá do nativní vrstvy a v Expo Go / na webu by shodil celý
// modul. Reálně se dá vyzkoušet až z dev/produkčního buildu; v Expo Go
// `supportsAltIcons()` vrací `false` a picker se v Nastavení neukáže.
//
// Klíče ikon odpovídají `expo-alternate-app-icons` konfiguraci v `app.json`
// (`AppIcon-Mint`, `AppIcon-Neon`, `AppIcon-Dusk`). Prázdný řetězec / `null`
// = výchozí ikona.

import Constants, { ExecutionEnvironment } from 'expo-constants';

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type AltIcons = typeof import('expo-alternate-app-icons');

let mod: AltIcons | null = null;
let tried = false;

function getModule(): AltIcons | null {
  if (IS_EXPO_GO) return null;
  if (tried) return mod;
  tried = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('expo-alternate-app-icons') as AltIcons;
  } catch {
    mod = null;
  }
  return mod;
}

/** Umí tahle platforma/build přepínat ikonu za běhu? */
export function supportsAltIcons(): boolean {
  const m = getModule();
  if (!m) return false;
  try {
    return m.supportsAlternateIcons === true;
  } catch {
    return false;
  }
}

/**
 * Přepne ikonu na `key` (`''` nebo `null` = výchozí).
 * Chybu (nepodporováno, neznámý klíč) jen zaloguje — přepnutí ikony je
 * kosmetika, nesmí shodit tok v Nastavení.
 */
export async function setIcon(key: string | null): Promise<void> {
  const m = getModule();
  if (!m) return;
  try {
    if (!key) {
      await m.resetAppIcon();
    } else {
      await m.setAlternateAppIcon(key as never);
    }
  } catch (e) {
    console.warn('[appicon] přepnutí ikony selhalo:', String(e));
  }
}

/** Název aktivní ikony (`''` = výchozí). */
export function currentIcon(): string {
  const m = getModule();
  if (!m) return '';
  try {
    return m.getAppIconName() ?? '';
  } catch {
    return '';
  }
}
