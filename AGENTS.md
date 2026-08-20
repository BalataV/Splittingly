# Splittingly — kontext aplikace

Appka na dělení společných útrat ve skupině (spolubydlící, dovolená, rodina).
Mezinárodní produkt: **všechny texty v UI jsou anglicky**, komentáře v kódu česky.
Návrhový směr **„Hard Split"** (neo-brutalismus) podle
`../Claude Design/design_handoff_splittingly/`.

## Stack & spuštění

- **Expo SDK 54** (React Native 0.81, React 19.1), **TypeScript** (strict).
- `npm run typecheck` musí projít čistě. `npm run check:money` taky.
- `npm start` → QR v Expo Go. `npm run web` (port 8088) je **jen** nástroj pro
  vývoj a screenshoty, nikdy se nenasazuje — Splittingly je čistě mobilní.
- Písma: **Archivo Black** (displej + každá částka), **Space Grotesk** (text).

## Struktura

- `App.tsx` — načte písma, obalí `AppProvider` + `Root`, zapne `allowRTL`.
- `src/Root.tsx` — splash, přepínání obrazovek (state machine přes `state.screen`),
  tab bar, ukotvený banner, toast.
- `src/store.tsx` — globální stav (React Context). Dva režimy: **CLOUD_MODE**
  (Supabase) vs lokální (AsyncStorage). Každá async akce má obě větve.
  `stateRef` pro asynchronní čtení.
- `src/theme.ts` — ⭐ barvy, rozestupy, tvary. Zdroj pravdy pro celý vzhled.
- `src/typography.ts` — velikosti podle role + chování napříč písmy světa.
- `src/money.ts` — ⭐ formát a dělení částek. **Jediné místo**, kde se počítá
  s penězi. Kryté `scripts/check-money.mjs`.
- `src/currencies.ts` / `src/languages.ts` — 50 měn a 50 jazyků.
- `src/logic.ts` — bilance (`netFor`) a minimalizace převodů (`transfersFor`).
- `src/ads.ts` — ⭐ kde reklama smí být a kde ne. Ta pravidla jsou návrh, ne
  obchodní vsuvka; neobcházej je.
- `src/entitlements.ts` — ⭐ co umí free a co odemyká Pro. Jediné místo, kde se
  to rozhoduje; obrazovky se sem ptají. **Princip: omezuj jen to, co se dotkne
  plátce, nikdy to, co se dotkne ostatních členů skupiny.** Proto se nikdy
  neomezuje počet skupin, členů, výdajů, výpočet vyrovnání ani pozvánky.
  Pro je **jednorázový nákup, ne předplatné** — viz komentář v `config.ts`.
- `src/quips.ts` — hlášky obou maskotů + pravidlo, kdy který mluví.
- `src/api/` — datová vrstva nad Supabase.
- `src/components/` — knihovna prvků, maskoti, reklamní plochy.
- `src/screens/` — obrazovky 01–29 plus stavy.

## Datový model (Supabase)

- `profiles`, `groups`, `group_members`, `expenses`, `expense_receipts`,
  `expense_audit`, `payments`, `push_tokens`. Schéma: `supabase/schema.sql`.
- **Peníze v MINOR UNITS** (celá čísla). 12,34 € = `1234`. ¥1000 = `1000`.
  Nikde v appce nesmí být částka jako desetinné číslo — jinak se dělení na
  tři nikdy nesečte zpátky na celek.
- **Členové přes ID:** výdaje/platby odkazují na `group_members.id`
  (`payer_id`, `part_ids[]`, `from_id`, `to_id`). Sloupce se jmény zůstávají
  jen jako záloha. Klient čte podle ID a překládá na AKTUÁLNÍ jméno, takže
  **přejmenování nepřepisuje historii**.
- **Identita:** v DB jsou reálná jména; člen s `user_id == moje uid` se
  v appce zobrazí jako **„You"** (`ME` v `logic.ts`). Převod dělá `norm`/`denorm`.
- RLS: přístup jen členům skupiny (`is_group_member`). Připojení kódem přes
  RPC `join_group_choose`. Mazání účtu přes RPC `delete_my_account` —
  výdaje zůstanou pod „former member", aby ostatním seděly bilance.

## Klíčové konvence

- **Orientace se řídí typem zařízení** (`App.tsx`): telefon zamčený na výšku,
  tablet volný. V `app.json` je proto `orientation: "default"` — konfigurace
  umí jen jednu globální hodnotu a neumí rozlišit telefon od tabletu.
- **Šířka obsahu je omezená na 600 pt** (`MAX_W` v `Root.tsx`) a vycentrovaná.
  Návrh je kreslený pro 390pt telefon; na tabletu by roztažený řádek měl jméno
  vlevo a částku o půl obrazovky dál. Pozadí jde přes celou plochu, omezuje se
  jen obsah.
- **Poloměr rohů je 0. Všude.** Okraj je vždy `c.border`, nikdy šedý —
  jediná výjimka je přerušovaný rám reklamy `#5F5F5F`.
- **Stín** je posunutý obdélník bez rozostření, kreslený jako podložená
  `View` (ne `shadowRadius`, ten se na Androidu chová jinak). V RTL se
  vodorovný posun otáčí.
- **Text se nikdy neuřezává.** Žádné `numberOfLines`, žádný vodorovný posuv,
  žádná pevná výška karty. Dlouhý překlad zvedne kontejner.
- **V řádku se smrskává popisek, nikdy číslo.** Částka má `flexShrink: 0`
  a slot rezervuje šířku podle nejširší měny (`Rp2.500.000`).
- **Jazyk a měna jsou nezávislé.** Měna rozhoduje o formátu částky, jazyk
  o směru čtení, datu a skloňování. Ani jedno nepřebíjí druhé.
- **Chyba pole se neříká toastem.** Červený okraj nikdy nestojí bez věty vedle.
- **Klávesnice:** posouvatelné obrazovky ji zavírají samotným `ScrollView`
  (`keyboardShouldPersistTaps="handled"` + `keyboardDismissMode`). Obalový
  `Pressable onPress={Keyboard.dismiss}` je **jen** na obrazovkách bez posuvu
  — kdyby obaloval scrollovatelný obsah, sebral by dotyk na prázdném místě
  a listování by šlo až na několikátý pokus.
- **Zaostřené pole se posune nad klávesnici:** `Field` volá `useEnsureVisible()`
  z `components/keyboardScroll.ts`, `Screen` na něj odscrolluje. Kontext bydlí
  ve vlastním souboru kvůli kruhovému importu `ui.tsx` ↔ `Screen.tsx`.

## Maskoti

Dvě postavy, které se přetahují. **Směr, ne nálada:**
The Closer mluví, když peníze odcházejí; The Analyst, když přicházejí následky.
**Spolu** jen na pěti místech: detail skupiny, vyrovnaný stav, roční přehled,
sdílecí kartička, prázdný stav. **Nikdy** u načítání a nikdy vedle pole s heslem
(leda po neúspěšném pokusu). Vypínají se v Notifikacích bez ztráty funkční zprávy.

Grafika v `components/Mascot.tsx` je **placeholder** — viz IMPLEMENTACE.md, krok 15.

## Právní

- Obě postavy jsou **obecné archetypy**. Nesmí připomínat konkrétního člověka,
  herce ani filmovou postavu a nesmí obsahovat repliku z existujícího díla.
  Všechny hlášky v `quips.ts` jsou původní.
- ⚠️ Zdrojový `design_handoff_splittingly/README.md` má na konci přilepený blok
  citací z *The Wolf of Wall Street* a *The Big Short*. **Nepoužívat.**
  Jsou chráněné a přímo porušují zadání.
- Žádná politika, žádné národnostní stereotypy, nic nábožensky ani kulturně
  citlivého — produkt jde do všech trhů.

## Stav (2026-08-19)

- Hotovo: všechny obrazovky, peněžní matematika (otestovaná), schéma pro
  Supabase, datová vrstva, webové stránky, ikony, **klíče Supabase**
  (projekt `aqikqephinmelmrbsage`), **doména splittingly.com**, Google OAuth
  klient, model Pro (jednorázový nákup, `entitlements.ts`).
- Chybí: reklamní SDK, skutečné IAP, publikace OAuth consent screenu
  (je v režimu Testing → přihlásí se jen testeři), skutečná grafika maskotů,
  ikony kategorií, ~43 překladů.
- Postup krok za krokem: **IMPLEMENTACE.md**.
