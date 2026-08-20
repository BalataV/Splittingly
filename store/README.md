# store/ — materiály pro obchody

| Soubor | K čemu |
| --- | --- |
| `play-console-kit.md` | Google Play Console, pole po poli |
| `app-store-kit.md` | App Store Connect, pole po poli |
| `compliance.md` | inventura proti Distribuční smlouvě Google Play |
| `screenshots-guide.md` | jak nastřílet snímky obrazovky |

## Tři věci, ve kterých se Splittingly liší od Dotačníčku

1. **Obsahuje reklamy.** Google: *Ads → Yes*. Apple: *Device ID → used for
   tracking*, plus povinný ATT prompt.
2. **Obsahuje nákup v aplikaci.** Produkt `splittingly_pro` musí projít
   review spolu s buildem, ve kterém se dá koupit.
3. **Je anglicky a mezinárodní.** Výchozí jazyk en-US, dostupnost všude.

## Co appku nejčastěji shodí

- **Chybějící testovací účet.** Recenzent se nedostane za přihlášení a zamítne
  ji, aniž by ji viděl. Účet vyplň v obou konzolích.
- **Nesoulad v deklaraci reklam.** Google i Apple to kontrolují automaticky.
- **Odkazy na `*.github.io` místo vlastní domény.** Vždy `splittingly.com`.
- **Package name se rozejde s `.aab`.** Musí být `com.balata.splittingly`,
  přesně jako v `app.json`. Po prvním nahrání už se nedá změnit.
- **Screenshoty focené na iPhonu pro Google Play.** Apple emoji se nesmí
  používat mimo platformy Applu — screenshoty pro Play foť z Androidu.
