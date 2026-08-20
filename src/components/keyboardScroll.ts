// Kontext, kterým si vstupní pole řekne obrazovce „odscrolluj na mě".
//
// Žije ve vlastním souboru schválně: `Screen.tsx` ho poskytuje a `ui.tsx`
// (kde bydlí `Field`) ho spotřebovává. Kdyby seděl v jednom z nich, vznikl
// by mezi nimi kruhový import — a ten se v Metru projeví až za běhu jako
// `undefined` v nejhorší možnou chvíli, ne při překladu.

import { createContext, useContext } from 'react';
import type { View } from 'react-native';

export type EnsureVisible = (node: React.RefObject<View | null>) => void;

export const KeyboardScrollContext = createContext<EnsureVisible>(() => undefined);

/**
 * Zajistí, že zaostřené pole je vidět nad klávesnicí.
 * Mimo `<Screen>` (třeba uvnitř dialogu) se tiše nic nestane.
 */
export function useEnsureVisible(): EnsureVisible {
  return useContext(KeyboardScrollContext);
}
