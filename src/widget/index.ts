// Fasáda pro zápis dat do home-screen widgetu.
//
// Most: vlastní Nitro modul `modules/splittingly-widget` (schválil architekt —
// žádná nová závislost na bridge, `react-native-nitro-modules` už v balíčku).
// `getSplittinglyWidget()` vrací instanci nebo `null` v Expo Go / na webu /
// dokud není nativní část zaregistrovaná. Guardováno jako `src/admob.ts`.
//
// POZNÁMKA: nativní část se ověří až buildem — `nitrogen` codegen a napojení
// podspec/gradle viz modules/splittingly-widget/README.md.

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { getSplittinglyWidget } from '../../modules/splittingly-widget';
import type { WidgetSnapshot } from './contract';

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** `true`, když je nativní Nitro modul k dispozici (dev/produkční build s widgetem). */
export function widgetBridgeReady(): boolean {
  if (IS_EXPO_GO) return false;
  return getSplittinglyWidget() !== null;
}

/**
 * Uloží snapshot tam, kde ho widget čte, a hned si vyžádá překreslení.
 *
 * iOS: `JSON.stringify(snapshot)` → `UserDefaults(suiteName:)` klíč
 * `widgetSnapshot`. Android: `SharedPreferences("splittingly_widget")`.
 * Když most není (Expo Go, web), tiše se přeskočí — widget je nadstavba,
 * ne kritická cesta.
 */
export async function writeWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  const mod = IS_EXPO_GO ? null : getSplittinglyWidget();
  if (!mod) {
    if (__DEV__) {
      console.log('[widget] snapshot (most nedostupný, nezapsáno):', JSON.stringify(snapshot));
    }
    return;
  }
  try {
    mod.setSnapshot(JSON.stringify(snapshot));
    mod.reload();
  } catch (e) {
    // Nikdy netiš chybu bez logu (AGENTS.md). Widget ale neshazuje appku.
    console.warn('[widget] zápis snapshotu selhal:', e);
  }
}

/** Řekne OS, ať překreslí widget, beze změny dat. */
export async function reloadWidgets(): Promise<void> {
  const mod = IS_EXPO_GO ? null : getSplittinglyWidget();
  if (!mod) return;
  try {
    mod.reload();
  } catch (e) {
    console.warn('[widget] reload selhal:', e);
  }
}

export { buildWidgetSnapshot, emptySnapshot } from './contract';
export type { WidgetSnapshot } from './contract';
