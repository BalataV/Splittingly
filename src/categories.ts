// Kategorie výdajů. Klíč je stabilní (jde do DB), popisek se překládá.
//
// `glyph` je DOČASNÁ náhrada za skutečnou ikonovou sadu — handoff říká, že
// emoji jsou placeholder a je potřeba nakreslit ikony ve stejném jazyce jako
// zbytek (tah 3 px, nulový poloměr). Až sada bude, mění se jen tenhle soubor.

export interface CategoryDef {
  key: string;
  label: string;   // anglicky, prochází přes t()
  glyph: string;   // placeholder
  color: string;   // barva pruhu ve statistikách
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'food',      label: 'Food',           glyph: '🍽', color: '#FFE500' },
  { key: 'drinks',    label: 'Drinks',         glyph: '🍺', color: '#1F49FF' },
  { key: 'transport', label: 'Transport',      glyph: '🚕', color: '#FF2D16' },
  { key: 'home',      label: 'Home',           glyph: '🏠', color: '#00A34A' },
  { key: 'tickets',   label: 'Tickets',        glyph: '🎟', color: '#FF7A00' },
  { key: 'shopping',  label: 'Shopping',       glyph: '🛍', color: '#00E5C0' },
  { key: 'stay',      label: 'Accommodation',  glyph: '🛏', color: '#C8A0FF' },
  { key: 'other',     label: 'Other',          glyph: '▣', color: '#5A5A5A' },
];

const BY_KEY: Record<string, CategoryDef> = {};
CATEGORIES.forEach((c) => { BY_KEY[c.key] = c; });

/** Def pro vlastní kategorii skupiny: klíč = název, placeholder glyf/barva z „other". */
function customDef(name: string): CategoryDef {
  return { key: name, label: name, glyph: BY_KEY.other.glyph, color: BY_KEY.other.color };
}

export function category(key: string): CategoryDef {
  if (BY_KEY[key]) return BY_KEY[key];
  // Neznámý klíč = vlastní kategorie skupiny (Pro). `expenses.category` je
  // volný text, ne cizí klíč — vykreslíme název tak, jak je uložený, ne „Other".
  const name = (key || '').trim();
  return name ? customDef(name) : BY_KEY.other;
}

/**
 * Výchozí kategorie + vlastní kategorie skupiny (Pro) v jednom seznamu pro
 * pickery. Vlastní kategorie mají klíč rovný trimnutému názvu; duplicity
 * (shoda s výchozím klíčem i mezi sebou) se zahodí. Řazení: výchozí první
 * v pevném pořadí, pak vlastní tak, jak přišly z API (to řadí podle názvu).
 *
 * `src/categories.ts` zůstává LIST — proto se sem nepředává `RawGroupCategory`,
 * jen `{ name }`. Volá ui-a-lokalizace z obrazovek, které mají `state.groupCategories`.
 */
export function mergedCategories(custom: { name: string }[] = []): CategoryDef[] {
  const seen = new Set(CATEGORIES.map((c) => c.key));
  const out: CategoryDef[] = [...CATEGORIES];
  for (const c of custom) {
    const name = c.name.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(customDef(name));
  }
  return out;
}
