# 🍎 App Store Connect — copy-paste kit (Splittingly)

Doplněk k `play-console-kit.md`. Apple se ptá na jiné věci a v jiném pořadí.

> ⚠️ **Tři věci, které Apple hlídá u Splittingly:** reklamy (App Privacy +
> App Tracking Transparency), nákup v aplikaci a **Sign in with Apple**, které
> je povinné, protože nabízíš přihlášení Googlem (Review Guideline 4.8).

---

## FÁZE 0 — Než založíš appku

- [ ] Apple Developer členství aktivní (Team ID `5N974388GT`)
- [ ] Bundle ID `com.balata.splittingly` v **Identifiers**, se zaškrtnutými
      **Sign In with Apple** (Configure → *Enable as a primary App ID*),
      **Associated Domains**, **Push Notifications** a **In-App Purchase**
- [ ] `.ipa` build z EAS
- [ ] Testovací účet pro recenzenty (stejný jako pro Google)

---

## FÁZE 1 — Nová aplikace (My Apps → +)

| Pole | ▶ VLOŽ / vyber |
| --- | --- |
| Platforms | **iOS** |
| Name | `Splittingly` |
| Primary Language | **English (U.S.)** |
| Bundle ID | `com.balata.splittingly` |
| SKU | `splittingly-ios-001` |
| User Access | **Full Access** |

> **Name je globálně unikátní.** Kdyby ho Apple odmítl jako zabraný, druhá
> volba je `Splittingly — Split Expenses`. Pak si poznamenej `ascAppId`
> z adresy a doplň ho do `eas.json` → `submit.production.ios.ascAppId`.

---

## FÁZE 2 — App Information

| Pole | ▶ VLOŽ |
| --- | --- |
| Subtitle (max 30) | `Split bills without arguments` |
| Category — Primary | **Finance** |
| Category — Secondary | **Productivity** |
| Content Rights | *Does not contain third-party content* |
| Age Rating | viz níž |

**Age Rating — dotazník:**
- Vše (násilí, sex, drogy, hazard, horor): **None**
- **Unrestricted Web Access: No**
- **Contests: No**
- Výsledek: **4+**

> U Applu je 4+ v pořádku i s reklamou. Nepleť si to s Googlem, kde jsme
> zvolili 18+ kvůli Families Policy — Apple obdobné omezení nemá.

---

## FÁZE 3 — Pricing and Availability

- Price: **Free**
- Availability: **All countries** *(je to mezinárodní produkt, 50 jazyků)*
- **Small Business Program**: přihlas se, pokud ještě nejsi. Sráží provizi
  z 30 % na 15 % pro obraty do 1 M USD ročně.

---

## FÁZE 4 — App Privacy ⚠️ **liší se od Dotačníčku kvůli reklamě**

**Data Types → zaškrtni a nastav:**

| Typ | Linked to user | Used for tracking | Účely |
| --- | --- | --- | --- |
| **Contact Info → Email Address** | Ano | Ne | App Functionality |
| **Contact Info → Name** | Ano | Ne | App Functionality |
| **Financial Info → Other Financial Info** | Ano | Ne | App Functionality |
| **User Content → Photos or Videos** | Ano | Ne | App Functionality |
| **User Content → Other User Content** | Ano | Ne | App Functionality |
| **Identifiers → Device ID** | Ne | **ANO** | **Third-Party Advertising** |

**Otázka „Does your app use data for tracking?" → ANO**, jakmile zapneš AdMob.

> To s sebou nese povinný **App Tracking Transparency prompt** (§3.3.3(E)
> licenční smlouvy). Bez něj appku zamítnou. Viz IMPLEMENTACE.md, krok 12.
>
> Dokud AdMob nezapojíš, odpověz **Ne** a Device ID nezaškrtávej — ale pak to
> **musíš** změnit ve stejné aktualizaci, ve které reklamy přibudou.

- Privacy Policy URL ▶ VLOŽ: `https://splittingly.com/privacy.html`

---

## FÁZE 5 — Verze 1.0

### Promotional Text (max 170, jde měnit bez nového buildu)
▶ VLOŽ:
```
Ten debts become one payment. Log what you paid, and Splittingly works out who owes whom — down to the last cent, in any currency.
```

### Description (max 4000)
▶ Použij **stejný text jako pro Google Play** (`play-console-kit.md`, FÁZE C).
Apple ho bere beze změny.

### Keywords (max 100 znaků, oddělené čárkou, BEZ mezer)
▶ VLOŽ:
```
split,bill,expense,share,group,roommate,trip,travel,debt,settle,tab,budget,friends,holiday
```

> Neopakuj slova z názvu a podtitulu — Apple je indexuje zvlášť a znaky by
> ses připravil zbytečně.

### Support URL
```
https://splittingly.com/support.html
```

### Marketing URL
```
https://splittingly.com
```

### Screenshots
- **iPhone 6,5"** (1242×2688 nebo 1284×2778) — min. 3, na svisle i na šířku
- **iPad: NEPOVINNÉ.** `supportsTablet` je od 2026‑08‑24 `false`, takže se
  appka na iPad neinstaluje a Apple sadu nechce. Kdyby se to někdy vrátilo
  na `true`, iPad screenshoty se stanou povinné a bez nich verzi neodešleš.

> Apple použije nahranou sadu pro VŠECHNY velikosti displeje i jazyky, takže
> stačí jedna. Do instalačního listu se dostanou jen první tři — dej dopředu
> ty, které ukazují dělení výdaje a vyrovnání, ne přihlašovací obrazovku.

### App Review Information ⚠️ **nejčastější důvod zamítnutí**

| Pole | ▶ VLOŽ |
| --- | --- |
| Sign-in required | **Yes** |
| User name | *(testovací e-mail)* |
| Password | *(heslo)* |
| Contact — First/Last | `Vojtěch` / `Balata` |
| Phone | *(tvoje číslo)* |
| Email | `support@splittingly.com` |

**Notes** ▶ VLOŽ:
```
Splittingly is an expense-splitting app for groups of friends or flatmates.

TO REVIEW THE CORE FLOW:
1. Log in with the credentials above.
2. Tap "Create a group", name it, add two member names, tap "Create group".
3. Tap "+ Add expense", enter an amount and a description, tap "Add".
4. The group screen now shows who owes whom and the fewest transfers needed.
5. Tap "Settle up" to record a payment.

IMPORTANT: Splittingly does NOT move money. It records that a payment happened
outside the app and updates the balance. There is no bank connection, no card
on file and no payment processing of any kind.

Sign in with Apple is implemented natively and is offered alongside Google
sign-in, as required by Guideline 4.8.
```

### Version Release
- **Automatically release this version**
- Version ▶ `1.0.0`

### What's New in This Version
▶ VLOŽ:
```
First release.
• Split expenses equally, by shares, or by exact amounts
• The fewest payments needed to settle the whole group
• Receipt photos, categories, stats and a year in review
• Live groups, invite by link or code, push notifications
• Works offline — entries upload when you are back online
• 45 languages, any currency, full light and dark modes
```

---

## FÁZE 6 — In-App Purchase (Splittingly Pro)

**Features → In-App Purchases → +**

| Pole | ▶ VLOŽ |
| --- | --- |
| Type | **Non-Consumable** |
| Reference Name | `Splittingly Pro` |
| Product ID | `splittingly_pro` |
| Price | Tier odpovídající **$4.99** |
| Display Name | `Splittingly Pro` |
| Description | `Removes all ads, lifts the receipt limit, unlocks the full stats history, a pie chart breakdown, every colour theme and CSV export. One payment, no subscription.` |

> **Product ID musí přesně sedět** s `PRO_PRODUCT_ID` v `src/config.ts`.
> Musí projít review **spolu s buildem**, ve kterém se dá koupit — samotný
> produkt bez funkčního nákupu Apple zamítne. Konkrétně: první nákup
> v aplikaci se odesílá jedině s novou verzí appky, ne samostatně.

> ⚠️ Nákup neověřuje appka, ale Edge Funkce `verify-purchase`. Než pošleš
> verzi ke kontrole, musí být nasazená a mít nastavená tajemství
> `APPLE_API_KEY_P8`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID`
> a `APPLE_BUNDLE_ID` — jinak recenzent zaplatí, Pro se nezapne
> a appku zamítne jako nefunkční.

---

## FÁZE 7 — Odeslání

1. **Add for Review** → **Submit to App Review**
2. Export compliance: `usesNonExemptEncryption: false` už je v `app.json`,
   takže se Apple nezeptá
3. Kontrola trvá obvykle **1–3 dny**

Po schválení doplň `ascAppId` do `eas.json` a odkaz do `docs/index.html`
→ `APPLE_URL`, aby ožil odznak.
