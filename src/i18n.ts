// Překlady. Klíčem je ANGLICKÁ věta — angličtina se tedy vrací rovnou jako
// klíč a chybějící překlad nikdy nerozbije UI (spadne zpátky do angličtiny).
//
// V repozitáři jsou hotové jen jazyky, na kterých se ověřuje layout:
//   de (+42 %), ru (+58 %), fi (+64 %) — délkové stresy z handoffu,
//   ar (RTL), th (vysoké značky), ja (CJK), cs (tvůj jazyk).
// Zbývajících ~43 se doplňuje překladem téhož slovníku; struktura se nemění.
// Jak přidat jazyk → IMPLEMENTACE.md, krok 9.

import { language, isRTL } from './languages';
import type { ScriptName } from './languages';

let current = 'en';

export function getLang(): string { return current; }
export function setLangGlobal(l: string) { current = l; }
export function currentScript(): ScriptName { return language(current).script; }
export function currentRTL(): boolean { return isRTL(current); }

/**
 * Překlad. `vars` nahradí {placeholdery}: t('Pay {who}', { who: 'Mira' }).
 * Placeholder nikdy nelep do věty ručně — jazyky mají různý slovosled.
 */
export function t(en: string, vars?: Record<string, string | number>): string {
  const dict = DICT[current];
  let out = dict && dict[en] ? dict[en] : en;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      out = out.split('{' + k + '}').join(String(vars[k]));
    });
  }
  return out;
}

/**
 * Množné číslo.
 *
 * Volající zadá jen ANGLICKÉ tvary — jednotné a množné číslo. Jazyky, které
 * potřebují víc tvarů (čeština, ruština, polština… mají tři), je dodají ve
 * slovníku pod klíčem s příponou kategorie:
 *
 *     '{n} members#few':  '{n} členové',   // 2–4
 *     '{n} members#many': '{n} členů',     // 0, 5+
 *
 * Bez té přípony se použije běžný překlad, a když chybí i ten, angličtina.
 * Díky tomu nemůže vzniknout „1 expenses" ani „2 členů".
 */
export function plural(n: number, one: string, other: string, vars?: Record<string, string | number>): string {
  const v: Record<string, string | number> = { ...(vars || {}), n };
  const base = n === 1 ? one : other;
  const dict = DICT[current];
  if (dict) {
    const withCat = dict[base + '#' + pluralCategory(n)];
    if (withCat) {
      let out = withCat;
      Object.keys(v).forEach((k) => { out = out.split('{' + k + '}').join(String(v[k])); });
      return out;
    }
  }
  return t(base, v);
}

const SLAVIC = ['cs', 'sk', 'pl', 'ru', 'uk', 'hr', 'sr', 'sl', 'bg'];

/** Zjednodušená kategorie množného čísla. Pokrývá jazyky, které v appce jsou. */
function pluralCategory(n: number): 'one' | 'few' | 'many' | 'other' {
  if (SLAVIC.includes(current)) {
    if (n === 1) return 'one';
    if (n >= 2 && n <= 4) return 'few';
    return 'many';
  }
  return n === 1 ? 'one' : 'other';
}

/**
 * Datum podle JAZYKA (ne podle měny). Vrací krátký tvar do řádků seznamu.
 * Intl je na Hermesu nespolehlivý, takže si pořadí složek řešíme sami.
 */
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MDY_LANGS = ['en'];

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const mon = t(MONTHS_EN[d.getMonth()]);
  const year = d.getFullYear();
  return MDY_LANGS.includes(current) ? `${mon} ${day}, ${year}` : `${day} ${mon} ${year}`;
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ---------------------------------------------------------------- slovníky
//
// Překlady bydlí v `src/translations/<kód>.json`, ne tady v kódu. Důvody:
//   • soubor se dá poslat překladateli tak, jak je — není v něm žádný kód,
//   • klíče se generují ze zdrojáků (`scripts/i18n-keys.mjs`), takže se
//     nemůžou rozejít s tím, co appka doopravdy volá,
//   • `scripts/check-i18n.mjs` ohlídá překlepy v klíčích a placeholdery.
//
// PŘIDÁNÍ JAZYKA:
//   1. node scripts/i18n-keys.mjs > /tmp/klice.txt
//   2. přelož řádek po řádku do souboru se STEJNÝM počtem řádků
//   3. node scripts/i18n-build.mjs <kód> /tmp/preklad.txt
//   4. přidej `import` a řádek do `DICT` níž
//   5. node scripts/check-i18n.mjs

type Dict = Record<string, string>;

import ar from './translations/ar.json';
import cs from './translations/cs.json';
import de from './translations/de.json';
import es from './translations/es.json';
import fi from './translations/fi.json';
import fr from './translations/fr.json';
import it from './translations/it.json';
import ja from './translations/ja.json';
import ru from './translations/ru.json';
import th from './translations/th.json';

const DICT: Record<string, Dict> = { ar, cs, de, es, fi, fr, it, ja, ru, th };

/** Které jazyky vůbec mají slovník (ostatní běží celé v angličtině). */
export function translatedLanguages(): string[] {
  return ['en', ...Object.keys(DICT)];
}

/**
 * Kolik klíčů má jazyk přeloženo. Slouží k rozlišení „hotový" od „rozdělaný".
 *
 * Referencí je NEJBOHATŠÍ slovník, ne pevné číslo. Skutečný počet klíčů v
 * appce zná jen `scripts/i18n-keys.mjs` (čte zdrojáky) a natvrdo zapsaná
 * konstanta by se rozešla s realitou při první nové obrazovce. Jakmile je
 * aspoň jeden jazyk kompletní — a `es` je — je nejbohatší slovník správnou
 * referencí a tenhle odhad odpovídá skutečnosti.
 *
 * Přesné číslo kdykoli: `node scripts/check-i18n.mjs`.
 */
export function translationCoverage(lang: string): number {
  if (lang === 'en') return 1;
  const dict = DICT[lang];
  if (!dict) return 0;
  const richest = Math.max(...Object.values(DICT).map((d) => Object.keys(d).length));
  return Object.keys(dict).length / richest;
}

/**
 * Jazyky dost hotové na to, aby se nabídly SAMY podle nastavení telefonu.
 *
 * Sem patří jazyk, až když má přeloženo VŠECHNO. Poloviční slovník by
 * uživateli naservíroval rozhraní zpola v jeho jazyce a zpola anglicky —
 * a to je horší než čistá angličtina, protože to vypadá jako rozbitá appka,
 * ne jako jazyk, který si vybral.
 *
 * Ruční volbu v nastavení to nijak neomezuje — tam si uživatel vybere
 * kterýkoli z 50 jazyků a u rozdělaných uvidí upozornění „partly translated".
 *
 * Než sem jazyk přidáš, ověř `node scripts/check-i18n.mjs` — musí být na 100 %.
 */
export const AUTO_DETECT_READY: string[] = ['cs', 'de', 'es', 'fr', 'it'];

/** Smí se tenhle jazyk nastavit automaticky podle telefonu? */
export function canAutoDetect(lang: string): boolean {
  return lang === 'en' || AUTO_DETECT_READY.includes(lang);
}
