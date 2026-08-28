# Batch 2 — co zbývá pro ui-a-lokalizace

> Větev `feat/pro-batch-2`. **Skoro všechno je hotové a commitnuté.** Gate
> zelený: typecheck, 110 testů, check:i18n, check:money.

## HOTOVO (nesahat, jen případně vylepšit vzhled)

| Kus | Soubor | Pozn. |
|---|---|---|
| Wiring (store/types/entitlements) | `store.tsx`, `types.ts`, `categories.ts` | architekt |
| Nitro widget modul + deps + app.json | `modules/`, `app.json`, `package.json` | vydani-a-provoz |
| `applock.ts` / `appicon.ts` nativní napojení | — | expo-local-authentication / expo-alternate-app-icons |
| `stats.ts` trends math + byCategory data-driven | `stats.ts` | penize-qa, +19 testů |
| **LockGate** | `components/LockGate.tsx` + `Root.tsx` | plná náhrada obrazovky |
| **Trends obrazovka** | `screens/Trends.tsx` + routing + řádek ve Stats | sloupce/headline/biggest changes |
| **GroupCategories obrazovka** | `screens/GroupCategories.tsx` + routing + tlačítko v GroupDetail | add/rename/delete přes lokální Field |
| **Settings — APP ICON picker** | `screens/Settings.tsx` `Appearance` | jen když `supportsAltIcons()` |
| **Settings — APP LOCK toggle** | `screens/Settings.tsx` `Appearance` | jen když `canAuthenticate()`, ZDARMA |
| **AddExpense — FX lock toggle** | `screens/AddExpense.tsx` | + category picker přes `mergedCategories()` |
| **ExpenseDetail — locked rate** | `screens/ExpenseDetail.tsx` | přebíjí `ApproxMoney` když měna sedí |

## ZBÝVÁ

### 1 · Překlad ~39 nových i18n klíčů do 44 jazyků

`check:i18n` je zelený (klíče fungují přes anglický fallback), ale pokrytí
kleslo na 93 % (523/562). Klíče, které přibyly v kódu a čekají na překlad —
projdi `git log -p feat/pro-batch-2` nebo grep nové `t('…')` v:
`components/LockGate.tsx`, `screens/Trends.tsx`, `screens/GroupCategories.tsx`,
`screens/Settings.tsx` (APP ICON / SECURITY sekce), `screens/AddExpense.tsx`
(FX lock), `screens/ExpenseDetail.tsx`.

Nadpisy (`CATEGORIES`, `TRENDS`, `THIS MONTH`, `BIGGEST CHANGES`, `APP ICON`,
`SECURITY`) musí zůstat VERZÁLKAMI i v překladu (`i18n-audit-case` to hlídá).
Počítané věty (`{n} months`, `↑ {n}% vs last month`) přes `plural()` vč.
slovanských `#few`/`#many`.

### 2 · Vzhledová revize (volitelná)

Obrazovky jsem stavěl podle vzoru `Recurring.tsx` / `Stats.tsx`, ale bez
možnosti to spustit. Projdi Trends (sloupce, spacing) a GroupCategories
(řádky, rename inline) očima na buildu / webu, jestli to sedí do „Hard Split".

### 3 · Deep link `splittingly://overview` — NEŘEŠIT

Appka nemá handler příchozích URL (pre-existující mezera). Widget klik
zatím jen otevře appku. Samostatný úkol, ne batch 2.

## Brány
`npm run typecheck && npm test && npm run check:i18n && npm run check:money`
