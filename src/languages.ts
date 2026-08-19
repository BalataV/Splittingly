// Seznam jazyků (obrazovka 23). Padesát položek → hledání je povinné, ne ozdoba.
//
// `script` řídí, jakým písmem se řádek vysází a jak vysoký bude — viz
// `scriptFont()` v typography.ts. `rtl` překlopí směr celého rozhraní.

export type ScriptName = 'latin' | 'cyrillic' | 'greek' | 'cjk' | 'thai' | 'devanagari' | 'arabic' | 'hebrew' | 'other';

export interface LanguageDef {
  code: string;
  endonym: string;   // jak si jazyk říká sám
  english: string;   // jak mu říká angličtina
  rtl: boolean;
  script: ScriptName;
}

export const LANGUAGES: LanguageDef[] = [
  { code: 'en',    endonym: 'English',        english: 'English',            rtl: false, script: 'latin' },
  { code: 'es',    endonym: 'Español',        english: 'Spanish',            rtl: false, script: 'latin' },
  { code: 'pt-BR', endonym: 'Português (BR)', english: 'Portuguese (Brazil)', rtl: false, script: 'latin' },
  { code: 'pt',    endonym: 'Português',      english: 'Portuguese',         rtl: false, script: 'latin' },
  { code: 'fr',    endonym: 'Français',       english: 'French',             rtl: false, script: 'latin' },
  { code: 'de',    endonym: 'Deutsch',        english: 'German',             rtl: false, script: 'latin' },
  { code: 'it',    endonym: 'Italiano',       english: 'Italian',            rtl: false, script: 'latin' },
  { code: 'nl',    endonym: 'Nederlands',     english: 'Dutch',              rtl: false, script: 'latin' },
  { code: 'pl',    endonym: 'Polski',         english: 'Polish',             rtl: false, script: 'latin' },
  { code: 'cs',    endonym: 'Čeština',        english: 'Czech',              rtl: false, script: 'latin' },
  { code: 'sk',    endonym: 'Slovenčina',     english: 'Slovak',             rtl: false, script: 'latin' },
  { code: 'hu',    endonym: 'Magyar',         english: 'Hungarian',          rtl: false, script: 'latin' },
  { code: 'ro',    endonym: 'Română',         english: 'Romanian',           rtl: false, script: 'latin' },
  { code: 'hr',    endonym: 'Hrvatski',       english: 'Croatian',           rtl: false, script: 'latin' },
  { code: 'sr',    endonym: 'Српски',         english: 'Serbian',            rtl: false, script: 'cyrillic' },
  { code: 'sl',    endonym: 'Slovenščina',    english: 'Slovenian',          rtl: false, script: 'latin' },
  { code: 'bg',    endonym: 'Български',      english: 'Bulgarian',          rtl: false, script: 'cyrillic' },
  { code: 'uk',    endonym: 'Українська',     english: 'Ukrainian',          rtl: false, script: 'cyrillic' },
  { code: 'ru',    endonym: 'Русский',        english: 'Russian',            rtl: false, script: 'cyrillic' },
  { code: 'el',    endonym: 'Ελληνικά',       english: 'Greek',              rtl: false, script: 'greek' },
  { code: 'tr',    endonym: 'Türkçe',         english: 'Turkish',            rtl: false, script: 'latin' },
  { code: 'sv',    endonym: 'Svenska',        english: 'Swedish',            rtl: false, script: 'latin' },
  { code: 'da',    endonym: 'Dansk',          english: 'Danish',             rtl: false, script: 'latin' },
  { code: 'nb',    endonym: 'Norsk bokmål',   english: 'Norwegian',          rtl: false, script: 'latin' },
  { code: 'fi',    endonym: 'Suomi',          english: 'Finnish',            rtl: false, script: 'latin' },
  { code: 'et',    endonym: 'Eesti',          english: 'Estonian',           rtl: false, script: 'latin' },
  { code: 'lv',    endonym: 'Latviešu',       english: 'Latvian',            rtl: false, script: 'latin' },
  { code: 'lt',    endonym: 'Lietuvių',       english: 'Lithuanian',         rtl: false, script: 'latin' },
  { code: 'is',    endonym: 'Íslenska',       english: 'Icelandic',          rtl: false, script: 'latin' },
  { code: 'ca',    endonym: 'Català',         english: 'Catalan',            rtl: false, script: 'latin' },
  { code: 'gl',    endonym: 'Galego',         english: 'Galician',           rtl: false, script: 'latin' },
  { code: 'eu',    endonym: 'Euskara',        english: 'Basque',             rtl: false, script: 'latin' },
  { code: 'zh-Hans', endonym: '简体中文',      english: 'Chinese (Simplified)',  rtl: false, script: 'cjk' },
  { code: 'zh-Hant', endonym: '繁體中文',      english: 'Chinese (Traditional)', rtl: false, script: 'cjk' },
  { code: 'ja',    endonym: '日本語',          english: 'Japanese',           rtl: false, script: 'cjk' },
  { code: 'ko',    endonym: '한국어',          english: 'Korean',             rtl: false, script: 'cjk' },
  { code: 'th',    endonym: 'ไทย',            english: 'Thai',               rtl: false, script: 'thai' },
  { code: 'vi',    endonym: 'Tiếng Việt',     english: 'Vietnamese',         rtl: false, script: 'latin' },
  { code: 'id',    endonym: 'Bahasa Indonesia', english: 'Indonesian',       rtl: false, script: 'latin' },
  { code: 'ms',    endonym: 'Bahasa Melayu',  english: 'Malay',              rtl: false, script: 'latin' },
  { code: 'fil',   endonym: 'Filipino',       english: 'Filipino',           rtl: false, script: 'latin' },
  { code: 'hi',    endonym: 'हिन्दी',            english: 'Hindi',              rtl: false, script: 'devanagari' },
  { code: 'mr',    endonym: 'मराठी',           english: 'Marathi',            rtl: false, script: 'devanagari' },
  { code: 'bn',    endonym: 'বাংলা',           english: 'Bengali',            rtl: false, script: 'other' },
  { code: 'ta',    endonym: 'தமிழ்',           english: 'Tamil',              rtl: false, script: 'other' },
  { code: 'ar',    endonym: 'العربية',         english: 'Arabic',             rtl: true,  script: 'arabic' },
  { code: 'he',    endonym: 'עברית',          english: 'Hebrew',             rtl: true,  script: 'hebrew' },
  { code: 'fa',    endonym: 'فارسی',          english: 'Persian',            rtl: true,  script: 'arabic' },
  { code: 'ur',    endonym: 'اردو',           english: 'Urdu',               rtl: true,  script: 'arabic' },
  { code: 'sw',    endonym: 'Kiswahili',      english: 'Swahili',            rtl: false, script: 'latin' },
];

const BY_CODE: Record<string, LanguageDef> = {};
LANGUAGES.forEach((l) => { BY_CODE[l.code] = l; });

export function language(code: string): LanguageDef {
  return BY_CODE[code] || BY_CODE.en;
}

export function isRTL(code: string): boolean {
  return language(code).rtl;
}

export function scriptOf(code: string): ScriptName {
  return language(code).script;
}

/** Hledání v seznamu — endonym i anglický název, bez ohledu na diakritiku. */
export function searchLanguages(query: string): LanguageDef[] {
  const q = norm(query);
  if (!q) return LANGUAGES;
  return LANGUAGES.filter((l) => norm(l.endonym).includes(q) || norm(l.english).includes(q) || l.code.includes(q));
}

function norm(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
