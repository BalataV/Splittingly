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
// Ukázkové překlady záměrně obsahují DLOUHÉ varianty — na nich se pozná,
// jestli tlačítko roste do výšky místo aby text uřízlo.

type Dict = Record<string, string>;

const DE: Dict = {
  'Overview': 'Übersicht',
  'Groups': 'Gruppen',
  'Activity': 'Aktivität',
  'Stats': 'Statistik',
  'You are owed': 'Dir wird geschuldet',
  'You owe': 'Du schuldest',
  'Add expense': 'Ausgabe hinzufügen',
  'Settle up': 'Schulden begleichen',
  'Confirm payment': 'Zahlung bestätigen',
  'New expense': 'Neue Ausgabe',
  'Split between': 'Aufteilen zwischen',
  'Equal': 'Gleich',
  'Shares': 'Anteile',
  'Exact': 'Genau',
  'Create group': 'Gruppe erstellen',
  'Join with a code': 'Mit einem Code beitreten',
  'Everyone is even.': 'Alle sind quitt.',
  'Nothing to split yet.': 'Noch nichts aufzuteilen.',
  'Language and currency are separate settings.': 'Sprache und Währung sind getrennte Einstellungen.',
  'Remove the ads': 'Werbung entfernen',
};

const RU: Dict = {
  'Overview': 'Обзор',
  'Groups': 'Группы',
  'Activity': 'Активность',
  'Stats': 'Статистика',
  'You are owed': 'Вам должны',
  'You owe': 'Вы должны',
  'Add expense': 'Добавить расход',
  'Settle up': 'Рассчитаться',
  'Confirm payment': 'Подтвердить платёж',
  'New expense': 'Новый расход',
  'Split between': 'Разделить между',
  'Equal': 'Поровну',
  'Shares': 'Доли',
  'Exact': 'Точно',
  'Create group': 'Создать группу',
  'Join with a code': 'Присоединиться по коду',
  'Everyone is even.': 'Все рассчитались.',
  'Nothing to split yet.': 'Пока нечего делить.',
  'Language and currency are separate settings.': 'Язык и валюта — независимые настройки.',
  'Remove the ads': 'Убрать рекламу',
};

const FI: Dict = {
  'Overview': 'Yleiskatsaus',
  'Groups': 'Ryhmät',
  'Activity': 'Tapahtumat',
  'Stats': 'Tilastot',
  'You are owed': 'Sinulle ollaan velkaa',
  'You owe': 'Olet velkaa',
  'Add expense': 'Lisää kulu',
  'Settle up': 'Selvitä velat',
  'Confirm payment': 'Vahvista maksusuoritus',
  'New expense': 'Uusi kulu',
  'Split between': 'Jaa henkilöiden kesken',
  'Equal': 'Tasan',
  'Shares': 'Osuudet',
  'Exact': 'Tarkka',
  'Create group': 'Luo ryhmä',
  'Join with a code': 'Liity koodilla',
  'Everyone is even.': 'Kaikki ovat tasoissa.',
  'Nothing to split yet.': 'Ei vielä jaettavaa.',
  'Language and currency are separate settings.': 'Kieli ja valuutta ovat erilliset asetukset.',
  'Remove the ads': 'Poista mainokset',
};

const AR: Dict = {
  'Overview': 'نظرة عامة',
  'Groups': 'المجموعات',
  'Activity': 'النشاط',
  'Stats': 'الإحصائيات',
  'You are owed': 'لك مستحقات',
  'You owe': 'عليك',
  'Add expense': 'إضافة مصروف',
  'Settle up': 'تسوية الحساب',
  'Confirm payment': 'تأكيد الدفع',
  'New expense': 'مصروف جديد',
  'Split between': 'التقسيم بين',
  'Equal': 'بالتساوي',
  'Shares': 'حصص',
  'Exact': 'مبالغ محددة',
  'Create group': 'إنشاء مجموعة',
  'Join with a code': 'الانضمام برمز',
  'Everyone is even.': 'الجميع متعادلون.',
  'Nothing to split yet.': 'لا شيء للتقسيم بعد.',
  'Language and currency are separate settings.': 'اللغة والعملة إعدادان منفصلان.',
  'Remove the ads': 'إزالة الإعلانات',
};

const TH: Dict = {
  'Overview': 'ภาพรวม',
  'Groups': 'กลุ่ม',
  'Activity': 'กิจกรรม',
  'Stats': 'สถิติ',
  'You are owed': 'คนอื่นเป็นหนี้คุณ',
  'You owe': 'คุณเป็นหนี้',
  'Add expense': 'เพิ่มค่าใช้จ่าย',
  'Settle up': 'เคลียร์ยอด',
  'Confirm payment': 'ยืนยันการชำระเงิน',
  'New expense': 'ค่าใช้จ่ายใหม่',
  'Equal': 'เท่ากัน',
  'Shares': 'สัดส่วน',
  'Exact': 'ระบุจำนวน',
  'Create group': 'สร้างกลุ่ม',
  'Everyone is even.': 'ทุกคนเคลียร์แล้ว',
  'Remove the ads': 'ลบโฆษณา',
};

const JA: Dict = {
  'Overview': '概要',
  'Groups': 'グループ',
  'Activity': 'アクティビティ',
  'Stats': '統計',
  'You are owed': '受け取り',
  'You owe': '支払い',
  'Add expense': '支出を追加',
  'Settle up': '精算する',
  'Confirm payment': '支払いを確認',
  'New expense': '新しい支出',
  'Equal': '均等',
  'Shares': '比率',
  'Exact': '金額指定',
  'Create group': 'グループを作成',
  'Everyone is even.': '全員清算済みです。',
  'Remove the ads': '広告を削除',
};

const CS: Dict = {
  'Overview': 'Přehled',
  'Groups': 'Skupiny',
  'Activity': 'Aktivita',
  'Stats': 'Statistiky',
  'You are owed': 'Máš dostat',
  'You owe': 'Dlužíš',
  'Add expense': 'Přidat výdaj',
  'Settle up': 'Vyrovnat',
  'Confirm payment': 'Potvrdit platbu',
  'New expense': 'Nový výdaj',
  'Split between': 'Rozdělit mezi',
  'Equal': 'Rovným dílem',
  'Shares': 'Podílem',
  'Exact': 'Přesně',
  'Create group': 'Založit skupinu',
  'Join with a code': 'Připojit se kódem',
  'Everyone is even.': 'Všichni jsou vyrovnaní.',
  'Nothing to split yet.': 'Zatím není co dělit.',
  'Language and currency are separate settings.': 'Jazyk a měna jsou oddělená nastavení.',
  'Remove the ads': 'Odstranit reklamy',
  // Množné číslo: čeština má tři tvary. Bez přípony = tvar pro jednotné číslo.
  '{n} member': '{n} člen',
  '{n} members#few': '{n} členové',
  '{n} members#many': '{n} členů',
  '{n} expense': '{n} výdaj',
  '{n} expenses#few': '{n} výdaje',
  '{n} expenses#many': '{n} výdajů',
};

const DICT: Record<string, Dict> = {
  de: DE, ru: RU, fi: FI, ar: AR, th: TH, ja: JA, cs: CS,
};

/** Které jazyky už mají slovník (ostatní běží v angličtině). */
export function translatedLanguages(): string[] {
  return ['en', ...Object.keys(DICT)];
}
