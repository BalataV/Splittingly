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

export function category(key: string): CategoryDef {
  return BY_KEY[key] || BY_KEY.other;
}
