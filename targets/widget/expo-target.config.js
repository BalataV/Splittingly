// @ts-nocheck
/**
 * Konfigurace WidgetKit extension pro `@bacons/apple-targets`.
 * STUB — viz PLAN-pro-batch-2.md §1.2.
 *
 * `@bacons/apple-targets` zatím NENÍ nainstalovaný; tenhle soubor se načte,
 * až se do `app.json` přidá plugin `["@bacons/apple-targets", …]`.
 */
module.exports = {
  type: 'widget',
  name: 'SplittinglyWidget',
  // App Group sdílený s hlavní appkou — sem widget čte snapshot.
  // Musí sedět s IOS_APP_GROUP v src/widget/contract.ts.
  entitlements: {
    'com.apple.security.application-groups': ['group.com.balata.splittingly'],
  },
  // Bez síťových oprávnění — widget jen čte lokální UserDefaults.
};
