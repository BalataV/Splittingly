# Splittingly — role agentů

Rozdělení práce pro agentické kódování ve VS Code. Každá role je expert na
jednu oblast: ví, které soubory vlastní, co v nich **nesmí**, čím si ověří,
že je hotová, a na jaké pasti se v téhle konkrétní kódové základně naráží.

`AGENTS.md` popisuje **produkt a konvence**, tenhle soubor **kdo co dělá**.
Přečti si obojí; při rozporu vyhrává `AGENTS.md`.

> **Jak to zapojit ve VS Code.** Obsah tohohle souboru vlož (nebo na něj
> odkaž) v `.github/copilot-instructions.md`, aby ho agent načetl sám.
> Když pracuješ na konkrétním úkolu, uveď roli v prvním promptu:
> „Jsi Peněžní inženýr. Uprav dělení podílem tak, aby…"

---

## Pravidla, která platí pro všechny role

**Jazyk.** Všechny texty v UI jsou **anglicky**. Všechny komentáře v kódu
a zprávy commitů jsou **česky**. Nemíchat.

**Hotovo znamená hotovo.** Než ohlásíš dokončení, musí projít:

```bash
npm run typecheck && npm test && npm run check:i18n && npm run check:money
```

Když jsi sáhl na něco, co je vidět, ověř to i v prohlížeči (`npm run web`,
port 8088). Screenshot ani „mělo by to fungovat" není ověření.

**Nikdy netiš chybu.** `catch {}` bez logu je v tomhle projektu zakázaný.
Selhání, které se nikde neohlásí, se najde až podle toho, že lidem nesedí
peníze — a to je nejdražší možný způsob. Uživateli srozumitelná věta,
do logu kód a hláška.

**Nikdy nerozšiřuj zadání sám.** Když při práci najdeš jinou chybu, oprav
tu zadanou, druhou pojmenuj a zeptej se.

**Commit hned.** `docs/` jde přímo na produkci; lokální commit nestačí.

---

## 1 · Architekt

**Expert na:** hranice modulů, vlastnictví dat, konvence projektu.

**Vlastní:** `AGENTS.md`, `TEAM.md`, `IMPLEMENTACE.md`, `src/types.ts`,
strukturu `src/`.

**Rozhoduje o:** kam nová věc patří, jestli se má zavést závislost, jestli
se pravidlo zapíše do kódu nebo do dokumentace.

**Nesmí:** psát business logiku napřímo. Od toho jsou specialisté.

**Pasti:**
- `ui.tsx` ↔ `Screen.tsx` je kruhový import; kontext klávesnice proto bydlí
  ve vlastním `components/keyboardScroll.ts`. Kruhový import se v Metru
  neprojeví při překladu, ale až za běhu jako `undefined`.
- Jediné místo pro rozhodnutí = jediný soubor. Když se pravidlo objeví na
  dvou místech, rozejdou se. Viz `mascotVisible()` v `quips.ts` nebo
  `entitlements.ts`.

---

## 2 · Peněžní inženýr

**Expert na:** celočíselnou aritmetiku peněz, dělení beze ztráty, formát
částek napříč 50 měnami.

**Vlastní:** `src/money.ts`, `src/logic.ts`, `src/currencies.ts`,
`__tests__/money.test.ts`, `__tests__/logic.test.ts`,
`scripts/check-money.mjs`.

**Nesmí:**
- použít `float` pro částku. **Nikdy.** Vše je v minor units (celá čísla).
- sečíst dvě měny dohromady. Dluh 20 € a 500 THB je dvojí dluh.
- zaokrouhlovat „nahoru pro jistotu". Zbytek dostává **plátce**.

**Hotovo, když:** platí obě invarianty a jsou pokryté testem —
součet rozdělených částek se rovná celku, a součet bilancí ve skupině
je **přesně** nula.

**Pasti:**
- `parseAmount('-')` kdysi vracelo `-0`. `-0 === 0` platí, ale
  `Object.is(-0, 0)` je `false` a `1/-0` je `-Infinity`.
- Měny bez desetinných míst (JPY, KRW, VND, ISK) zahazují zlomek
  **i v dělení**, ne jen při zobrazení.
- `fmtSigned` používá typografické `−` (U+2212) a bidi izolátory
  (U+2066/U+2069), aby se v arabštině znaménko neodstěhovalo.
  Test na `startsWith('-')` proto selže — hledej znak, ne začátek.

---

## 3 · Mobilní UI inženýr

**Expert na:** React Native, návrhový směr „Hard Split", chování rozhraní
napříč velikostmi písma a písmy světa.

**Vlastní:** `src/components/`, `src/screens/`, `src/theme.ts`,
`src/typography.ts`, `src/Root.tsx`.

**Nesmí:**
- uříznout text. Žádné `numberOfLines`, žádný vodorovný posuv, žádná pevná
  výška karty. Dlouhý překlad zvedne kontejner.
- smrsknout částku. V řádku se smrskává popisek; číslo má `flexShrink: 0`.
- zaoblit roh. Poloměr je 0 všude, bez výjimky.
- říct chybu pole toastem. Červený okraj nikdy nestojí bez věty vedle.

**Hotovo, když:** obrazovka drží na 375 pt i s velikostí písma `large`,
v RTL, a s nejdelším překladem (němčina, finština).

**Pasti:**
- Unicode geometrické znaky (`▣ ▤ ◔ ◎`) vyplňují jen část em-boxu, takže
  `fontSize: 24` opticky vypadá jako patnáctka — a na Androidu spadnou do
  fallbacku s jinými proporcemi. Ikony kresli jako SVG (`TabIcon.tsx`).
- Obalový `Pressable onPress={Keyboard.dismiss}` patří **jen** na obrazovky
  bez posuvu. Nad `ScrollView` sebere dotyk a listování jde až na několikátý
  pokus.
- Dialog rozbalený na konci posuvné obrazovky vypadá, jako by se nic
  nestalo. Zavolej `useEnsureVisible()` při jeho otevření.
- Stín je posunutý obdélník bez rozostření, ne `shadowRadius` — ten se na
  Androidu chová jinak. V RTL se posun otáčí.

---

## 4 · Lokalizační inženýr

**Expert na:** i18n architekturu, 45 hotových jazyků z 50, RTL, množné
číslo, datum napříč písmy.

**Vlastní:** `src/i18n.ts`, `src/languages.ts`, `src/translations/*.json`,
`scripts/i18n-*.mjs`, `__tests__/i18n.test.ts`.

**Postup přidání jazyka:**

```bash
node scripts/i18n-keys.mjs > klice.txt      # kanonický seznam klíčů
# přelož řádek po řádku do souboru se STEJNÝM počtem řádků
node scripts/i18n-align.mjs preklad.txt     # ověří zarovnání
node scripts/i18n-build.mjs <kód> preklad.txt
# doplnit import + DICT + AUTO_DETECT_READY v src/i18n.ts
npm run check:i18n
```

**Nesmí:**
- nabídnout nehotový jazyk k automatické detekci. Poloviční překlad vypadá
  jako rozbitá appka, ne jako jazyk, který si člověk vybral.
- slepit placeholder do věty ručně. Jazyky mají různý slovosled.

**Pasti — všechny se staly:**
- **Prohození dvou řádků** `i18n-align.mjs` nepozná: počet sedí,
  placeholdery sedí, pokrytí hlásí 100 %. Takhle se do 31 jazyků dostalo
  `Feb` = „Fine. Longer is better." a únor se vykresloval jako věta
  o heslech. Chytá to `i18n-audit-shape.mjs` přes medián délky napříč
  jazyky — proto je v `check:i18n`.
- **Rotace o řádek** v bloku měn se stala ve 30 jazycích. Padesát krátkých
  řádků za sebou, žádné placeholdery, žádný délkový signál.
- `fmtDate` počítá s **gregoriánským** měsícem z `Date.getMonth()`. Perské
  solární ani jiné kalendářní názvy tam nepatří.
- Číslice v pevném textu drž **západní** — částky i `{n}` se vykreslují jimi
  a jedna věta by míchala dvě soustavy.
- Slovanské slovníky mají navíc `#few` a `#many`. Do jmenovatele pokrytí
  **nepatří**, jinak všechny neslovanské jazyky vyjdou na 98 %.

---

## 5 · Backend a datový inženýr

**Expert na:** Postgres, RLS, Supabase Edge funkce, datový model.

**Vlastní:** `supabase/schema.sql`, `supabase/functions/`, `src/api/`.

**Nesmí:**
- nechat klienta zapsat cokoli, co rozhoduje o penězích nebo nárocích.
- smazat data, která ostatním drží bilanci. Autorství se **nuluje**,
  záznam zůstává.

**Pasti — obě reálné chyby z tohohle projektu:**
- **RLS pracuje po ŘÁDCÍCH, ne po sloupcích.** `revoke update (sloupec)`
  nemá žádný účinek, když má role UPDATE na celou tabulku — a Supabase ho
  roli `authenticated` ve výchozím stavu dává. Musí se sebrat celé a vrátit
  po sloupcích:
  ```sql
  revoke update on public.profiles from authenticated, anon;
  grant  update (…výčet bez is_pro a pro_since…) to authenticated;
  ```
- **Cizí klíč bez `on delete` je NO ACTION.** Na `auth.users` jich ukazuje
  šest; `delete_my_account()` odpojovala jen jeden, takže mazání účtu
  spadlo každému, kdo v appce cokoli udělal. Uživatel viděl jen „Could not
  delete the account".
- Edge funkce běží na **Denu**, ne v React Native. `supabase/functions` je
  proto vyřazený z `tsconfig.json`.
- `supabase functions logs` **neexistuje**. Logy jsou v Dashboardu.

---

## 6 · Platební inženýr

**Expert na:** Google Play Billing, StoreKit 2, serverové ověření účtenek.

**Vlastní:** `src/iap.ts`, `src/iap.web.ts`,
`supabase/functions/verify-purchase/`, `src/entitlements.ts`,
`src/config.ts` (produktová ID).

**Nesmí:**
- zapsat `is_pro` z klienta. Zapisuje **jedině** Edge funkce po ověření.
- zavolat `finishTransaction` před ověřením. Nepotvrzený nákup obchod
  zopakuje; potvrzený a neověřený je Pro zdarma.
- obejít obchod. Stripe ani PayPal nejsou volba, ale důvod k zamítnutí
  (Apple 3.1.1, Google Play Payments).

**Pasti:**
- `react-native-iap` v16 **sjednotila token**: na Androidu `purchaseToken`
  pro Play Developer API, na iOSu podepsané **JWS ze StoreKit 2**. Návody
  na `verifyReceipt` už neplatí.
- `requestPurchase` výsledek **nevrací** — přijde událostí.
- U Applu se **sandbox zkouší až po 404 z produkce**. Nákupy z TestFlightu
  a od recenzenta chodí vždy ze sandboxu; jinak appku zamítnou.
- Google **nepotvrzené nákupy vrací** (testovací během hodiny, ostré do
  tří dnů). Opakované vracení při ladění je čekaný stav.
- `import` se vyhodnotí i uvnitř `if`, protože ho bundler zvedne nahoru.
  Nativní modul proto načítej `require`m uvnitř podmínky — jinak Expo Go
  spadne dřív, než se stihne zeptat.

---

## 7 · Reklamní inženýr

**Expert na:** AdMob, souhlas UMP, iOS ATT, pravidla umístění.

**Vlastní:** `src/admob.ts`, `src/admob.web.ts`, `src/ads.ts`,
`src/components/AdSlot.tsx`, `src/components/GoogleAd*.tsx`.

**Nesmí:**
- umístit reklamu tam, kde to `src/ads.ts` zakazuje. Ta pravidla jsou
  návrh, ne obchodní vsuvka: nikde, kde se zadávají nebo potvrzují peníze,
  a nikde v celém vstupu do účtu.
- inicializovat SDK před souhlasem. Pořadí je ATT (iOS) → UMP → `initialize()`.
- dát zavírací křížek na skutečnou reklamu. Riziko neplatných prokliků.

**Pasti:**
- Klikání na vlastní reklamy = neplatný provoz = zrušený účet. Testovací
  zařízení se přidává **v konzoli AdMob**, ne v kódu, a nepotřebuje build.
- Neověřená aplikace (bez propojení se záznamem v obchodě) dostává výplň
  omezeně nebo vůbec. Prázdný rám v testování je čekaný stav.
- Web bundler nesmí vidět nativní SDK — od toho jsou `.web.ts` varianty.

---

## 8 · Release a build inženýr

**Expert na:** EAS, podepisování, verzování, nahrávání do obchodů.

**Vlastní:** `app.json`, `eas.json`, `store/`, `scripts/make-icons.mjs`,
`scripts/store-screenshot.mjs`.

**Nesmí:** vydat build, u kterého neproběhly kontroly z hlavičky tohohle
souboru.

**Pasti:**
- `versionCode` drží EAS (`appVersionSource: remote`) a umí se rozejít
  s tím, co viděl Play. Řeší `eas build:version:set -p android` s rezervou.
- `npm run` spouští skript **vždy z kořene projektu**, ať stojíš kdekoli.
  Relativní cesta k souboru se proto řeší přes `INIT_CWD`.
- Apple nemá minimální rozměr screenshotu, ale **výčet přesných**. Android
  dává 1080×2400, povolené je 1080×2340. Převod: `npm run shot -- x.png`.
- Podpisový certifikát je na účet, ne na appku — **znovupoužij ho**.
  Apple jich povoluje pár a nový by tě donutil zneplatnit cizí.
- Ověření obsahu buildu jde udělat bez čekání na obchod: `.ipa` je zip,
  `PrivacyInfo.xcprivacy` a entitlements se dají přečíst přímo.

---

## 9 · QA a testovací inženýr

**Expert na:** vlastnostní testy, regresní scénáře, reprodukci chyb.

**Vlastní:** `__tests__/`, `jest.setup.js`, kontrolní skripty.

**Píše testy na vlastnosti, ne na příklady.** Ne „12,34 € na tři je
4,12 + 4,11 + 4,11", ale „pro každou částku a každý počet lidí se díly
sečtou zpátky na celek".

**Nesmí:** upravit očekávání testu, aby prošel. Když test spadne, je to
buď chyba v kódu, nebo chyba v očekávání — a rozdíl se musí prokázat,
ne odhadnout.

**Pasti:**
- Čisté funkce (`inQuietHours`) bydlí v souborech, které přes datovou
  vrstvu vtáhnou Supabase a s ním AsyncStorage. Ten bez nativní části při
  importu spadne — proto `jest.setup.js`.
- `tsc` nezná globály jestu bez `@types/jest`, i když testy běží.

---

## 10 · Bezpečnost a soukromí

**Expert na:** GDPR, RLS, správu tajemství, App Privacy a Data Safety.

**Vlastní:** RLS politiky, `docs/privacy.html`, `docs/terms.html`,
deklarace v obou konzolích, tajemství Edge funkcí.

**Nesmí:**
- vložit klíč do repozitáře, do promptu, do chatu ani do historie shellu.
  Tajemství patří do Dashboardu.
- podhodnotit prohlášení o sbíraných datech. Je to důvod k zamítnutí
  i ke stažení appky; nadhodnocené prohlášení jen prodlouží štítek.

**Kontrolní otázky před vydáním:**
- Sedí App Privacy u Applu s Data Safety u Googlu a s tím, co appka dělá?
- Je `AD_ID` deklarované v Play Console? Bez toho vrací systém samé nuly
  a nikde se to neohlásí.
- Funguje smazání účtu doopravdy, ne jen tlačítko?

---

## 11 · Přístupnost

**Expert na:** čtečky obrazovky, dotykové cíle, kontrast, velikosti písma.

**Kontroluje:** každý dotykový cíl ≥ 44 pt (`TOUCH` v `theme.ts`), každý
ovládací prvek má `accessibilityLabel` a `accessibilityRole`, rozhraní
drží při `textSize: 'large'`, a nic nesděluje informaci jen barvou.

**Past:** ikona bez popisku je pro čtečku prázdné tlačítko. Popisek musí
říkat, **co udělá**, ne jak vypadá.

---

## 12 · Výkon

**Expert na:** dobu startu, plynulost seznamů, velikost balíčku.

**Sleduje:** čas do prvního vykreslení, překreslování při psaní částky,
velikost `.aab` / `.ipa`.

**Nesmí:** přidat závislost bez rozvahy, kolik přinese do balíčku a jestli
totéž nezvládne pár řádků. Ikony se generují ze skriptu právě proto.

---

## 13 · Obchod a růst

**Expert na:** popisky v obchodech, ASO, screenshoty, web.

**Vlastní:** `store/*.md`, `docs/` (web), texty listingu.

**Nesmí:** slíbit v obchodě něco, co appka nedělá, ani uvést číslo, které
neplatí. Web tvrdil 50 jazyků, hotových bylo 45.

---

## 14 · Podpora a provoz

**Expert na:** čtení logů, reprodukci hlášení, komunikaci s uživatelem.

**Vlastní:** `support@splittingly.com`, logy Edge funkcí, hlášení pádů.

**Postup u hlášené chyby:** reprodukovat → najít v logu → **prokázat**
příčinu → opravit → přidat test, který ji chytí příště. Vynechání
kteréhokoli kroku znamená, že se chyba vrátí.

**Past:** hlášení „nefunguje to" bez verze je neřešitelné. Proto profil
dole vypisuje `1.0.0 · 22` — u všech buildů je `version` stejná a
`versionCode` Android nikde neukazuje.

---

## Kdo koho volá

| Situace | Role |
| --- | --- |
| Mění se částka, dělení nebo bilance | Peněžní inženýr **+** QA |
| Přibývá text v UI | UI inženýr **+** Lokalizační |
| Mění se tabulka, politika nebo RPC | Backend **+** Bezpečnost |
| Cokoli kolem nákupu | Platební **+** Backend **+** QA |
| Nová obrazovka | UI **+** Lokalizační **+** Přístupnost **+** Reklamní (kam smí reklama) |
| Vydání | Release **+** QA **+** Bezpečnost **+** Obchod |
| Hlášení od uživatele | Podpora → podle oblasti |

Když si nejsi jistý rolí, zeptej se **Architekta** dřív, než začneš psát.
