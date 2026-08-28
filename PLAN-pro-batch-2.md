# Pro batch 2 — plán: home-screen widget + alternativní ikony

> Větev `feat/pro-batch-2`. Nic z tohohle není na `main`.
> Autor: vydani-a-provoz. Stav: **plán + scaffold**, čeká na rozhodnutí
> (architekt: závislosti a umístění `src/widget/`; backend-a-platby: gate
> v `entitlements.ts`) a na asset/portal kroky uživatele.

---

## 1 · Home-screen widget „you owe / you're owed"

### 1.1 Co widget ukazuje

- **systemSmall / 2×1**: jedno číslo — dominantní čistá bilance (`net.headlineMinor`
  ve `net.headlineCurrency`), zelená když jsi plusu, červená když mínusu.
- **systemMedium / 4×2**: dva řádky `YOU ARE OWED` / `YOU OWE` (předformátované
  řetězce, klidně víc měn oddělených `·`), počet skupin, čas poslední změny.
- Prázdný stav: „No groups yet". Odhlášený stav: „Open Splittingly" —
  **nikdy neukazuj zůstatek po odhlášení** (soukromí).
- Klik → deep link `splittingly://overview`.
- Vzhled „Hard Split": kost/inkoust, Archivo Black na částce, nulový poloměr,
  žádný přerušovaný rám (ten je vyhrazený reklamě). Barvy natvrdo v nativním
  kódu s komentářem odkazujícím na `src/theme.ts`.

### 1.2 iOS — WidgetKit extension

- **Config plugin:** `@bacons/apple-targets` (Evan Bacon, aktivně udržovaný,
  přímo pro WidgetKit v Expo prebuild). Vytvoří Xcode target z
  `targets/widget/expo-target.config.js` + Swift zdrojů, napojí App Group
  entitlement na appku i na target, vygeneruje Info.plist extension
  (`NSExtensionPointIdentifier = com.apple.widgetkit-extension`).
- **App Group:** `group.com.balata.splittingly`.
  → **KROK UŽIVATELE:** založit v Apple Developer portálu (Identifiers →
  App Groups), přidat do capabilities App ID `com.balata.splittingly`,
  obnovit provisioning profil (`eas credentials` nebo automat při dalším buildu).
  Bez toho EAS build spadne při uploadu.
- **Čtení dat:** `UserDefaults(suiteName: "group.com.balata.splittingly")`,
  klíč `widgetSnapshot` (JSON string) → `JSONDecoder` → render.
- **Timeline:** refresh policy `.never`. Widget se překreslí jen když appka
  zavolá `WidgetCenter.shared.reloadAllTimelines()`. Widget nikdy nesahá na
  síť ani na Supabase.
- Scaffold: `targets/widget/{expo-target.config.js, index.swift,
  SplittinglyWidget.swift}`.

### 1.3 Android — App Widget

- **Config plugin:** lokální `plugins/withAndroidWidget.js`:
  - `withAndroidManifest` → přidá `<receiver
    android:name=".widget.SplittinglyWidgetProvider" android:exported="false">`
    s `APPWIDGET_UPDATE` filtrem a `<meta-data ... @xml/splittingly_widget_info>`.
  - `withDangerousMod` → zkopíruje Kotlin + res soubory z `android-widget/`
    do `android/app/src/main/java/com/balata/splittingly/widget/` a `.../res/`.
- **Nativní soubory** (scaffold v `android-widget/`, plugin je kopíruje):
  - `SplittinglyWidgetProvider.kt` — `AppWidgetProvider`, `onUpdate` čte
    `context.getSharedPreferences("splittingly_widget", MODE_PRIVATE)`,
    klíč `widgetSnapshot`, plní `RemoteViews`.
  - `res/xml/splittingly_widget_info.xml` — `appwidget-provider`
    (`updatePeriodMillis=0`, `resizeMode`, 2×1 a 4×2 rozměry, `previewImage`).
  - `res/layout/splittingly_widget.xml` — `LinearLayout` + `TextView`, bez rohů.
  - `res/drawable/splittingly_widget_bg.xml` — plný obdélník.
- **Čtení:** `SharedPreferences("splittingly_widget")`, klíč `widgetSnapshot`.
  Appka po zápisu pošle `AppWidgetManager` broadcast, aby se překreslil.
- **Klik:** `PendingIntent` → `MainActivity`, `data = splittingly://overview`.

### 1.4 Datový kontrakt — KLÍČOVÉ

**Appka je vícemměnová.** `totalOwe` / `totalOwed` v `src/logic.ts` vrací
`MoneyMap = Record<měna, minorUnits>` a Overview je skládá přes
`fmtMoneyMap()` (víc měn oddělených `·`). Návrh `{ oweMinor, owedMinor,
currency }` **realitu nepopíše** — jednomměnový model spadne u kohokoli,
kdo má skupinu v EUR i v JPY.

**Formátování zůstává v `src/money.ts`** (AGENTS.md ⭐ „jediné místo, kde se
počítá s penězi"). Nativní Swift/Kotlin **nesmí** reimplementovat formát 50
měn — to se zaručeně rozejde. Proto JS zapisuje **předformátované řetězce**
a nativní strana jen renderuje.

```jsonc
// klíč: "widgetSnapshot"  ·  hodnota: JSON.stringify(snapshot)
{
  "schema": 1,
  "state": "ok",                 // "ok" | "empty" | "signedOut"
  "owe":  { "display": "€12.30  ·  ¥1,000", "byCurrency": { "EUR": 1230, "JPY": 1000 } },
  "owed": { "display": "€40.00",            "byCurrency": { "EUR": 4000 } },
  "net":  { "display": "+€27.70", "headlineCurrency": "EUR", "headlineMinor": 2770 },
  "groupCount": 3,
  "updatedAt": "2026-08-27T21:04:00.000Z"
}
```

- `display` = přesně to, co ukazuje Overview (`fmtMoneyMap`).
- `byCurrency` (syrové minor units) je pro accessibility popisky, budoucí
  nativní logiku, testy a ladění. Render ho nikdy neparsuje.
- `net.headlineMinor` + `headlineCurrency` = jedna dominantní bilance
  (měna s největším `|net|`), aby `systemSmall` obarvil jedno číslo bez
  parsování `display`.
- `state: "signedOut"` → widget zahodí čísla, ukáže „Open Splittingly".
- Jeden klíč `widgetSnapshot`, jedna hodnota. Triviální nativní čtení.
- Názvy úložišť centrálně v `src/widget/contract.ts`:
  iOS App Group `group.com.balata.splittingly`,
  Android SharedPreferences soubor `splittingly_widget`.

### 1.5 Čím JS zapisuje do sdíleného úložiště

Tři možnosti, v pořadí preference:

1. **Vlastní malý nativní modul přes `react-native-nitro-modules`**
   (už je přímá závislost — táhne ji `react-native-iap@16` a je v
   `package.json`). Jeden `.nitro.ts` spec
   `SplittinglyWidget { setSnapshot(json): void; reload(): void }`,
   ~30 řádků Swift + ~30 Kotlin. **Žádná nová závislost**, New-Arch nativní,
   sedí na TEAM.md §12 („nepřidávej závislost, když to zvládne pár řádků").
   **DOPORUČENO** — ale nový nativní modul je hranice → **sign-off architekt**.
2. **`react-native-shared-group-preferences`** — komunitní, dělá přesně
   iOS App Group + Android SharedPreferences jedním API. Riziko: poslední
   vydání staré, autolinking na RN 0.81 / New Arch neověřený. Chce spike.
3. **Rozdělené balíky:** `expo-apple-targets` má helper `ExtensionStorage`
   pro App Group na iOS; k tomu 15řádkový Android-only lokální modul.

**Scaffold teď:** `src/widget/index.ts` vystavuje `writeWidgetSnapshot()` a
`reloadWidgets()` jako **no-op stuby** (guardované jako `admob.ts` —
bezpečné v Expo Go i na webu), s `TODO(architekt)` u volby bridge.
`index.web.ts` = čisté no-op. ui-a-lokalizace tak může fasádu volat, aniž
bridge existuje.

### 1.6 Dopad

- **Velikost balíčku:** iOS extension pár desítek KB Swiftu; Android widget
  pár KB. Zanedbatelné. Bez nových JS závislostí (Nitro cesta).
- **App Store review:** nový target = nový binárník v bundlu → Apple
  reviewuje i widget. Nutné: App Group v provisioning profilu (jinak reject
  při uploadu), widget nesmí spadnout bez dat (stub stavy to řeší).
  Widget screenshot nepovinný, doporučený.
- **Play review:** `<receiver>` je `exported="false"` — žádné nové
  oprávnění, žádná změna Data safety (widget čte jen lokální
  SharedPreferences, které appka sama zapsala). AD_ID se netýká.
- **Build config:** `app.json` dostane `@bacons/apple-targets` + lokální
  plugin (viz diff v §3). `eas.json` beze změny, ale **první build po tomhle
  chce obnovit credentials** kvůli App Group entitlementu.
- **`main` build:** nedotčený — vše na větvi.

### 1.7 Co chybí / čeká na uživatele

- App Group `group.com.balata.splittingly` v Apple portálu + capabilities +
  obnova credentials.
- Rozhodnutí bridge (Nitro lokální modul vs komunitní balík) — **architekt**.
- `src/widget/` jako nové místo v `src/` — **architekt** (hranice).
- Widget preview obrázky (Android `previewImage`) — design asset, teď placeholder.
- Gate `canUseWidget(isPro)` v `src/entitlements.ts` — **backend-a-platby**
  (soubor je jejich). Nebo rozhodnout, že widget je zdarma.
- **ui-a-lokalizace** (batch 2): volat `writeWidgetSnapshot()` z místa, kde
  se přepočítávají bilance ve `store.tsx`; obsloužit route `splittingly://overview`;
  přeložit ~5 řetězců widgetu.

---

## 2 · Alternativní ikony aplikace (Pro)

### 2.1 Varianty

Napojené na existující systém barev (`THEMES` v `src/theme.ts`) —
**4 ikony celkem** = výchozí + 3 alternativy:

| Klíč | Motiv | Accent |
| --- | --- | --- |
| *(výchozí)* | Acid — žlutá/modrá/inkoust | `#FFE500` |
| `AppIcon-Mint` | Mint | `#00E5C0` |
| `AppIcon-Neon` | Neon na `#2B0A5E` | `#FF4FD8` |
| `AppIcon-Dusk` | Dusk na `#4A2E8A` (Pro téma — hezká vazba) | `#C8A0FF` |

Všechny kreslené ze **stejné geometrie** jako `scripts/make-icons.mjs`
(TEAM.md §12: ikony se generují, nekreslí ručně). Nový
`scripts/make-alt-icons.mjs` přidá `PALETTES` a smyčku, výstup do
`assets/alt-icons/<klíč>.png` 1024².

### 2.2 iOS

- **`expo-alternate-app-icons`** config plugin (existuje, udržovaný, řeší
  `CFBundleAlternateIcons` + kopii souborů + build phase). V `app.json`
  seznam `{ name, ios: "./assets/alt-icons/mint.png" }`.
- Přepnutí za běhu: `Application.setAlternateIconName()` — `expo-application`
  to nevystavuje, jde přes companion API pluginu / RN bridge. **ui-a-lokalizace**
  napojí volání ze Settings, gate `canUseAltIcon(isPro)` v `entitlements.ts`.
- iOS při změně ikony ukáže systémový alert — nedá se vypnout (Apple API).

### 2.3 Android

- Android nemá skutečné API na runtime změnu ikony. Standardní trik:
  **`activity-alias`** v manifestu, jeden na ikonu, všechny `enabled="false"`
  kromě výchozí; přepnutí = `PackageManager.setComponentEnabledSetting()`.
  Cena: ikona na chvíli zmizí/se objeví, některé launchery zahodí zástupce
  z plochy. **Ostrou hranu zdokumentovat v UI.**
- `expo-alternate-app-icons` v novějších verzích Android aliasy **umí** —
  ověřit; pokud ano, jeden plugin pokryje obě platformy. Pokud ne, lokální
  `plugins/withAndroidAltIcons.js`.

### 2.4 Dopad

- **Velikost balíčku:** 3 ikony navíc. iOS 1024² PNG ~desítky KB každá;
  Android celá sada hustot ~podobně. Dohromady snad +300–600 KB.
  Znatelné, pro Pro featuru přijatelné — **nahlásit Výkonu (§12)**.
- **Review:** alternativní ikony obě obchody povolují, dokud je každá
  skutečná varianta ikony (ne zavádějící, neimituje cizí appku). Naše jsou
  čisté barevné varianty — v pořádku. Metadata se nemění.
- **`app.json`:** dostane blok `expo-alternate-app-icons` (viz §3).

### 2.5 Co chybí / čeká

- Alt-ikony jsou **design assety, které jako bespoke grafiku nemáme** — ale
  protože ikona je procedurální, skript je vygeneruje z palet. Když je design
  bude chtít doladit ručně, přepíše vygenerované soubory.
  **Placeholder = generováno, přijatelné.**
- Počet a názvy variant potvrdit s **Obchod a růst** + design (navrhuji 3).
- `expo-alternate-app-icons` je **nová závislost** → **architekt**
  (§12: tenký plugin, žádná runtime váha nad rámec ikon).
- Gate `canUseAltIcon(isPro)` v `entitlements.ts` — **backend-a-platby**.
- **ui-a-lokalizace**: řádek v Settings + volání `setAlternateIconName` +
  napojení gate + překlad textu alertu.

---

## 3 · Navrhované změny `app.json` (diff)

Lokální plugin `./plugins/withAndroidWidget` je na větvi **aplikovaný**
(soubor existuje, plugin je defenzivní no-op, když chybí zdroje).
Entry pro **nenainstalované npm balíky** níž jsou **jen návrh** — přidat
až po `npm install` daného balíku, jinak `expo config` hodí chybu.

```jsonc
"plugins": [
  // ... stávající ...

  // --- widget: Android (lokální, aplikováno na větvi) ---
  "./plugins/withAndroidWidget",

  // --- widget: iOS (PO `npm i @bacons/apple-targets`) ---
  ["@bacons/apple-targets", { "appleTeamId": "5N974388GT" }],

  // --- alternativní ikony (PO `npm i expo-alternate-app-icons`) ---
  ["expo-alternate-app-icons", {
    "icons": {
      "AppIcon-Mint": { "ios": "./assets/alt-icons/mint.png", "android": "./assets/alt-icons/mint.png" },
      "AppIcon-Neon": { "ios": "./assets/alt-icons/neon.png", "android": "./assets/alt-icons/neon.png" },
      "AppIcon-Dusk": { "ios": "./assets/alt-icons/dusk.png", "android": "./assets/alt-icons/dusk.png" }
    }
  }]
]
```

Dále (po založení App Group) do `ios`:

```jsonc
"ios": {
  "entitlements": {
    "com.apple.security.application-groups": ["group.com.balata.splittingly"]
  }
}
```
(`@bacons/apple-targets` to obvykle přidá samo z `expo-target.config.js`;
uvedeno pro jistotu.)

---

## 4 · Co je nascaffoldováno na větvi

| Soubor | Co to je | Stav |
| --- | --- | --- |
| `src/widget/contract.ts` | TS typy snapshotu + názvy úložišť + `buildWidgetSnapshot()` čistý helper | hotové, typechecká |
| `src/widget/index.ts` | fasáda `writeWidgetSnapshot` / `reloadWidgets`, stuby guardované jako `admob.ts` | hotové, no-op |
| `src/widget/index.web.ts` | web no-op | hotové |
| `plugins/withAndroidWidget.js` | Expo config plugin: manifest receiver + kopie nativních souborů | hotové, defenzivní |
| `android-widget/SplittinglyWidgetProvider.kt` | `AppWidgetProvider` stub, čte SharedPreferences | stub |
| `android-widget/res/xml/splittingly_widget_info.xml` | `appwidget-provider` meta | stub |
| `android-widget/res/layout/splittingly_widget.xml` | layout | stub |
| `android-widget/res/drawable/splittingly_widget_bg.xml` | pozadí | stub |
| `targets/widget/expo-target.config.js` | konfigurace `@bacons/apple-targets` | stub |
| `targets/widget/index.swift` | `@main` widget bundle | stub |
| `targets/widget/SplittinglyWidget.swift` | WidgetKit view + TimelineProvider, čte App Group | stub |
| `scripts/make-alt-icons.mjs` | generátor 3 alt ikon z palet | hotové, spustitelné |
| `assets/alt-icons/*.png` | vygenerované placeholder ikony | placeholder |

**Nedotčeno (cizí vlastnictví):** `src/entitlements.ts` (backend-a-platby),
`src/store.tsx` a obrazovky (ui-a-lokalizace), `app.json` iOS/npm-plugin
entries (jen diff výše).

**Brány:** `npm run typecheck` čistý. `npm test` beze změny. Nativní část
`tsc` neřeší (Swift/Kotlin/`.js` plugin s `@ts-nocheck`).
