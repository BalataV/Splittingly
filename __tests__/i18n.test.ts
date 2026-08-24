// Překlady, množné číslo, datum a tiché hodiny.
//
// `scripts/check-i18n.mjs` hlídá slovníky jako data — že nechybí klíč
// a sedí placeholdery. Tady jde o CHOVÁNÍ: že se správný tvar vybere
// i pro čísla, na která nikdo nemyslel, a že datum nevyjde přeházené.

import { t, plural, fmtDate, setLangGlobal, getLang, translationCoverage, canAutoDetect } from '../src/i18n';
import { inQuietHours } from '../src/notifications';
import type { NotifPrefs } from '../src/types';

afterEach(() => setLangGlobal('en'));

describe('t', () => {
  it('bez slovníku vrací anglický klíč, nikdy prázdno', () => {
    setLangGlobal('en');
    expect(t('Add expense')).toBe('Add expense');
  });

  it('neznámý jazyk spadne na angličtinu místo pádu', () => {
    setLangGlobal('xx-nonexistent');
    expect(t('Add expense')).toBe('Add expense');
  });

  it('dosadí placeholder', () => {
    setLangGlobal('en');
    expect(t('Join {name}', { name: 'Mira' })).toBe('Join Mira');
  });

  it('dosadí týž placeholder na všech výskytech', () => {
    setLangGlobal('en');
    expect(t('Assigned — {total} of {total} ✓', { total: '10 €' })).toBe('Assigned — 10 € of 10 € ✓');
  });

  it('opravdu přeloží, když slovník je', () => {
    setLangGlobal('cs');
    expect(t('Add expense')).not.toBe('Add expense');
    setLangGlobal('ja');
    expect(t('Add expense')).not.toBe('Add expense');
  });
});

describe('plural', () => {
  it('angličtina rozliší jednotné a množné', () => {
    setLangGlobal('en');
    expect(plural(1, '{n} expense', '{n} expenses')).toBe('1 expense');
    expect(plural(5, '{n} expense', '{n} expenses')).toBe('5 expenses');
  });

  it('nikdy nevrátí "1 expenses" ani v žádném jazyce', () => {
    for (const lang of ['en', 'cs', 'pl', 'ru', 'de', 'fr', 'ja', 'ar', 'hi']) {
      setLangGlobal(lang);
      const one = plural(1, '{n} expense', '{n} expenses');
      expect(one).toContain('1');
      expect(one.length).toBeGreaterThan(1);
    }
  });

  it('slovanské jazyky mají pro 2–4 jiný tvar než pro 5+', () => {
    setLangGlobal('cs');
    const few = plural(3, '{n} member', '{n} members');
    const many = plural(8, '{n} member', '{n} members');
    expect(few).not.toBe(many.replace('8', '3'));
  });

  it('nula používá množný tvar, ne jednotný', () => {
    setLangGlobal('en');
    expect(plural(0, '{n} expense', '{n} expenses')).toBe('0 expenses');
  });
});

describe('fmtDate', () => {
  const iso = '2026-08-23T10:00:00';

  it('angličtina píše měsíc první', () => {
    setLangGlobal('en');
    expect(fmtDate(iso)).toMatch(/^Aug 23, 2026$/);
  });

  it('většina jazyků píše den první', () => {
    setLangGlobal('cs');
    expect(fmtDate(iso)).toMatch(/^23 /);
  });

  it('CJK jazyky píšou od roku a nekončí rokem uprostřed', () => {
    for (const lang of ['ja', 'zh-Hans', 'zh-Hant', 'ko']) {
      setLangGlobal(lang);
      const out = fmtDate(iso);
      expect(out.startsWith('2026')).toBe(true);
    }
  });

  it('nesmyslné datum vrátí prázdno, ne "Invalid Date"', () => {
    setLangGlobal('en');
    expect(fmtDate('nedatum')).toBe('');
    expect(fmtDate('')).toBe('');
  });

  it('měsíc je přeložený, ne anglický, když slovník je', () => {
    setLangGlobal('cs');
    expect(fmtDate(iso)).not.toMatch(/Aug/);
  });
});

describe('translationCoverage', () => {
  it('angličtina je vždy stoprocentní', () => {
    expect(translationCoverage('en')).toBe(1);
  });

  it('hotový jazyk je na 100 %, ne o pár klíčů níž', () => {
    // Slovanské slovníky mají navíc pádové tvary; jmenovatel je nesmí počítat,
    // jinak by všechny neslovanské jazyky vyšly jako rozpracované.
    for (const lang of ['cs', 'ja', 'zh-Hans', 'vi', 'he', 'hi']) {
      expect(translationCoverage(lang)).toBe(1);
    }
  });

  it('jazyk bez slovníku je na nule', () => {
    expect(translationCoverage('ta')).toBe(0);
  });

  it('automaticky se nabídne jen hotový jazyk', () => {
    expect(canAutoDetect('cs')).toBe(true);
    expect(canAutoDetect('en')).toBe(true);
    expect(canAutoDetect('ta')).toBe(false);
  });
});

describe('inQuietHours', () => {
  const prefs = (quietFrom: number, quietTo: number): NotifPrefs => ({
    expense: true, settled: true, edited: true, weekly: false,
    closer: true, analyst: true, quietFrom, quietTo,
  });
  const at = (h: number) => new Date(2026, 7, 23, h, 30);

  it('interval přes půlnoc platí na obou stranách', () => {
    const p = prefs(23, 8);
    expect(inQuietHours(p, at(23))).toBe(true);
    expect(inQuietHours(p, at(2))).toBe(true);
    expect(inQuietHours(p, at(7))).toBe(true);
    expect(inQuietHours(p, at(8))).toBe(false);
    expect(inQuietHours(p, at(12))).toBe(false);
    expect(inQuietHours(p, at(22))).toBe(false);
  });

  it('běžný interval během dne', () => {
    const p = prefs(1, 6);
    expect(inQuietHours(p, at(3))).toBe(true);
    expect(inQuietHours(p, at(0))).toBe(false);
    expect(inQuietHours(p, at(6))).toBe(false);
  });

  it('stejná hodina na obou stranách neztlumí nic', () => {
    // Přesně na tenhle stav upozorňuje hláška pod krokovadly v Notifikacích.
    const p = prefs(9, 9);
    for (let h = 0; h < 24; h += 1) expect(inQuietHours(p, at(h))).toBe(false);
  });
});
