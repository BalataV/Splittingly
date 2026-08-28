# splittingly-widget (Nitro modul)

Most JS → sdílené úložiště, ze kterého čte home-screen widget.

- **Spec:** `src/SplittinglyWidget.nitro.ts` — `setSnapshot(json)`, `reload()`.
- **iOS:** `ios/HybridSplittinglyWidget.swift` → App Group
  `UserDefaults(suiteName: "group.com.balata.splittingly")`, klíč `widgetSnapshot`
  + `WidgetCenter.reloadAllTimelines()`.
- **Android:** `android/.../HybridSplittinglyWidget.kt` →
  `SharedPreferences("splittingly_widget")` + broadcast
  `ACTION_APPWIDGET_UPDATE`.
- **JS:** `index.ts` → `getSplittinglyWidget()` vrací instanci nebo `null`
  (Expo Go / web / neregistrováno). `src/widget/index.ts` v appce to volá.

## Codegen — MUSÍ proběhnout před nativním buildem

```bash
npx nitrogen modules/splittingly-widget
```

Vygeneruje `nitrogen/generated/{ios,android,shared}/…` včetně
`NitroSplittinglyWidget+autolinking.{rb,gradle}`, na které se odkazuje
`NitroSplittinglyWidget.podspec` a `android/build.gradle`. Do CI / prebuild
kroku je potřeba tenhle příkaz zařadit (např. `expo prebuild` hook nebo
`postinstall`). `nitrogen@0.36.5` je v devDependencies, verze drží spolu
s `react-native-nitro-modules@0.36.5`.

## Discovery

`expo-module.config.json` (`apple.podspecPaths`, `android.path`) — Expo
autolinking modul najde jako lokální v `modules/`. **NEověřeno nativním
buildem** — viz PLAN-pro-batch-2.md, otevřené body.

## App Group (iOS) — krok uživatele

`group.com.balata.splittingly` musí být v Apple Developer portálu
(Identifiers → App Groups) a přidaná do capabilities App ID
`com.balata.splittingly`. Bez toho `UserDefaults(suiteName:)` vrací `nil`.
