// Fasáda pro zápis dat do home-screen widgetu.
//
// STAV: STUB. Skutečný most JS → sdílené úložiště (iOS App Group
// UserDefaults, Android SharedPreferences) ještě není zapojený —
// viz PLAN-pro-batch-2.md §1.5. Do té doby jsou obě funkce no-op, takže
// je volající (ui-a-lokalizace, batch 2) může bezpečně volat už teď.
//
// TODO(architekt): rozhodnout most — vlastní Nitro modul (žádná nová
// závislost, `react-native-nitro-modules` už je v balíčku) vs komunitní
// `react-native-shared-group-preferences`. Pak nahradit tělo `persist()`.
//
// Guardováno jako `src/admob.ts`: v Expo Go a na webu chybí nativní část,
// takže se nic nevolá a nic nespadne.

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SNAPSHOT_KEY, type WidgetSnapshot } from './contract';

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** `true`, jakmile bude nativní most k dispozici. Zatím vždy `false`. */
export function widgetBridgeReady(): boolean {
  return false;
}

/**
 * Uloží snapshot tam, kde ho widget čte. Zatím no-op.
 *
 * Až bude most hotový: na iOS zapíše `JSON.stringify(snapshot)` do
 * `UserDefaults(suiteName:)` pod `SNAPSHOT_KEY`, na Androidu do
 * `SharedPreferences` — a hned zavolá `reloadWidgets()`.
 */
export async function writeWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  if (IS_EXPO_GO || !widgetBridgeReady()) {
    if (__DEV__) {
      // Ať je v dev logu vidět, že se fasáda volá, i když most nefunguje.
      console.log('[widget] snapshot (bridge stub, not persisted):', JSON.stringify(snapshot));
    }
    return;
  }
  // TODO(architekt): persist(SNAPSHOT_KEY, JSON.stringify(snapshot)) + reloadWidgets()
  void SNAPSHOT_KEY;
}

/** Řekne OS, ať překreslí widget. Zatím no-op. */
export async function reloadWidgets(): Promise<void> {
  if (IS_EXPO_GO || !widgetBridgeReady()) return;
  // TODO(architekt): iOS WidgetCenter.reloadAllTimelines(), Android AppWidgetManager broadcast
}

export { buildWidgetSnapshot, emptySnapshot } from './contract';
export type { WidgetSnapshot } from './contract';
