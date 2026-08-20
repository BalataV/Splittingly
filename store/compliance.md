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

> 📌 **A pak přepni deklaraci AI podkladů.** Dnes je v Play Console správně
> *„Neoznačovat podklady"* — ikona i hlavní grafika jsou procedurálně
> generované z kódu (geometrie loga, HTML+CSS), což je stejná kategorie jako
> kresba v Illustratoru, ne syntetické médium.
>
> Jakmile ale maskoty nakreslí generativní model (Midjourney, DALL-E a spol.),
> musíš přepnout na *„Označit podklady jako vytvořené pomocí AI"*. Zeptej se
> ilustrátora dopředu — na faktuře to nebude.

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

## Požadavky konkrétních zemí

Google má zvláštní požadavky pro některé trhy. Splittingly se týkají dva.

### Japonsko — veřejné jméno, telefon a adresa ⚠️

Zákon *Tokuteišotorihiki-ho* (o vybraných komerčních transakcích) vyžaduje,
aby appka s **nákupy v aplikaci** zobrazovala spotřebitelům jméno, telefonní
číslo a adresu provozovatele. Splittingly má `splittingly_pro`, takže se
to na něj vztahuje.

**Kolize se soukromím:** z webu jsme adresu záměrně odstranili. Tady ji ale
Play Console vyžaduje. Údaje se ukazují **jen japonským uživatelům**, ne
globálně.

Možnosti:
1. Vyplnit a přijmout, že to japonští uživatelé uvidí
2. **Použít P.O. box nebo virtuální adresu** — splní požadavek, nevystaví bydliště
3. Vynechat Japonsko z dostupnosti (ztráta trhu, kde appka dává smysl —
   máme JPY včetně bezdesetinné matematiky)

### Brazílie — ověření obchodníka

Google si vyžádá jméno, adresu a doklad totožnosti. Jako **fyzická osoba**
to máš jednodušší než firma (odpadají skuteční vlastníci a manažeři).

**Nedělej nic dopředu** — Google se ozve sám e-mailem s předmětem
„Důležité informace o vašem účtu Google" a v konzoli se objeví banner.

### EU — zákaz geoblockingu

Nařízení **(EU) 2018/302** zakazuje neoprávněné geografické blokování:
appka musí být dostupná **v celé EU**. Naše vyloučení (Kuba, Írán, Rusko,
Bělorusko) je v pořádku — žádná z nich není členem EU.

### Netýká se nás

| Trh | Proč ne |
| --- | --- |
| Korea | Dodatečné údaje jen pro vývojáře **se sídlem v Koreji** |
| Izrael | KYC jen pro vývojáře s **fakturační adresou v Izraeli** |
| Vietnam | Licencování jen pro **online hry** |
| Brazílie — Digital ECA | Od 17. 3. 2026 pro appky **pro děti**; Splittingly je 18+ |

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
