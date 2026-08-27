# Pokyny pro agenta

Než začneš cokoli měnit, přečti si v kořeni projektu:

- **`AGENTS.md`** — produkt, datový model a konvence. Při rozporu vyhrává.
- **`TEAM.md`** — rozdělení rolí. Najdi si tu, do jejíž oblasti úkol spadá,
  a drž se jejích zákazů a pastí.

Rychlá pravidla, která platí vždy:

- Texty v UI **anglicky**, komentáře v kódu a zprávy commitů **česky**.
- Peníze jsou celá čísla v minor units. Nikdy `float`, nikdy sčítání
  dvou měn dohromady.
- `catch {}` bez logu je zakázaný. Tichá chyba se najde až podle toho,
  že lidem nesedí peníze.
- Text se v UI nikdy neuřezává a poloměr rohů je všude 0.
- `is_pro` zapisuje jedině Edge funkce `verify-purchase`, nikdy klient.

Než ohlásíš hotovo:

```bash
npm run typecheck && npm test && npm run check:i18n && npm run check:money
```

Když je změna vidět, ověř ji v prohlížeči (`npm run web`, port 8088).
