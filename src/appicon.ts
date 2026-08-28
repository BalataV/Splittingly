// Přepnutí ikony aplikace (Pro, batch 2).
//
// STAV: STUB. `expo-alternate-app-icons` UŽ je v `package.json` (přidal
// vydani-a-provoz). Do zapojení nativní vrstvy no-op, aby `store.tsx` mohlo
// akci `setAppIcon` volat už teď.
//
// TODO(vydani-a-provoz): `setIcon(key)` → API balíku (`setAlternateAppIcon`),
//   `key === null` = zpět na výchozí. `supportsAltIcons()` z platformy.
//   OVĚŘIT Android alias podporu v `expo-alternate-app-icons@8` — když
//   chybí, doplnit lokální `plugins/withAndroidAltIcons.js` (viz rozhodnutí
//   architekta #2). Guardovat `require` jako `src/admob.ts`.

/** Umí tahle platforma/build přepínat ikonu za běhu? Zatím vždy `false`. */
export function supportsAltIcons(): boolean {
  return false;
}

/** Přepne ikonu na `key` (`null` = výchozí). Zatím no-op. */
export async function setIcon(key: string | null): Promise<void> {
  void key;
}
