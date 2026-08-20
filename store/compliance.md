# Soulad s Distribuční smlouvou pro vývojáře Google Play

Porovnání ustanovení smlouvy (verze platná od 15. 9. 2025) s tím, co Splittingly
skutečně dělá. **Není to právní posudek** — je to inventura, ze které je vidět,
kde stojíme a co je potřeba dořešit.

---

## ✅ Splněno

| Ustanovení | Proč jsme v pořádku |
| --- | --- |
| **3.7** — co je zdarma, zůstane zdarma | Splittingly je a zůstane zdarma. Pro je *nákup uvnitř aplikace*, ne přechod na placenou appku — smlouva to výslovně odlišuje („dodatečné poplatky budou spojeny s alternativní nebo doplňující verzí produktu"). |
| **4.5** — nedistribuovat alternativní obchod | Neděláme nic podobného. |
| **4.8** — soukromí a práva uživatelů | Souhlas při registraci, zásady na `splittingly.com/privacy.html`, RLS omezuje přístup jen na členy skupiny, mazání účtu v appce i na webu. Data se používají jen k tomu, k čemu dal uživatel souhlas. |
| **4.9** — nepoškozovat cizí systémy | Appka mluví jen s vlastním Supabase a s reklamní sítí. |
| **9** — ochrana údajů | Šifrování při přenosu (HTTPS), EU region, zpracovatelé vyjmenovaní v zásadách. |
| **16.5** — vývozní omezení | `usesNonExemptEncryption: false` — appka používá jen standardní HTTPS, které je z omezení vyňaté. |

---

## ⚠️ Vyžaduje akci — bez toho to není splněné

### 1 · §11.1 — musíš vlastnit práva k maskotům

> *„Prohlašujete a zaručujete, že vlastníte veškerá práva duševního vlastnictví
> týkající se vašich produktů."*

Současné SVG maskoty v `src/components/Mascot.tsx` jsou původní, takže **teď jsi
v pořádku**. Jakmile ale objednáš skutečnou ilustraci, potřebuješ od
ilustrátora **smlouvu o dílo s převodem majetkových práv** — ne jen fakturu.

Bez ní nemůžeš toto prohlášení podepsat pravdivě, a §14 tě zavazuje odškodnit
Google, kdyby z toho vznikl spor.

**Co udělat:** do objednávky ilustrací dej výslovně: *výhradní, časově
i územně neomezená licence ke všem způsobům užití, včetně práva na úpravy
a poskytnutí podlicence*.

### 2 · §4.7 — podpora do 3 pracovních dnů, urgentní do 24 hodin

> *„Souhlasíte s tím, že na žádosti zákazníků o podporu (…) budete reagovat
> do tří pracovních dnů a že na všechny problémy (…) označené jako urgentní
> budete reagovat do 24 hodin."*

Tohle je **závazek, ne doporučení**. `support@splittingly.com` musí být
skutečně čtený.

**Co udělat:** nastav v Zoneru přeposílání na gmail, který čteš denně.

### 3 · §11.4 — všechny údaje musí být pravdivé

> *„Prohlašujete a zaručujete, že všechny informace (…) budou aktuální,
> pravdivé, přesné, obhajitelné a úplné."*

Týká se to hlavně **Data safety**. Nejčastější přešlap: appka s reklamou
neuvede sdílení reklamního identifikátoru. Náš formulář to přiznává
(viz `play-console-kit.md`, B6) — jen to tak vyplň.

### 4 · §3.5–3.6 — daně

Musíš mít v Play Console vyplněné **daňové údaje a formulář W-8BEN**.
Bez nich Google zadrží výplatu z reklam i z nákupů.

---

## 🔶 Rizika, která stojí za zvážení

### Obsah od uživatelů (Google Play User Generated Content policy)

Splittingly umožňuje lidem sdílet obsah — jména členů, popisy výdajů, fotky
účtenek. Zásady pro appky s obsahem od uživatelů vyžadují mechanismus
**nahlášení nevhodného obsahu** a **zablokování uživatele**.

**Jak jsme na tom:** skupiny jsou uzavřené, přístup jen na pozvání kódem nebo
odkazem — je to spíš soukromý chat než veřejná platforma, a tam Google
požadavky uplatňuje mírněji. Odejít ze skupiny se dá (`leaveGroup`).
**Nahlásit obsah se ale nedá.**

Riziko hodnotím jako **nízké, ne nulové**. Kdyby to recenzent zvedl, je to
oprava na pár hodin — tlačítko „Report" v detailu výdaje, které pošle e-mail
na podporu.

### Emoji ve screenshotech

Kategorie výdajů používají emoji jako dočasnou náhradu ikon. Na zařízení se
vykreslují systémovým fontem, takže se nedistribuují a problém to není.

**Ale pozor u screenshotů:** kdybys je nafotil na iPhonu, dostaneš do nich
**Apple emoji**, které Apple nelicencuje pro použití mimo své platformy.
Screenshoty pro Google Play tedy foť **z Androidu**.

### Kategorie Finance

Splittingly je v kategorii Finance, ale **nespadá pod Financial Services
policy** — nepůjčuje, neinvestuje, neobchoduje s kryptem a hlavně nepřevádí
peníze. Popis v obchodě to říká výslovně („Splittingly records payments;
it does not move money"), což je přesně ta věta, která recenzentovi ušetří
otázku. **Nemazat ji.**

---

## Fonty a grafika třetích stran (§11.2)

| Materiál | Licence | V pořádku? |
| --- | --- | --- |
| Archivo Black | SIL Open Font License | ✅ vložení do appky povoleno |
| Space Grotesk | SIL Open Font License | ✅ |
| Odznaky App Store / Google Play | oficiální, licencované k tomuto účelu | ✅ dokud se grafika neupravuje |
| Ikona a logo | vlastní, generované z geometrie | ✅ |
| Maskoti | zatím vlastní; po objednávce viz bod 1 výše | ⚠️ |

> ⚠️ **Připomínka:** zdrojový `design_handoff_splittingly/README.md` má na konci
> přilepený blok citací z filmů. V kódu nejsou a nesmí se tam dostat — byly by
> to cizí autorská práva, tedy přímý rozpor s §11.1 i §11.2.

---

## Shrnutí

Appka jako taková **smlouvě neodporuje**. Nic v ní nedělá, co by smlouva
zakazovala, a architektura (žádné převody peněz, uzavřené skupiny,
bezkontextová reklama) jde spíš nad rámec požadavků.

Otevřené jsou **procesní věci, ne technické**: práva k maskotům, funkční
podpora, daňové formuláře a pravdivě vyplněný Data safety.

Jediná věcná mezera je **chybějící nahlášení obsahu**, a i tu bych řešil až
kdyby ji recenzent zvedl — přidávat teď moderační nástroje do appky pro
partu kamarádů by bylo dělání práce navíc.
