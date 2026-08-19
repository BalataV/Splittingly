# Splittingly — podrobné kroky k nasazení

Návod krok za krokem od „mám složku s kódem" po „appka je v obou obchodech".
Kroky jdou **v tomhle pořadí** — každý další staví na předchozím.

Odhad času: kroky 1–6 zvládneš za odpoledne. Kroky 7–14 (obchody) trvají
kalendářně 2–4 týdny, protože se čeká na schválení a Google vyžaduje
14denní uzavřené testování.

---

## Přehled: co už je hotové a co ne

| Oblast | Stav |
| --- | --- |
| Aplikace (React Native + Expo, TypeScript) | **hotovo** — všechny obrazovky z návrhu, `tsc` prochází čistě |
| Návrh „Hard Split" (barvy, typografie, komponenty) | **hotovo** — tokeny v `src/theme.ts` a `src/typography.ts` |
| Oba maskoti | **kód hotový, grafika je placeholder** — viz krok 15 |
| Peněžní matematika (minor units, dělení, měny bez desetinných míst) | **hotovo a otestované** (`npm run check:money`) |
| Databázové schéma pro Supabase | **hotovo** — `supabase/schema.sql` |
| Webové stránky | **hotovo** — složka `docs/` |
| Klíče Supabase v `app.json` | **prázdné — krok 3** |
| Doména splittingly.com | **nemáš — krok 2** |
| Reklamní SDK | **není — krok 12** (potřebuje vývojový build, ne Expo Go) |
| Nákup v aplikaci (Pro) | **není — krok 13** |
| Překlady mimo en/de/ru/fi/ar/th/ja/cs | **nejsou — krok 16** |

> **Bez klíčů Supabase appka běží v LOKÁLNÍM režimu** — data jen v telefonu,
> nic se nesdílí. Můžeš si ji tak hned proklikat. Nic se tím nerozbije.

---

## Krok 1 · Rozjeď appku lokálně (15 minut)

```bash
cd C:\Users\Vojta\Desktop\splittingly\SplittinglyApp
npm install
```

Kontrola, že je vše v pořádku:

```bash
npm run typecheck
```

Musí projít bez jediného výpisu. Pak kontrola peněžní matematiky:

```bash
npm run check:money
```

Musí napsat „Vše v pořádku (14 kontrol)." Tohle spouštěj **vždycky**, když
sáhneš na `src/money.ts` — je to jediné místo, kde chyba znamená, že
skupině zmizí peníze.

Spuštění na telefonu:

```bash
npm start
```

V telefonu si nainstaluj **Expo Go** a načti QR kód z terminálu.

> ⚠️ Expo Go neumí reklamy, nákupy v aplikaci ani Apple/Google přihlášení.
> Na to je potřeba vývojový build (krok 12).

---

## Krok 2 · Kup doménu splittingly.com

**Tohle udělej brzy**, protože na doméně visí tři věci najednou:
sdílecí odkazy, potvrzovací e-maily a hluboké odkazy do appky.

1. Zkontroluj dostupnost a kup na libovolném registrátoru
   (Cloudflare, Namecheap, u nás Wedos/Forpsi). Cena ~250–400 Kč/rok.
2. Kdyby byla `.com` zabraná, druhá volba je `splittingly.app`
   (má vynucené HTTPS, což App Links vyhovuje).
3. Až doménu máš, **projdi tyhle soubory a přepiš adresu**:

| Soubor | Co změnit |
| --- | --- |
| `src/config.ts` | `LANDING_BASE` |
| `app.json` | `ios.associatedDomains` a `android.intentFilters[0].data.host` |
| `docs/CNAME` | jediný řádek |
| `docs/app/index.html` | `LANDING` |
| `docs/index.html` | `og:url` |

### Proč to nejde odložit

Hluboké odkazy (**App Links** na Androidu, **Universal Links** na iOS)
vyžadují ověřovací soubor na **kořeni domény**:
`https://splittingly.com/.well-known/assetlinks.json`.

Na GitHub Pages v „project" repozitáři (`balatav.github.io/splittingly/`)
kořen domény patří jinému repozitáři, takže tam ověření **nikdy nezafunguje**.
Bez vlastní domény tedy pozvánka neotevře appku, jen web.

**Dočasné řešení, než doménu koupíš:** appka funguje, jen se pozvánky
otevírají v prohlížeči a uživatel kód opíše ručně. Není to blokující,
ale před vydáním do obchodů to chceš mít hotové.

---

## Krok 3 · Založ projekt v Supabase (30 minut)

1. Jdi na <https://supabase.com> → **Start your project** → přihlas se.
2. **New project**:
   - **Name:** `splittingly`
   - **Database Password:** vymysli silné a **ulož si ho**
   - **Region:** `Central EU (Frankfurt)`
3. Počkej ~2 minuty, než se projekt rozjede.

### 3a · Vytvoř tabulky

1. V levém menu: **SQL Editor** → **New query**.
2. Otevři `supabase/schema.sql`, **zkopíruj celý obsah** do editoru.
3. **Run**. Má napsat „Success".

> Kdyby to spadlo na řádku `alter publication supabase_realtime add table …`
> s hláškou, že tabulka už v publikaci je, ten blok přeskoč a zbytek pusť znovu.
> Nic jiného v souboru na tom nezávisí.

### 3b · Zkopíruj klíče do appky

1. **Project Settings** (ozubené kolo) → **API**.
2. Vezmi **Project URL** a **anon / publishable** klíč.
3. Vlož je do `app.json` → `extra`:

```json
"extra": {
  "supabaseUrl": "https://xxxxxxxx.supabase.co",
  "supabaseAnonKey": "sb_publishable_...",
```

> Anon klíč je **veřejný a bezpečný** dát do appky — data chrání pravidla RLS,
> která jsi právě nahrál v `schema.sql`. Servisní klíč (`service_role`)
> do appky **NIKDY** nepatří.

4. Stejné dvě hodnoty vlož i do `docs/app/index.html` (proměnné `SB_URL`, `SB_KEY`).

### 3c · Úložiště fotek

**Storage** → **New bucket** → název `receipts` → zaškrtni **Public bucket** → Save.
Pravidla pro nahrávání už nastavil `schema.sql`.

### 3d · Ověř, že to jede

Restartuj `npm start`, zaregistruj se e-mailem, založ skupinu, přidej výdaj.
V Supabase → **Table Editor** → `expenses` musí ten výdaj být vidět.

---

## Krok 4 · Přihlášení (e-mail, Google, Apple)

### 4a · E-mail

**Authentication → Providers → Email** je zapnutý ve výchozím stavu.

Pro rychlé testování dočasně vypni **Confirm email**
(*Authentication → Sign In / Up*), ať nemusíš potvrzovat každou registraci.
**Před vydáním zase zapni.**

### 4b · Adresy pro přesměrování

**Authentication → URL Configuration**:

- **Site URL:** `https://splittingly.com/app/`
- **Redirect URLs** (přidej všechny):
  - `https://splittingly.com/app/`
  - `splittingly://**`
  - `exp://**` (jen pro vývoj v Expo Go)

> Proč `/app/` a ne kořen: e-mailové odkazy (potvrzení registrace, obnova
> hesla) **musí zůstat v prohlížeči** — statická stránka `docs/app/index.html`
> je odbaví. Pozvánky mají vlastní cestu `/join/`, aby si je vzala appka.
> Kdyby obojí viselo na kořeni, appka by spolkla i odkazy na obnovu hesla.

### 4c · Google

1. **Google Cloud Console** → nový projekt → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID → Web application**.
3. Do **Authorized redirect URIs** dej adresu ze Supabase:
   `https://<tvůj-ref>.supabase.co/auth/v1/callback`
4. **Client ID** a **Client secret** vlož v Supabase do
   **Authentication → Providers → Google** → zapni → Save.

> V Expo Go je Google přihlášení nespolehlivé (přesměrování padá na localhost).
> Funguje až v sestavené appce se schématem `splittingly` — testuj to
> až po kroku 12.

### 4d · Apple

Povinné, pokud nabízíš Google (Apple to vyžaduje v App Store Review Guidelines 4.8).

1. V Apple Developer účtu založ **Service ID** a klíč **Sign in with Apple**.
2. Vlož do Supabase → **Authentication → Providers → Apple**.
3. V `app.json` už je `"usesAppleSignIn": true`.

### 4e · Vlastní e-maily

**Authentication → Email Templates**. Výchozí šablony jsou anglicky a bez
značky. Přepiš aspoň *Confirm signup* a *Reset password* — nech v nich
odkaz `{{ .ConfirmationURL }}`, ten Supabase dosadí.

Pro vlastní SMTP (aby e-maily nechodily z adresy Supabase):
**Project Settings → Authentication → SMTP Settings**.

---

## Krok 5 · Zveřejni web na GitHub Pages

Landing page je hotová ve složce `docs/`.

### 5a · Doplň chybějící údaje

V `docs/privacy.html` a `docs/terms.html` jsou hranaté závorky:
`[FULL LEGAL NAME]`, `[REGISTERED ADDRESS]`, `[COMPANY ID]`, `[COUNTRY]`.
**Bez nich obchody zásady odmítnou.**

### 5b · Nahraj na GitHub

```bash
cd C:\Users\Vojta\Desktop\splittingly\SplittinglyApp
git init
git add -A
git commit -m "Splittingly — app, schema, landing page"
git branch -M main
git remote add origin https://github.com/balatav/splittingly.git
git push -u origin main
```

(Repozitář si předtím založ na GitHubu jako **Public** — Pages na zdarma
účtu jinde nefungují.)

### 5c · Zapni Pages

Repozitář → **Settings** → **Pages** → Source: „Deploy from a branch",
Branch: `main`, složka **`/docs`** → Save.

### 5d · Nasměruj doménu

U registrátora nastav DNS:

| Typ | Jméno | Hodnota |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `balatav.github.io` |

Pak v **Settings → Pages → Custom domain** zadej `splittingly.com`
a zaškrtni **Enforce HTTPS** (objeví se do ~hodiny).

### 5e · Ověř

- <https://splittingly.com/>
- <https://splittingly.com/privacy.html>
- <https://splittingly.com/?g=TEST12> → musí ukázat kartu pozvánky
- <https://splittingly.com/.well-known/assetlinks.json> → musí vrátit JSON

---

## Krok 6 · Účet Expo a první build

```bash
npm install -g eas-cli
eas login
eas build:configure
```

To doplní do `app.json` → `extra.eas.projectId`. Doplň také `updates.url`
(EAS ho vypíše, tvar `https://u.expo.dev/<projectId>`).

Testovací APK pro Android:

```bash
eas build -p android --profile preview
```

Při prvním buildu se zeptá na **keystore** → nech ho **vygenerovat automaticky**.
Build běží v cloudu 10–20 minut, pak dostaneš odkaz na `.apk`.

---

## Krok 7 · Dokonči hluboké odkazy

### Android

1. Zjisti otisk podpisového klíče:
   ```bash
   eas credentials -p android
   ```
   Potřebuješ **SHA-256** z *upload keystore* a později i z
   *Play App Signing* (Play Console → Setup → App integrity).
2. Oba otisky vlož do `docs/.well-known/assetlinks.json` místo
   `PASTE_..._HERE`, commitni a pushni.
3. Ověření: <https://developers.google.com/digital-asset-links/tools/generator>

### iOS

1. V `docs/.well-known/apple-app-site-association` nahraď `TEAMID`
   svým **Apple Team ID** (najdeš v developer.apple.com → Membership).
   Výsledek má tvar `5N974388GT.com.balata.splittingly`.
2. V Apple Developer → Identifiers → tvůj App ID → zapni **Associated Domains**.
3. Soubor **nesmí** mít příponu `.json` a servíruje se jako `application/json`
   — GitHub Pages to zvládne samo.

Test: pošli si odkaz `https://splittingly.com/join/?g=ABC123` do chatu
a klepni na něj v telefonu s nainstalovanou appkou. Musí se otevřít appka.
(V Expo Go to nefunguje — jen v sestaveném buildu.)

---

## Krok 8 · Účty v obchodech

| | Apple | Google |
| --- | --- | --- |
| Cena | 99 USD / rok | 25 USD jednorázově |
| Schválení účtu | ~1–2 dny | ~1–2 dny |
| Kde | developer.apple.com | play.google.com/console |

Google navíc u nových osobních účtů vyžaduje **uzavřené testování s 12 testery
po dobu 14 dní** předtím, než pustí produkční vydání. Naplánuj to dopředu —
je to nejdelší kalendářní položka celého procesu.

---

## Krok 9 · Materiály do obchodů

Potřebuješ (rozměry jsou závazné):

- **Ikona:** 1024×1024 (už máš — `assets/icon.png`)
- **Screenshoty iOS:** 6,7" (1290×2796) a 6,5" (1242×2688), min. 3 kusy
- **Screenshoty Android:** min. 2, poměr 16:9 nebo 9:16
- **Feature graphic (jen Google):** 1024×500
- **Popis:** krátký (80 znaků) + dlouhý (4000 znaků)
- **Odkaz na zásady ochrany údajů:** `https://splittingly.com/privacy.html`
- **Odkaz na smazání účtu:** `https://splittingly.com/delete-account.html`
  (Google to vyžaduje zvlášť)

Screenshoty nejrychleji nastřílíš z webového náhledu:

```bash
npm run web
```

Otevři v prohlížeči, zapni režim mobilu (F12 → ikona telefonu), nastav
rozlišení a udělej snímek. **Web je jen nástroj pro vývoj a screenshoty,
nikdy se nenasazuje** — appka je čistě mobilní.

---

## Krok 10 · Dotazníky o soukromí

Obojí vyplň podle toho, co appka opravdu dělá:

**Google Play → Data safety:**
- Sbíráš: e-mail, jméno, fotky (účtenky), „app activity" (výdaje)
- Data jsou **šifrovaná při přenosu**: ano
- Uživatel může požádat o smazání: ano (odkaz z kroku 9)
- Data se **neprodávají**

**App Store → App Privacy:**
- *Contact Info → Email, Name* — vázáno na identitu, účel: funkčnost appky
- *User Content → Photos* — účet, funkčnost
- *Identifiers* — jen pokud zapneš reklamu (krok 12)
- **Tracking:** dokud nezapneš personalizovanou reklamu, odpověď je **ne**

---

## Krok 11 · Produkční build a odeslání

```bash
eas build -p android --profile production
eas build -p ios --profile production
```

Odeslání do obchodů:

```bash
eas submit -p android --profile production
eas submit -p ios --profile production
```

Pro Android potřebuješ **service account JSON** z Google Cloud
(Play Console → Setup → API access) a uložit ho jako
`google-play-service-account.json` (je v `.gitignore`, do repozitáře nepatří).

Pro iOS doplň v `eas.json` → `submit.production.ios`:
`ascAppId` (z App Store Connect) a `appleTeamId`.

---

## Krok 12 · Reklama (až po prvním buildu)

Reklamní SDK **neběží v Expo Go**. Až budeš mít vývojový build:

```bash
npx expo install react-native-google-mobile-ads
eas build -p android --profile development
```

1. Založ účet na <https://admob.google.com>, vytvoř appku pro Android i iOS.
2. ID appek vlož do `app.json` → `extra.admobAndroidAppId` / `admobIosAppId`
   a přidej plugin `react-native-google-mobile-ads` podle jeho dokumentace.
3. V `src/components/AdSlot.tsx` nahraď vnitřek rámů skutečným `<BannerAd/>`.
   **Rámy a rozměry nech být** — přerušovaný šedý rám je sdělení, ne dekorace.

### Pravidla, která už jsou v kódu (`src/ads.ts`) — neobcházej je

- **Nikde, kde se zadávají nebo potvrzují peníze**: nový výdaj, dělení,
  účtenka, vyrovnání, všechny úspěšné stavy a celý vstup do účtu (01–07).
- Banner 320×50 jen na Přehledu, Aktivitě a Statistikách, ukotvený nad tab barem.
- Obdélník 300×250 jen na úplném konci Statistik, nikdy mezi datovými bloky.
- Nativní řádek jen v Aktivitě, každý dvanáctý, **bez avataru a bez částky**.
- Celoobrazovková jednou za spuštění a jen po sdílení kartičky.
- Odměněné video jen na výslovné vyžádání uživatele.

---

## Krok 13 · Nákup v aplikaci (Splittingly Pro)

1. V App Store Connect i Play Console vytvoř **jednorázový produkt**
   s ID `splittingly_pro` (viz `src/config.ts` → `PRO_PRODUCT_ID`), cena ~1,99 $.
2. Doinstaluj knihovnu (RevenueCat je nejjednodušší cesta pro obě platformy):
   ```bash
   npx expo install react-native-purchases
   ```
3. Ve `src/store.tsx` v akci `buyPro` nahraď dnešní zápis do profilu
   skutečným nákupem. Zápis `is_pro = true` do `profiles` nech — je to
   zdroj pravdy napříč zařízeními.
4. `restorePro` napoj na obnovu nákupů (Apple to vyžaduje).

---

## Krok 14 · Před samotným vydáním

- [ ] V Supabase **zapni Confirm email**
- [ ] Vyplněné údaje v `privacy.html` a `terms.html`, prošlé právníkem
- [ ] Fungující e-mail `support@splittingly.com`
- [ ] Vyzkoušené hluboké odkazy na skutečném zařízení (iOS i Android)
- [ ] Vyzkoušená obnova hesla z e-mailu
- [ ] Vyzkoušené smazání účtu (a ověřeno, že skupině zůstaly správné bilance)
- [ ] Vyzkoušený tmavý i světlý režim a všechny tři velikosti písma
- [ ] Vyzkoušená arabština (zrcadlení) a němčina (dlouhé popisky)
- [ ] `npm run typecheck` a `npm run check:money` procházejí

---

## Krok 15 · Maskoti — skutečná grafika

`src/components/Mascot.tsx` obsahuje **placeholder**: silueta, barvy a
charakter sedí, ale není to hotová ilustrace. Handoff to říká výslovně.

Co objednat u ilustrátora — každá postava ve třech velikostech
(~32 px bysta, ~72 px celá postava, velká pro onboarding a oslavu):

**THE CLOSER** — nagelované vlasy, dobré sako v modré `#1F49FF`, povolená
červená kravata `#FF2D16`, sluneční brýle vyhrnuté do čela, věčný úsměv,
velká gesta.

**THE ANALYST** — rozčepýřené vlasy, vytahané šedé tričko, sluchátka na krku,
kruhy pod očima, v ruce výpis se stoupající červenou křivkou.

**Právní mantinel do zadání pro ilustrátora — napiš mu ho doslova:**
obě postavy jsou obecné archetypy („nadšenec do utrácení" a „skeptik nad
čísly"). **Nesmí připomínat konkrétního člověka, herce ani filmovou postavu.**
Žádná politika, žádné národnostní stereotypy, nic nábožensky ani kulturně
citlivého — postavy jedou do všech trhů.

> ⚠️ **Pozor na zdrojový soubor.** V `design_handoff_splittingly/README.md`
> je za sekcí „Open items" přilepený blok ~50 citací z filmů *The Wolf of
> Wall Street* a *The Big Short*. Ty jsou **chráněné autorským právem** a
> jejich použití by přímo porušilo tvůj vlastní zadávací požadavek. V kódu
> nejsou a nesmí se tam dostat — všechny hlášky v `src/quips.ts` jsou původní.
> Doporučuju ten blok ze souboru smazat, ať ho někdo omylem nepoužije.

Vedle maskotů je otevřená ještě **ikonová sada kategorií** — emoji
v `src/categories.ts` jsou placeholder. Cílový styl: tah 3 px, nulový
poloměr, stejná geometrie jako zbytek rozhraní.

---

## Krok 16 · Zbývajících ~43 jazyků

`src/i18n.ts` má hotovou angličtinu (klíče) a sedm jazyků, na kterých se
ověřuje layout: **de** (+42 % délky), **ru** (+58 %), **fi** (+64 %),
**ar** (RTL), **th** (vysoké značky), **ja** (CJK), **cs**.

Přidání dalšího jazyka:

1. Zkopíruj slovník `DE` a přelož hodnoty (klíč = anglická věta, nesahat).
2. Přidej do mapy `DICT` na konci souboru.
3. Jazyk už je v `src/languages.ts`; když ne, doplň ho i tam.

**Na co si dát pozor při překladu:**
- Placeholdery `{amount}`, `{who}`, `{n}` musí zůstat — jazyky mají různý slovosled.
- Nikdy nelep věty ze dvou kusů; přelož celou větu.
- Verzálkové popisky nech krátké, ale **neškrtej v nich kvůli místu** —
  layout roste do výšky, nezkracuje se.

---

## Kde co je

```
SplittinglyApp/
├── App.tsx                  načtení písem, poskytovatelé
├── app.json                 ⚠️ klíče Supabase, doména, ID balíčků
├── eas.json                 profily buildů
├── src/
│   ├── Root.tsx             splash, přepínání obrazovek, tab bar, banner
│   ├── store.tsx            globální stav, cloud i lokální režim
│   ├── theme.ts             ⭐ barvy, rozestupy, tvary — zdroj pravdy
│   ├── typography.ts        velikosti a chování písma napříč písmy světa
│   ├── money.ts             ⭐ formát a dělení částek (tady se nechybuje)
│   ├── currencies.ts        50 měn: desetinná místa, oddělovače, symbol
│   ├── languages.ts         50 jazyků: endonym, RTL, písmo
│   ├── i18n.ts              překlady
│   ├── logic.ts             bilance a minimalizace převodů
│   ├── ads.ts               ⭐ kde reklama smí a kde NE
│   ├── quips.ts             hlášky obou maskotů
│   ├── api/                 datová vrstva nad Supabase
│   ├── components/          knihovna prvků + maskoti + reklamní plochy
│   └── screens/             všechny obrazovky z návrhu
├── supabase/schema.sql      ⚠️ nahrát do Supabase (krok 3)
├── docs/                    webové stránky (GitHub Pages)
└── scripts/
    ├── check-money.mjs      kontrola peněžní matematiky
    └── make-icons.mjs       generování ikon z geometrie loga
```

---

## Nejčastější zádrhely

**„Appka se spustí, ale skupiny se nesdílí."**
Klíče v `app.json` → `extra` jsou prázdné, takže běží lokální režim.
Doplň je a restartuj `npm start` (metro cache: `npm start -- --clear`).

**„Registrace projde, ale nepřijde e-mail."**
Supabase má na vlastní SMTP limit ~3 e-maily za hodinu. Pro testování
vypni *Confirm email*, pro produkci nastav vlastní SMTP (krok 4e).

**„Odkaz z pozvánky otevře web, ne appku."**
Buď nemáš doménu (krok 2), nebo chybí otisky v `assetlinks.json` (krok 7),
nebo testuješ v Expo Go — tam to nefunguje z principu.

**„Řádek se rozjel, když jsem přepnul na němčinu."**
Někde přibylo `numberOfLines` nebo pevná výška. V tomhle návrhu se text
**nikdy neuřezává** — kontejner roste. Podívej se do `src/components/ui.tsx`,
jak to dělají hotové komponenty.

**„Po dělení na tři chybí cent."**
Nemělo by — `splitEqual` posílá zbytek plátci. Spusť `npm run check:money`.
Pokud selže, je chyba v `src/money.ts` a **nikde jinde ji neopravuj**.
