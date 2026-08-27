// Datový kontrakt mezi JS a home-screen widgetem (iOS WidgetKit / Android
// App Widget). JEDINÉ místo, kde je definovaný tvar snapshotu i názvy
// sdílených úložišť — nativní strana (Swift, Kotlin) musí držet přesně tyhle
// klíče.
//
// PROČ PŘEDFORMÁTOVANÉ ŘETĚZCE: appka je vícemměnová (`totalOwe`/`totalOwed`
// v `logic.ts` vrací mapu podle měny). Formát částky bydlí v `src/money.ts`
// (viz AGENTS.md — „jediné místo, kde se počítá s penězi"). Kdyby si widget
// formátoval sám ve Swiftu a Kotlinu, 50 měn se zaručeně rozejde. Proto JS
// posílá hotový `display` řetězec a nativní strana ho jen vykreslí. Syrové
// `byCurrency` je k dispozici pro accessibility popisky, testy a ladění —
// render ho neparsuje.

/** iOS App Group. Musí sedět s `expo-target.config.js` a entitlementem appky. */
export const IOS_APP_GROUP = 'group.com.balata.splittingly';

/** Android SharedPreferences soubor. Musí sedět se `SplittinglyWidgetProvider.kt`. */
export const ANDROID_PREFS_NAME = 'splittingly_widget';

/** Klíč pod kterým leží `JSON.stringify(WidgetSnapshot)` v obou úložištích. */
export const SNAPSHOT_KEY = 'widgetSnapshot';

/** Deep link, na který widget míří po kliknutí. */
export const WIDGET_DEEP_LINK = 'splittingly://overview';

/** Verze tvaru. Zvedni, když se změní pole — nativní strana podle ní pozná starý zápis. */
export const WIDGET_SCHEMA = 1 as const;

export type WidgetState = 'ok' | 'empty' | 'signedOut';

export interface MoneySide {
  /** Hotový text pro vykreslení, přesně jak ho ukazuje Overview (`fmtMoneyMap`). */
  display: string;
  /** Syrové minor units podle měny. Jen pro popisky/testy, ne pro render. */
  byCurrency: Record<string, number>;
}

export interface WidgetNet {
  /** Hotový text dominantní čisté bilance, se znaménkem. */
  display: string;
  /** Měna s největší absolutní bilancí — aby `systemSmall` obarvil jedno číslo. */
  headlineCurrency: string;
  /** Minor units té bilance. Kladné = jsi plusu, záporné = dlužíš. */
  headlineMinor: number;
}

export interface WidgetSnapshot {
  schema: typeof WIDGET_SCHEMA;
  state: WidgetState;
  owe: MoneySide;
  owed: MoneySide;
  net: WidgetNet;
  groupCount: number;
  /** ISO 8601, UTC. */
  updatedAt: string;
}

/** Prázdný snapshot pro stav bez skupin. */
export function emptySnapshot(state: WidgetState = 'empty'): WidgetSnapshot {
  return {
    schema: WIDGET_SCHEMA,
    state,
    owe: { display: '', byCurrency: {} },
    owed: { display: '', byCurrency: {} },
    net: { display: '', headlineCurrency: '', headlineMinor: 0 },
    groupCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Poskládá snapshot z už spočítaných map a hotových řetězců.
 *
 * Volající (ui-a-lokalizace, batch 2) dodá `oweMap` / `owedMap` z
 * `totalOwe` / `totalOwed` a `fmt` = `fmtMoneyMap` z `money.ts`, plus
 * `fmtSigned` pro jednu částku se znaménkem. Tenhle helper nezná `money.ts`
 * napřímo, aby `src/widget/` nezáviselo na měnové vrstvě kvůli importnímu cyklu.
 */
export function buildWidgetSnapshot(input: {
  oweMap: Record<string, number>;
  owedMap: Record<string, number>;
  groupCount: number;
  fmtMap: (m: Record<string, number>) => string;
  fmtSigned: (minor: number, currency: string) => string;
  signedOut?: boolean;
}): WidgetSnapshot {
  if (input.signedOut) return emptySnapshot('signedOut');
  if (input.groupCount === 0) return emptySnapshot('empty');

  const net: Record<string, number> = {};
  for (const cur of Object.keys(input.owedMap)) net[cur] = (net[cur] || 0) + input.owedMap[cur];
  for (const cur of Object.keys(input.oweMap)) net[cur] = (net[cur] || 0) - input.oweMap[cur];

  // Dominantní měna = největší absolutní čistá bilance.
  let headlineCurrency = '';
  let headlineMinor = 0;
  for (const cur of Object.keys(net)) {
    if (Math.abs(net[cur]) > Math.abs(headlineMinor)) {
      headlineMinor = net[cur];
      headlineCurrency = cur;
    }
  }

  return {
    schema: WIDGET_SCHEMA,
    state: 'ok',
    owe: { display: input.fmtMap(input.oweMap), byCurrency: { ...input.oweMap } },
    owed: { display: input.fmtMap(input.owedMap), byCurrency: { ...input.owedMap } },
    net: {
      display: headlineCurrency ? input.fmtSigned(headlineMinor, headlineCurrency) : '',
      headlineCurrency,
      headlineMinor,
    },
    groupCount: input.groupCount,
    updatedAt: new Date().toISOString(),
  };
}
