# 📋 Google Play Console — copy-paste kit (Splittingly)

Jdi v Play Console odshora dolů. U každého pole je **▶ VLOŽ:** co přesně zkopírovat.
Přihlášení, právní souhlasy a samotnou publikaci klikáš ty.

> ⚠️ **Splittingly se od Dotačníčku liší ve třech věcech, které Google kontroluje:**
> obsahuje **reklamy**, obsahuje **nákup v aplikaci** a je **anglicky**.
> Kde se odpověď kvůli tomu mění, je to níž označené.

---

## 0) Co si připravit PŘED vyplňováním

- [ ] **`.aab` soubor** — z <https://expo.dev> → projekt `balatav/splittingly`
      → **Builds** → poslední *production* build → **Download**
- [ ] **Ikona 512×512** — `assets/icon.png` je 1024×1024, zmenši na 512
- [ ] **Feature graphic 1024×500** — viz `store/feature-graphic.md`
- [ ] **Aspoň 2 screenshoty telefonu** — `store/screenshots-guide.md`
- [ ] **Testovací účet pro recenzenty** — v appce si založ účet přes e-mail
      a poznamenej si přihlašovací údaje. **Bez něj appku zamítnou**, protože
      se nedostanou za přihlašovací obrazovku.
- [ ] Ověřeno, že `https://splittingly.com/privacy.html` a
      `https://splittingly.com/delete-account.html` fungují

---

# FÁZE A — Vytvořit aplikaci

*(To je ta obrazovka, na které jsi teď.)*

| Pole | ▶ VLOŽ / vyber |
| --- | --- |
| **Název aplikace** | `Splittingly` |
| **Výchozí jazyk** | **Angličtina (Spojené státy) – en-US** |
| **Aplikace/hra** | **Aplikace** |
| **Zdarma/placená** | **Za 0 Kč** (zdarma) |
| Deklarace | zaškrtni **obě** |

> **„Název balíčku" musí být ve formátu `com.example.mojeaplikace`** — malá
> písmena, číslice, podtržítka, začíná malým písmenem. Pro nás
> `com.balata.splittingly`, tedy přesně to, co je v `app.json` →
> `android.package`.
>
> ⚠️ **Musí to sedět na chlup.** Nahraný `.aab` má applicationId zapečený
> uvnitř; když se rozejde s tím, co zadáš tady, Play Console build odmítne.
> A jakmile jednou nahraješ první `.aab`, **package name už nikdy nezměníš** —
> jediná cesta zpět je založit aplikaci znovu pod jiným názvem a přijít
> o všechna stažení i hodnocení.

> **Pozor na „Zdarma".** Po publikaci **už nejde změnit na placenou**. Nám to
> nevadí — Splittingly je zdarma a vydělává reklamou a jednorázovým nákupem
> uvnitř appky, což je něco jiného než placená aplikace.

→ **Vytvořit aplikaci**

---

# FÁZE B — App content (levé menu → Obsah aplikace)

## B1 · Zásady ochrany osobních údajů
▶ VLOŽ:
```
https://splittingly.com/privacy.html
```

## B2 · App access (Přístup k aplikaci)
Vyber **„All or some functionality is restricted"** → **Add new instructions**:

| Pole | ▶ VLOŽ |
| --- | --- |
| Name | `Email sign-in` |
| Username / e-mail | *(tvůj testovací e-mail)* |
| Password | *(heslo)* |
| Instructions | `On the welcome screen tap "Log in", enter the email and password above, then tap "Log in". The app then shows the Overview screen with your groups.` |

## B3 · Ads (Reklamy) — ⚠️ **ZDE SE LIŠÍME OD DOTAČNÍČKU**
▶ **Yes, my app contains ads.**

Zalhat se nevyplácí — Google to kontroluje automaticky a nesoulad znamená
stažení aplikace.

## B4 · Content rating (Hodnocení obsahu)
1. E-mail: `vojtech.balata@gmail.com` *(sem chodí certifikát IARC, není to veřejný kontakt)*
2. Kategorie: **Utility, Productivity, Communication, or Other**
3. Dotazník — pro Splittingly:
   - Násilí, sex, drogy, hazard, strach: **Ne** u všeho
   - **Hrubý humor / vulgární jazyk: Ne.** Maskoti jsou suchý humor, nic vulgárního.
   - **Users can interact / share content: Ano** (skupiny, pozvánky, sdílecí kartička)
   - **Shares user-provided content: Ano**
   - Očekávaný výsledek: **Everyone** nebo **Everyone 10+**

## B5 · Target audience and content
- Cílová věková skupina: **18 a více**
- „Appeals to children?" → **No**

> Proč 18+: při 13+ appka spadá pod **Families Policy**, která zpřísňuje
> pravidla pro reklamu (jen certifikované sítě, žádné personalizované reklamy)
> a přidává další kontrolu. Pro appku o dělení účtů mezi dospělými je 18+
> jednodušší a poctivější.

## B6 · Data safety — ⚠️ **JINÉ NEŽ U DOTAČNÍČKU KVŮLI REKLAMĚ**

**Přehledové otázky:**
- Does your app collect or share user data? → **Yes**
- Is all data encrypted in transit? → **Yes**
- Do you provide a way for users to request deletion? → **Yes**
- Deletion URL ▶ VLOŽ: `https://splittingly.com/delete-account.html`

**Datové typy:**

| Datový typ | Collected | Shared | Účel | Povinné? |
| --- | --- | --- | --- | --- |
| Personal info → **Email address** | Ano | Ne | App functionality, Account management | Required |
| Personal info → **Name** | Ano | Ne | App functionality | Optional |
| Financial info → **Other financial info** *(částky výdajů)* | Ano | Ne | App functionality | Optional |
| Photos and videos → **Photos** *(účtenky)* | Ano | Ne | App functionality | Optional |
| App activity → **Other user-generated content** | Ano | Ne | App functionality | Optional |
| Device or other IDs → **Device or other IDs** | Ano | **ANO** | App functionality, **Advertising or marketing** | Optional |

> ⚠️ **Poslední řádek je ten rozdíl.** AdMob používá reklamní identifikátor,
> takže se sdílí s třetí stranou a musí být přiznaný. Všechno ostatní zůstává
> nesdílené — reklama u nás nikdy nedostane text výdaje, částku, kategorii ani
> název skupiny (viz `src/ads.ts` a zásady, sekce 4).

**NEZAŠKRTÁVEJ:** poloha, kontakty, SMS, zdraví, platební údaje, historie prohlížení.

## B7 · Government apps → **No**

## B8 · Financial features → **„Aplikace neposkytuje žádné finanční funkce"**

Je to poslední volba pod celým seznamem. **Nezaškrtávej nic z nabídky.**

> ⚠️ **Past: „Převody a posílání peněz".** Je lákavé to zaškrtnout, protože
> appka mluví o „settle up" — ale Splittingly peníze **nepřevádí**, jen
> zaznamenává, že platba proběhla mimo appku.
>
> Zaškrtnutím spustíš kontrolu specializovaným týmem, který bude chtít
> **licenci k poskytování platebních služeb** (v EU podle PSD2). Tu nemáš
> a nepotřebuješ — appka by uvízla ve schvalování.
>
> Stejně tak nezaškrtávej „Odměny, body, věrnostní programy" (Pro je
> jednorázový nákup funkcí, ne věrnostní systém) ani cokoli z „Obchodování
> a fondy".

Je to hranice, na které stojí celý produkt — viz IMPLEMENTACE.md, krok 14b.

## B9 · Health → **No**

---

# FÁZE C — Main store listing

## App name (max 30)
▶ VLOŽ:
```
Splittingly
```

## Short description (max 80)
▶ VLOŽ:
```
Split shared expenses. Ten debts become one payment. No arguments.
```

## Full description (max 4000)
▶ VLOŽ:
```
Splittingly splits shared expenses with the people you actually spend money with — flatmates, friends on holiday, family. Anyone logs what they paid and who it was for. The app works out who owes whom, and collapses ten tangled debts into the fewest payments possible.

LOG AN EXPENSE IN SECONDS
Amount, who paid, who it concerns. Attach a receipt photo if you want proof. Pick a category so the numbers make sense later.

SPLIT IT ANY WAY YOU LIKE
Equally, by shares (whoever ate more pays more), or by exact amounts. Every split adds back up to the exact total — the remainder never disappears and never gets invented.

TEN DEBTS. ONE PAYMENT.
Splittingly nets everything out and shows the shortest route to zero. Instead of five people paying each other in circles, two transfers settle the whole group. Clear a debt with one tap.

CATEGORIES AND STATS
See where the money actually went, who spends most, and get a playful year in review you can share.

LIVE GROUPS
Invite people with a link or a six-character code. Everyone sees the same numbers immediately. Push notifications when someone adds an expense or settles up — with quiet hours, so nobody gets buzzed at 2am.

WORKS WITHOUT SIGNAL
Add an expense on a mountain, in a basement bar, on a plane. It saves on your phone and uploads itself when you are back online.

50 LANGUAGES, YOUR CURRENCY
Language and currency are separate settings — the app in Italian while your group counts in Thai baht is a normal thing to do. Currencies without decimals (JPY, KRW, VND, ISK) are handled properly, right down to the split maths. Right-to-left languages mirror the whole interface.

BUILT FOR READING
Full light and dark modes, four colour themes, three text sizes. Buttons grow with their label instead of cutting the text off.

TWO MASCOTS WHO DISAGREE
The Closer thinks every round is an investment. The Analyst has seen the numbers and would like a word. You can switch them both off if you would rather just do the maths.

HONEST ABOUT ADS
Splittingly is free and pays for itself with advertising — but never on a screen where you enter or confirm money. New expense, split editor, settle up and every success screen stay completely ad-free. One optional payment removes ads everywhere. No subscription.

Splittingly records payments; it does not move money. There is no bank connection and no card on file.
```

## Grafika

| Položka | Soubor / rozměr |
| --- | --- |
| App icon | 512×512 (zmenšenina z `assets/icon.png`) |
| Feature graphic | 1024×500 |
| Phone screenshots | min. 2, doporučeno 5 |

## Countries / regions (Dostupnost)

**Zaškrtni všechny země včetně „Zbytek světa", kromě:**

| Vynechat | Důvod |
| --- | --- |
| **Kuba** | Embargo OFAC. §16.5 smlouvy tě zavazuje dodržovat americká vývozní omezení a sankce a činí tě odpovědným za to, že je Google kvůli tobě neporuší. |
| **Írán** | Totéž. Google Play tam prakticky nefunguje. |
| **Rusko** (doporučeno) | Google Play tam má pozastavené placené transakce a AdMob nemonetizuje — nulový příjem, ale plný závazek podpory podle §4.7. |
| **Bělorusko** (doporučeno) | Totéž. |

> Severní Korea a Sýrie v seznamu nejsou — ty Google vyřadil sám. Kubu a Írán
> nechává na tobě.

Jinde omezovat nemá smysl: appka má 50 jazyků a 50 měn a je stavěná na to, že
běží v italštině a počítá v bahtech. „Zbytek světa" navíc pokryje země, které
Google přidá později.

> **Dostupnost jde kdykoli změnit** — na rozdíl od volby „Zdarma", která je po
> publikaci nevratná.

## Kategorizace a kontakt
- App category: **Finance**
- Tags: *expense tracking, budgeting, bill splitting*
- Contact email: `support@splittingly.com`
- Website: `https://splittingly.com`

→ **Save**

---

# FÁZE D — Nahrání buildu

Levé menu → **Testing → Closed testing** → **Create new release**

1. **App integrity / signing** → nech **Google-managed signing**
2. **App bundles** → nahraj `.aab`
3. **Release name** ▶ VLOŽ: `1.0.0`
4. **Release notes** ▶ VLOŽ:
```
<en-US>
First release.
• Split expenses equally, by shares, or by exact amounts
• The fewest payments needed to settle the whole group
• Receipt photos, categories, stats and a year in review
• Live groups, invite by link or code, push notifications
• Works offline — entries upload when you are back online
• 50 languages, any currency, full light and dark modes
</en-US>
```
5. Přidej sebe jako testera → **Save** → **Review release** → **Start rollout**

> **Máš production access** (Dotačníček je v produkci), takže 14denní uzavřené
> testování s 12 testery **odpadá**. Krátký uzavřený test si přesto udělej —
> odhalí chyby dřív než recenzent.

Až test projde: **Production** → **Create new release** → **Promote** z testu.

---

# FÁZE E — Po odeslání

- První kontrola trvá obvykle **pár dní**
- Výtky chodí e-mailem → oprav → nový build → nahraj znovu
- Po schválení doplň odkaz do `docs/index.html` → `PLAY_URL`, aby ožil odznak
