// @ts-nocheck
/**
 * Expo config plugin — spustí `nitrogen` codegen pro modules/splittingly-widget
 * jako součást `expo prebuild`.
 *
 * Proč: `eas-build-post-install` npm script hook (viz package.json) se na EAS
 * Build pro iOS spolehlivě nespouští — build 322e37ac (2026-09-01) prošel
 * fázemi Install dependencies → Prebuild → Install pods bez jediné zmínky
 * o hooku, takže `nitrogen/generated/ios/…` chybělo a `pod install` spadl na
 * `cannot load such file`. Prebuild fáze naproti tomu proběhne pokaždé a pro
 * obě platformy, takže je to spolehlivější místo pro codegen.
 *
 * `nitrogen` je idempotentní a běží ~0.5s, spuštění navíc (lokálně přes
 * `npm run nitrogen`, nebo kdyby `eas-build-post-install` přece jen proběhl)
 * nevadí.
 */
const { execSync } = require('child_process');
const { withDangerousMod } = require('@expo/config-plugins');

const MODULE_DIR = 'modules/splittingly-widget';

function runNitrogen(projectRoot) {
  execSync('npx --yes nitrogen', {
    cwd: require('path').join(projectRoot, MODULE_DIR),
    stdio: 'inherit',
  });
}

module.exports = function withNitrogenCodegen(config) {
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      runNitrogen(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);
  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      runNitrogen(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);
  return config;
};
