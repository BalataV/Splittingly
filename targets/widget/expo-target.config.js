// @ts-nocheck
/**
 * Konfigurace WidgetKit extension pro `@bacons/apple-targets`.
 * Viz PLAN-pro-batch-2.md §1.2.
 *
 * `@bacons/apple-targets@5.0.0` je nainstalovaný a v `app.json` plugins.
 * Kořenový `/targets` adresář je „magický" — všechny soubory v `targets/widget`
 * se stanou součástí targetu (`index.swift` má `@main`).
 */
/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'SplittinglyWidget',
  frameworks: ['SwiftUI', 'WidgetKit'],
  // App Group sdílený s hlavní appkou — sem widget čte snapshot.
  // Musí sedět s IOS_APP_GROUP v src/widget/contract.ts a s app.json
  // ios.entitlements (plugin ho jinak zrcadlí sám z app.json).
  entitlements: {
    'com.apple.security.application-groups': ['group.com.balata.splittingly'],
  },
  // Bez síťových oprávnění — widget jen čte lokální UserDefaults.
};
