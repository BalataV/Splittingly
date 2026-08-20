# Snímky obrazovky pro obchody

Google Play chce **2–8** snímků, Apple **min. 3** ve dvou velikostech.
Pro zařazení do propagace na Play musí mít obě strany **aspoň 1080 px**.

## Odkud fotit

**Ze skutečného telefonu přes Expo Go, ne z webu.** Web verze nemá výřez,
gesture pill ani systémovou lištu a písma se renderují jinak — recenzent to
pozná a uživatel by dostal zkreslenou představu.

> ⚠️ **Snímky pro Google Play foť z Androidu.** Kdybys je nafotil na iPhonu,
> dostaneš do nich Apple emoji (ikony kategorií), a ty Apple nelicencuje pro
> použití mimo své platformy.

## Než začneš — připrav si data

Prázdná appka vypadá jako rozbitá appka. Přihlas se testovacím účtem a založ:

- skupinu **Barcelona Trip**, členové *You, Mira, Kenji, Aya*, měna EUR
- 5–6 výdajů různých kategorií, ať jsou vidět barvy i graf ve statistikách
- jeden výdaj s **fotkou účtenky**
- aspoň jednu **provedenou platbu**, ať je vidět, že se něco vyrovnalo

Vypni si notifikace, ať do snímku nespadne cizí lišta.

## Které obrazovky (v tomhle pořadí)

Pořadí je marketingové, ne technické — první dva snímky rozhodují.

| # | Obrazovka | Co má prodat |
| --- | --- | --- |
| 1 | **Detail skupiny** | „2 transfers settle everything" — hlavní slib produktu |
| 2 | **Přehled** | souhrn *You are owed* a seznam skupin |
| 3 | **Nový výdaj** | dělení, kategorie, účastníci — jak snadné to je |
| 4 | **Statistiky** | graf a kategorie |
| 5 | **Vyrovnáno** (16b) | „EVERYONE IS EVEN." s oběma maskoty |
| 6 | *volitelně* Sdílecí kartička | důvod appku ukázat kamarádům |

Snímek 5 nafoť **v tmavém režimu** — ukáže, že appka umí obojí, a je to
nejhezčí obrazovka v celé aplikaci.

## Jak fotit

1. `npm start` → načti QR v Expo Go
2. V appce: *Profile → Appearance* → nastav **Text size: Medium**
3. Vypni v telefonu „Nerušit", ale zkontroluj, že v liště nic neruší
4. Systémový snímek obrazovky (Android: hlasitost dolů + zámek)
5. Přenes do počítače

## Rozměry

| Obchod | Rozměr | Kolik |
| --- | --- | --- |
| Google Play | poměr 9:16, každá strana 320–3840 px, **doporučeno 1080×1920** | 2–8 |
| App Store 6,7" | **1290×2796** | min. 3 |
| App Store 6,5" | **1242×2688** | min. 3 |

Většina moderních Androidů fotí 1080×2400. Play to vezme; pro Apple bude
potřeba převzorkovat nebo nafotit na iPhonu.

## Co do snímků NEPATŘÍ

- Skutečná jména a částky lidí, kteří ti k tomu nedali souhlas
- Tvoje e-mailová adresa v profilu
- Rámečky telefonu a marketingové popisky přes celý snímek — Google i Apple
  chtějí vidět **skutečné rozhraní**, ne koláž
- Obrazovky, které v appce neexistují
