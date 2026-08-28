// @ts-nocheck
/**
 * Expo config plugin — přidá do Android projektu App Widget „you owe /
 * you're owed".
 *
 * Co dělá při `expo prebuild`:
 *   1. zkopíruje nativní soubory z `android-widget/` do vygenerovaného
 *      `android/app/src/main/…`
 *   2. do `AndroidManifest.xml` vloží `<receiver>` widgetu
 *
 * DEFENZIVNÍ: když `android-widget/` chybí nebo je neúplný, plugin jen
 * vypíše varování a vrátí konfiguraci beze změny — nikdy nezhavaruje build
 * ani `expo config`. Scaffold fáze, viz PLAN-pro-batch-2.md §1.3.
 */
const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');

const RECEIVER_NAME = '.widget.SplittinglyWidgetProvider';
const SRC_DIR = 'android-widget';

function withWidgetSourceFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot; // android/
      const src = path.join(projectRoot, SRC_DIR);

      if (!fs.existsSync(src)) {
        console.warn(`[withAndroidWidget] ${SRC_DIR}/ chybí — přeskakuji kopii nativních souborů.`);
        return cfg;
      }

      const pkgPath = 'com/balata/splittingly/widget';
      const javaDest = path.join(platformRoot, 'app/src/main/java', pkgPath);
      const resDest = path.join(platformRoot, 'app/src/main/res');
      fs.mkdirSync(javaDest, { recursive: true });

      const kt = path.join(src, 'SplittinglyWidgetProvider.kt');
      if (fs.existsSync(kt)) {
        fs.copyFileSync(kt, path.join(javaDest, 'SplittinglyWidgetProvider.kt'));
      }

      const resSrc = path.join(src, 'res');
      if (fs.existsSync(resSrc)) {
        copyDir(resSrc, resDest);
      }

      return cfg;
    },
  ]);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function withWidgetReceiver(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.receiver = app.receiver || [];

    const already = app.receiver.some(
      (r) => r.$ && r.$['android:name'] === RECEIVER_NAME,
    );
    if (already) return cfg;

    app.receiver.push({
      $: { 'android:name': RECEIVER_NAME, 'android:exported': 'false' },
      'intent-filter': [
        { action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }] },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/splittingly_widget_info',
          },
        },
      ],
    });

    return cfg;
  });
}

module.exports = function withAndroidWidget(config) {
  config = withWidgetSourceFiles(config);
  config = withWidgetReceiver(config);
  return config;
};
