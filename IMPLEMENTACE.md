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
| Klíče Supabase v `app.json` | **hotovo** — projekt `aqikqephinmelmrbsage`, ověřeno že RLS drží |
| Doména splittingly.com | **koupená** — zbývá nasměrovat DNS (krok 5d) |
| Reklamní SDK | **není — krok 12** (potřebuje vývojový build, ne Expo Go) |
| Nákup v aplikaci (Pro) | **není — krok 13** |
| Překlady mimo en/de/ru/fi/ar/th/ja/cs | **nejsou — krok 16** |

> **Bez klíčů Supabase appka běží v LOKÁLNÍM režimu** — data jen v telefonu,
> nic se nesdílí. Můžeš si ji tak hned proklikat. Nic se tím nerozbije.

---

---

## Stav k 19. 8. 2026 (ověřeno, ne odhadnuto)

Odškrtnuté položky jsem ověřil zvenčí — dotazem na živý web, na Supabase API
nebo spuštěním kontrol. Neodškrtnuté buď ověřit nejdou, nebo selhaly.

### ✅ Hotovo a ověřeno

- [x] **Krok 1** — appka běží, `npm run typecheck` i `npm run check:money` procházejí
- [x] **Krok 2** — doména `splittingly.com` koupená, DNS míří na GitHub Pages
      (ověřeno přes Google i Cloudflare resolver, všechny čtyři A záznamy)
- [x] **Krok 3a** — schéma nahrané: všech 8 tabulek odpovídá, RLS drží
      (nepřihlášený dotaz vrací prázdno), všech 5 RPC funguje
      (`group_preview`, `join_group_by_code`, `join_group_choose`,
      `group_push_tokens`, `delete_my_account`)
- [x] **Krok 3b** — klíče v `app.json` i v `docs/app/index.html`
- [x] **Krok 3c** — bucket `receipts` existuje
- [x] **Krok 4b** — Site URL a všechny tři Redirect URLs nastavené
- [x] **Krok 4c** — Google provider v Supabase **zapnutý** (ověřeno)
- [x] **Krok 4e** — vlastní SMTP (Zoner) zapnuté; šablony připravené
      v `supabase/email-templates/`
- [x] **Krok 7 (iOS část)** — Apple Team ID `5N974388GT` v
      `apple-app-site-association` i v `eas.json`, nasazeno živě
- [x] **Krok 8** — oba účty zaplacené z Dotačníčku. Google Play má
      **production access** (Dotačníček je v produkci), takže
      **14denní uzavřené testování s 12 testery odpadá** — je to požadavek
      na účet, ne na aplikaci
- [x] **Krok 5a** — právní údaje doplněné (Vojtěch Balata + adresa, rozhodné právo ČR)
- [x] **Krok 5b–5e** — repo `BalataV/Splittingly`, Pages servíruje `/docs`,
      doména běží přes HTTPS, HTTP se přesměrovává na HTTPS.
      Všech 10 stránek vrací 200 včetně obou `.well-known` souborů
- [x] **Krok 13 (rozhodnutí)** — model Pro: jednorázový nákup, `src/entitlements.ts`

### ⚠️ Nalezené problémy — vyřeš dřív než cokoli dalšího

- [ ] **E-mail provider je v Supabase VYPNUTÝ.** Registrace vrací
      `email_provider_disabled`. Nikdo se momentálně nepřihlásí ani nezaregistruje.
      → *Authentication → Providers → **Email** → zapnout.*
      Pozor, tohle je jiný přepínač než „Confirm email" (ten je správně zapnutý).
- [ ] **E-mailové šablony ještě nejsou vložené.** Výchozí šablona neobsahuje
      `{{ .Token }}`, takže obrazovka 07 (šest políček na kód) nemá co zobrazit.
      → Zkopíruj `supabase/email-templates/confirm-signup.html` a
      `reset-password.html` do *Authentication → Templates*. Podrobně
      v `supabase/email-templates/README.md`.

### ⬜ Zbývá (v tomhle pořadí)

- [ ] **Krok 4d** — Apple Sign In (povinné, když nabízíš Google)
- [x] **Krok 6** — hotovo. EAS projekt `@balatav/splittingly`
      (`5815c77b-07f5-4745-840d-6eaac97db942`), `updates.url` doplněno,
      keystore vygenerovaný v cloudu, **první production build hotový**
      (1.0.0, versionCode 2, `.aab`)
- [ ] **Krok 7 (Android část)** — otisky SHA-256 do
      `docs/.well-known/assetlinks.json`; teď tam stojí `PASTE_…_HERE`,
      takže App Links neověří.
      **Kde je vzít:** po nahrání `.aab` v Play Console →
      *Test and release → Setup → App integrity*. Jsou tam oba —
      *App signing key certificate* i *Upload key certificate*.
      (`eas credentials -p android` je taky umí, ale chce interaktivní
      terminál a lokálně nainstalovaný `keytool`.)
- [ ] **Krok 9–11** — materiály do obchodů, dotazníky, produkční build
- [ ] **Krok 12** — reklamní SDK (až po vývojovém buildu)
- [ ] **Krok 13** — produkt `splittingly_pro` v obou obchodech + napojení IAP
- [ ] **Krok 15** — skutečná grafika maskotů, ikonová sada kategorií
- [ ] **Krok 16** — zbývajících ~43 překladů

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

### 3b · Zkopíruj klíče do appky — ✅ HOTOVO

Doplněno: projekt `aqikqephinmelmrbsage`, publishable klíč v `app.json`
i v `docs/app/index.html`. Ověřeno, že REST odpovídá a **RLS drží**
(nepřihlášený dotaz vrací prázdno).

<details><summary>Postup, kdyby se klíče měnily</summary>

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

</details>

> 🔐 **Secret klíče nikam nedávej.** `service_role` JWT ani `sb_secret_…`
> nepatří do appky, na web, do gitu ani do chatu — obcházejí RLS a kdo je má,
> vidí data všech skupin. Když se někde objeví, rotuj je v Supabase.

### 3c · Úložiště fotek

**Storage** → **New bucket** → název `receipts` → zaškrtni **Public bucket** → Save.
Pravidla pro nahrávání už nastavil `schema.sql`.

### 3d · Ověř, že to jede

Restartuj `npm start`, zaregistruj se e-mailem, založ skupinu, přidej výdaj.
V Supabase → **Table Editor** → `expenses` musí ten výdaj být vidět.

---

## Krok 4 · Přihlášení (e-mail, Google, Apple)

> **Přes `gcloud` / Cloud Shell to nejde.** Nastavení Supabase Auth žije
> v Supabase, ne v Google Cloudu. A OAuth client typu **Web application**
> nelze z CLI vytvořit vůbec — `gcloud alpha iap oauth-clients` je výhradně
> pro Identity-Aware Proxy a vyrábí jiný druh klienta, který Supabase nevezme.
> Obojí je klikací. Přes Cloud Shell má smysl jen založit projekt (viz 4c).

### 4a · E-mail

**Authentication → Providers → Email** je zapnutý — ověřeno.

**Confirm email je právě teď ZAPNUTÉ** (`mailer_autoconfirm: false`), takže
každou testovací registraci musíš potvrdit z e-mailu. Než bude web na
doméně živý, ten odkaz nemá kam vést — pro testování ho dočasně vypni:
*Authentication → Sign In / Up → Email → Confirm email* → **off**.
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

> ⚠️ **Založ NOVÝ projekt, nepoužívej `babisovnik`.** OAuth consent screen je
> per-projekt a jeho název se ukazuje uživatelům v přihlašovacím okně —
> lidem přihlašujícím se do Splittingly by vyskočilo „babisovnik".
>
> Tenhle jeden krok z Cloud Shellu udělat můžeš:
> ```bash
> gcloud projects create splittingly-app --name="Splittingly"
> ```

1. **Google Cloud Console** → přepni na projekt **Splittingly** → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID → Web application**.
3. Do **Authorized redirect URIs** dej přesně tuhle adresu:
   `https://aqikqephinmelmrbsage.supabase.co/auth/v1/callback`
4. **Client ID** a **Client secret** vlož v Supabase do
   **Authentication → Providers → Google** → zapni → Save.

> V Expo Go je Google přihlášení nespolehlivé (přesměrování padá na localhost).
> Funguje až v sestavené appce se schématem `splittingly` — testuj to
> až po kroku 12.

### 4d · Apple

Povinné, pokud nabízíš Google (App Store Review Guidelines 4.8).

> **Service ID ani klíč `.p8` NEPOTŘEBUJEŠ.** Appka používá *nativní* Sign in
> with Apple (`expo-apple-authentication` → `signInWithIdToken`), ne webový
> OAuth flow. Nativní cesta ověřuje identity token přímo proti bundle ID,
> takže odpadá celý blok Service ID → Return URLs → generování JWT secretu.
> Service ID by bylo potřeba jen pro přihlášení Applem **na webu**, a ten
> Splittingly nemá.

1. **Apple Developer → Certificates, Identifiers & Profiles → Identifiers**
   → otevři App ID `com.balata.splittingly` → zaškrtni **Sign In with Apple**
   → Save.
2. **Supabase → Authentication → Providers → Apple** → zapni a do
   **Client IDs** vlož `com.balata.splittingly` (bundle ID, nic jiného).
   Pole *Secret Key (for OAuth)* nech **prázdné**.
3. V `app.json` už je `"usesAppleSignIn": true`.
4. Otestovat jde až na skutečném iPhonu ve vývojovém buildu — v Expo Go
   ani v simulátoru Apple přihlášení nefunguje.

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

**Přidej všechny čtyři A záznamy** se jménem `@` — GitHub je používá pro
rozložení zátěže a fungují jako záloha jeden druhého. TTL 3600 je v pořádku.

Volitelně i IPv6 (AAAA, jméno `@`), ať se appka načte i na sítích bez IPv4:
`2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`

Pak v **Settings → Pages → Custom domain** zadej `splittingly.com`.

> **„Enforce HTTPS — Unavailable"** není chyba, jen pořadí. GitHub si nechá
> vystavit certifikát od Let's Encrypt teprve ve chvíli, kdy DNS **skutečně
> míří** na jeho servery. Dokud se A záznamy nepropíšou, checkbox je šedý.
> Trvá to od pár minut do ~24 hodin. Až zmodrá, zaškrtni ho.
>
> Průběh si ověříš z terminálu:
> ```bash
> nslookup splittingly.com
> ```
> Musí vrátit ty čtyři adresy `185.199.10x.153`.

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

> ⚠️ **Na iOS musíš přidat ATT prompt, jinak porušuješ licenční smlouvu.**
> §3.3.3(E) Apple Developer Program License Agreement: kdo používá Advertising
> Identifier, **musí** před zobrazením reklamy zkontrolovat *Tracking
> Preference* uživatele a respektovat ji. AdMob ho používá.
> ```bash
> npx expo install expo-tracking-transparency
> ```
> Prompt vyvolej **před** inicializací AdMob. Když uživatel odmítne (nebo
> nechá `personalisedAds` vypnuté, což je náš výchozí stav), předej AdMobu
> `requestNonPersonalizedAdsOnly: true`.
>
> ⚠️ **Privacy manifest.** §3.3.3(B) vyžaduje, aby appka v metadatech uvedla
> důvod použití u vyjmenovaných API, a aby každé běžně používané SDK třetí
> strany bylo **podepsané dodavatelem** a neslo požadovaná metadata. Expo SDK 54
> to pro vlastní moduly řeší; u `react-native-google-mobile-ads` ověř, že máš
> verzi s `PrivacyInfo.xcprivacy`. Bez toho App Store build odmítne.

> ⚠️ **A PŘEPNI DEKLARACI INZERTNÍHO ID V PLAY CONSOLE.**
> *Zásady → Obsah aplikace → Inzertní ID* → z **Ne** na **Ano**.
>
> Tohle je past, která se projeví tiše: bez přepnutí ti systém při čtení
> inzertního ID vrátí **samé nuly** místo identifikátoru. Reklamy poběží,
> ale bez správného ID — hůř placené, bez měření, a **nikde nevyskočí chyba**.
> Zjistíš to jen z toho, že příjem nedává smysl.
>
> Oprávnění `com.google.android.gms.permission.AD_ID` se do manifestu přidá
> samo (má ho AdMob SDK a Gradle ho sloučí); ruční je jen ta deklarace.

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

**Rozhodnuto: jednorázový nákup, ne předplatné.** Důvod je v komentáři
u `PRO_PRODUCT_ID` v `src/config.ts` — než to změníš, přečti si ho.

Co Pro odemyká, je na jediném místě: **`src/entitlements.ts`**. Obrazovky se
tam ptají, nikdy si pravidlo nedomýšlejí. Řídící princip: *omezuj jen to, co
se dotkne plátce, nikdy to, co se dotkne ostatních členů skupiny.*

| | Free | Pro |
| --- | --- | --- |
| Skupiny, členové, výdaje, vyrovnání, pozvánky | neomezeně | neomezeně |
| Účtenky | 1 na výdaj | neomezeně |
| Statistiky | aktuální měsíc | + Trip a All time |
| Roční přehled a sdílecí kartička | ✅ | ✅ |
| Barevná témata | 3 | 4 (včetně Dusk) |
| Export CSV / PDF | — | ✅ |
| Reklamy | ano | ne |

1. V App Store Connect i Play Console vytvoř **jednorázový produkt** (Apple:
   *Non-Consumable*, Google: *In-app product*) s ID `splittingly_pro`
   (viz `src/config.ts` → `PRO_PRODUCT_ID`), cena ~4,99 $.
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

## Krok 14b · Co plyne z Apple Developer Program License Agreement

Prošel jsem smlouvu proti tomu, co appka dělá. Čtyři body mají dopad:

**1 · Reklama a ATT** — §3.3.3(E). Viz varování v kroku 12. Tohle je smluvní
povinnost, ne doporučení.

**2 · Sign in with Apple** — §3.3.5(C). Data získaná přes Apple login **nesmí
jít reklamním platformám ani datovým brokerům**. Náš model to splňuje
(reklama je bezkontextová, viz `ads.ts`), ale až budeš zapojovat AdMob,
nikdy mu nepředávej e-mail ani jméno uživatele.

Praktický důsledek: uživatel si může e-mail skrýt a dostaneš adresu tvaru
`…@privaterelay.appleid.com`. Appka s tím počítá (je to normální adresa),
jen počítej s tím, že v profilu takovou adresu uvidí.

**3 · Nákup Pro** — Attachment 2, §1.1 a §3.3.1(C). Pro odemyká funkce
**uvnitř** appky, takže IAP je správná a jediná povolená cesta. Nikdy
neodemykej Pro přes web ani mimo App Store — §3.3.1(C) to zakazuje.

**4 · Bilance mezi uživateli — a proč jsme v pořádku.** Attachment 2 §2.1
a §2.2 zakazují vytvářet předplacené účty, kredity nebo „Currency", tedy
cokoli, co jde směnit či použít k pozdějšímu nákupu.

Splittingly **peníze nepřevádí** — zaznamenává, že k platbě došlo mimo appku.
Dluh ve skupině tedy není Currency: nedá se za něj nic koupit ani ho převést.
Tím se celý produkt vyhýbá regulaci platebních služeb. **Je to zásadní
návrhové omezení, ne detail** — jakmile by appka začala peníze skutečně
posílat, spadne do úplně jiné kategorie (Apple Pay, licence, KYC).
Proto ta věta na obrazovce 16 („Splittingly records the payment; it does not
move money") není marketing, ale hranice produktu. Nemazat ji.

**Bez dopadu:** fotky účtenek (§3.3.3(A) řeší skryté nahrávání — používáme
systémový fotoaparát, kde je indikátor vestavěný), poloha (nepoužíváme),
Apple Pay, Wallet, MDM, SiriKit.

> 📌 **Obrazovka 14 z návrhu (kamerový hledáček) se neimplementovala.**
> Živý náhled by znamenal `expo-camera` a vlastní kamerovou vrstvu; místo ní
> se otevírá systémový fotoaparát, který uživatel zná a který sám splňuje
> požadavek na viditelný indikátor snímání. Kdyby se někdy přidal ořez
> účtenky nebo OCR, vlastní kamera bude potřeba a návrh 14 se hodí.

> Poznámka: tohle je porovnání smlouvy s tím, co appka dělá — **ne** rozbor,
> co se ve smlouvě oproti minulé verzi změnilo. Na to by bylo potřeba mít obě
> verze vedle sebe.

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
