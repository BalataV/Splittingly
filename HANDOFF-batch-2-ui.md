# Batch 2 — co zbývá pro ui-a-lokalizace

> Větev `feat/pro-batch-2`. Wiring (store/types/entitlements), nativní vrstva
> (Nitro widget, deps, applock.ts, appicon.ts), stats math a LockGate jsou
> HOTOVÉ a commitnuté (`8f79999`, `0f5aa9e`). Gate zelený: typecheck, 110 testů,
> check:i18n, check:money.
>
> Ty stavíš už jen povrchy. **Volej `actions.*`, nesahej na `store.tsx`,
> `types.ts`, `stats.ts`, `categories.ts`, `modules/`, `src/widget/`,
> `src/applock.ts`, `src/appicon.ts`.**

## Signatury akcí (z `types.ts`, doslovně)

```
setAppLock:          (on: boolean) => Promise<void>
unlock:              () => Promise<void>          // volá LockGate, hotovo
setAppIcon:          (key: string) => Promise<void>   // '' = výchozí
addGroupCategory:    (name: string) => Promise<void>
renameGroupCategory: (id: string, name: string) => Promise<void>
deleteGroupCategory: (id: string) => Promise<void>
```

Stav pro čtení: `state.appLock`, `state.locked`, `state.appIcon` (`''`=výchozí),
`state.groupCategories[state.selectedGroup] ?? []` (typ `RawGroupCategory[]`).
Merge default+custom pro pickery: `mergedCategories(custom)` z `src/categories.ts`.
Gates: `canUseTrends`, `canUseCustomCategories`, `canUseFxLock`, `canUseAltIcon`
z `src/entitlements.ts`. App lock je ZDARMA (žádný gate).

## 1 · Trends obrazovka  (`ScreenName 'trends'`, BACK_MAP → `stats`, NENÍ v NO_CHROME)

- Gate `canUseTrends(state.isPro)` — bez Pro upsell (`navigate('remove_ads')`) jako export.
- Data: `state.expenses[state.selectedGroup]`. Měna = měna skupiny (`group.currency`),
  případně přepínač měn jako jinde ve Stats.
- Funkce (hotové v `src/stats.ts`):
  - `monthlyTotals(expenses, currency, monthsBack): { month: 'YYYY-MM', totalMinor }[]`
    — souvislá řada, poslední = aktuální měsíc. Vykresli jako svislé sloupce
    (jako `weeklyBars` ve Stats), Archivo Black na částce nad/pod sloupcem.
  - `trendSummary(expenses, currency): { thisMonthMinor, lastMonthMinor, pctChange | null }`
    — headline „this month vs last", `pctChange` zaokrouhli TADY (`Math.round`),
    null → „—" nebo „No comparison yet".
  - `categoryDrift(expenses, currency, monthsBack): { category, currentMinor, prevMinor, deltaMinor }[]`
    — seznam „co roste / co klesá", šipka ↑/↓ + `fmt(Math.abs(deltaMinor))`,
    název přes `category(key).name` (funguje i pro custom klíče).
- Okno měsíců (`monthsBack`) = lokální `useState`, přepínač 3 / 6 / 12.
- Vstup: řádek „Spending trends" na obrazovce **Stats** (`src/screens/Stats.tsx`),
  jen pokud je vybraná skupina.
- Root routing: `else if (sc === 'trends') screen = <Trends />;`

## 2 · GroupCategories obrazovka  (`ScreenName 'group_categories'`, BACK_MAP → `group`, NENÍ v NO_CHROME)

- Seznam `state.groupCategories[gid]` — název + tlačítko rename (dialog/`Field`)
  + smazat. Přidání: `Field` + `Button` nahoře, nebo FAB-styl řádek.
- Gate `canUseCustomCategories(state.isPro)` **jen na přidání** (rename/delete
  smí každý člen — RLS to tak pouští). Bez Pro tlačítko „Add" → upsell.
- Chyby akce hlásí store toastem (vč. „category already exists") — ty jen
  `await actions.addGroupCategory(name)` v try/catch a needěláš vlastní hlášku.
- **Add/rename řeš dialogem uvnitř téhle obrazovky, NE dalším ScreenName.**
- Vstup: řádek „Categories" v `src/screens/GroupDetail.tsx`, jen `{CLOUD_MODE && …}`.
- Root routing: `else if (sc === 'group_categories') screen = <GroupCategories />;`
- Kde se custom kategorie použijí: `AddExpense` kategorie-picker → předej
  `mergedCategories(state.groupCategories[gid] ?? [])` místo pevných `CATEGORIES`.

## 3 · Settings — sekce `Appearance`  (`src/screens/Settings.tsx`, komponenta `Appearance`)

- **App lock**: `Toggle` řádek „App lock" `value={state.appLock}` `onChange={(v) => actions.setAppLock(v)}`.
  Zobraz jen když `require('../applock').canAuthenticate()` → true (async — drž
  v `useState`, default false; v Expo Go je false, řádek se neukáže). Pod tím
  jedna věta „Ask for Face ID / fingerprint when the app opens.".
- **Alt ikona**: picker 4 dlaždic (výchozí + Mint/Neon/Dusk), `state.appIcon`
  značí vybranou. Klíče: `''`, `AppIcon-Mint`, `AppIcon-Neon`, `AppIcon-Dusk`.
  `onPress` → `actions.setAppIcon(key)` (store sám řeší Pro gate → upsell).
  Zobraz jen když `require('../appicon').supportsAltIcons()` → true.
  Věta: „iOS shows a system alert when the icon changes." (Apple to nevypne.)
  Dlaždice = 1024² PNG z `assets/alt-icons/` zmenšené, nebo barevný čtverec
  s accent barvou palety (jednodušší, bez načítání PNG).

## 4 · FX lock  (`src/screens/AddExpense.tsx` + `src/screens/ExpenseDetail.tsx`)

- **AddExpense**: `Toggle` „Lock exchange rate" pod polem měny. Zapnuto →
  `actions.setDraft({ fxCcy: <měna uživatele, state.me.currency nebo profil>,
  fxRate: <živý kurz z fx.ts: expense currency → uživatelova měna, TEĎ> })`.
  Vypnuto → `setDraft({ fxCcy: null, fxRate: null })`.
  Pod toggle, když je vyplněno: „1 {draft.currency} = {fxRate} {fxCcy}".
  Bez Pro (`!canUseFxLock`) toggle vede na upsell, nedá se zapnout.
  `fx.ts` má funkci na živý kurz — použij ji (`convert`/`rateFor`, mrkni do `fx.ts`).
- **ExpenseDetail**: kde se teď ukazuje živé „≈ ve tvé měně", když
  `expense.fxRate != null && myCurrency === expense.fxCcy`, ukaž místo toho
  zamčený přepočet: `fmt(Math.round(expense.amountMinor * expense.fxRate), expense.fxCcy)`
  s poznámkou „locked rate" / „rate at the time". Jinak beze změny (živé).

## 5 · i18n

Všechny nové stringy do **všech 44** `src/translations/*.json`, kanonická
pozice (za nejbližšího předchůdce dle `scripts/i18n-keys.mjs`), styl podle
sousedů. Počítané věty přes `plural()`. Nový klíč z LockGate už v kódu je:
`"Locked. Confirm your identity to continue."`, `"Unlock"` — doplň i ten.
Po dokončení `npm run check:i18n` musí být zelený (523 → cca 560+ klíčů,
všude stejně).

## 6 · Deep link `splittingly://overview` (widget klik) — NÍZKÁ priorita

Appka **nemá žádný handler příchozích URL** (jen OAuth callback v `auth.ts`).
To je pre-existující mezera (IMPLEMENTACE „hluboké odkazy" neodškrtnuté), ne
věc batch 2. Widget klik zatím prostě otevře appku tam, kde byla — přijatelné
pro v1. Kdyby se dělal router příchozích linků, je to samostatný úkol
(`Linking.getInitialURL` + `addEventListener` v `store.tsx` nebo `App.tsx`,
`Linking.parse`, mapování cesty → `navigate`). **Neřeš teď.**

## Brány před reportem
`npm run typecheck && npm test && npm run check:i18n && npm run check:money`
