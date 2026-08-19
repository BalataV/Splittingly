// Kurzy měn — POUZE pro orientační řádek „≈ ve tvojí měně".
//
// DŮLEŽITÉ: kurz nikdy nevstupuje do výpočtu dluhu. Skupina, která platila
// v bahtech, dluží v bahtech. Přepočet je popisek, ne účetnictví — jinak by
// se dluh měnil podle dne, kdy se na něj člověk podívá.
//
// Zdroj: frankfurter.app (ECB, zdarma, bez klíče). Když nedojde odpověď,
// řádek s přepočtem se prostě neukáže. Žádná náhradní čísla.

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@splittingly/fx-v1';
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // půl dne stačí; kurzy ECB se mění jednou denně

interface FxCache { base: string; rates: Record<string, number>; at: number; }

export async function loadRates(base: string): Promise<Record<string, number> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const c: FxCache = JSON.parse(raw);
      if (c.base === base && Date.now() - c.at < MAX_AGE_MS) return c.rates;
    }
  } catch {
    // poškozená cache není důvod k pádu — načteme znovu
  }
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const rates = { ...(json.rates || {}), [base]: 1 } as Record<string, number>;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ base, rates, at: Date.now() } as FxCache));
    return rates;
  } catch {
    return null;
  }
}

/**
 * Orientační přepočet mezi měnami. `null` znamená „nevím" a volající pak
 * řádek vůbec nevykreslí — radši nic než vymyšlené číslo.
 */
export function convert(
  amountMinor: number,
  from: string,
  to: string,
  rates: Record<string, number> | null,
  fromDecimals: number,
  toDecimals: number,
): number | null {
  if (!rates || from === to) return from === to ? amountMinor : null;
  const rFrom = rates[from];
  const rTo = rates[to];
  if (!rFrom || !rTo) return null;
  const units = amountMinor / Math.pow(10, fromDecimals);
  const converted = (units / rFrom) * rTo;
  return Math.round(converted * Math.pow(10, toDecimals));
}
