// Nitro spec — most JS → sdílené úložiště, ze kterého čte home-screen widget.
//
// Codegen: `npx nitrogen modules/splittingly-widget` vygeneruje C++/Swift/Kotlin
// glue do `modules/splittingly-widget/nitrogen/generated/`. Musí proběhnout
// před nativním buildem (viz README modulu).
//
// Záměrně minimální plocha: appka posílá HOTOVÝ JSON řetězec (viz
// src/widget/contract.ts) a řekne OS, ať widget překreslí. Žádné formátování
// částek tady — to zůstává v src/money.ts.

import type { HybridObject } from 'react-native-nitro-modules';

export interface SplittinglyWidget
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Zapíše `json` (serializovaný WidgetSnapshot) do sdíleného úložiště:
   *  - iOS:     UserDefaults(suiteName: "group.com.balata.splittingly"), klíč "widgetSnapshot"
   *  - Android: SharedPreferences("splittingly_widget"), klíč "widgetSnapshot"
   */
  setSnapshot(json: string): void;

  /**
   * Řekne OS, ať widget překreslí:
   *  - iOS:     WidgetCenter.shared.reloadAllTimelines()
   *  - Android: broadcast ACTION_APPWIDGET_UPDATE pro SplittinglyWidgetProvider
   */
  reload(): void;
}
