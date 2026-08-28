// Ověření identity pro zámek aplikace (biometrie / kód zařízení).
//
// Napojeno na `expo-local-authentication@17.0.9`. `require` je lazy a v
// try/catch — stejně jako `src/admob.ts` — protože balík při importu sáhne
// do nativního registru a v Expo Go / bez nativní části by shodil celý
// modul. Reálně se dá vyzkoušet až z dev/produkčního buildu; Expo Go zámek
// nemá, takže tam `canAuthenticate()` vrací `false` a toggle se v Settings
// neukáže.
//
// FAIL-OPEN: když se ověřit NEDÁ (chybí most, výjimka), `authenticate()`
// vrací `true`. Zámek aplikace je pohodlí, ne kryptografická hranice — za
// ním se neukládá žádné tajemství — takže uživatele nikdy nesmí zamknout
// venku.

import Constants, { ExecutionEnvironment } from 'expo-constants';

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type LocalAuth = typeof import('expo-local-authentication');

let mod: LocalAuth | null = null;
let tried = false;

function getModule(): LocalAuth | null {
  if (IS_EXPO_GO) return null;
  if (tried) return mod;
  tried = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('expo-local-authentication') as LocalAuth;
  } catch {
    mod = null;
  }
  return mod;
}

/** Umí tohle zařízení ověřit identitu (zapnutá biometrie nebo kód zařízení)? */
export async function canAuthenticate(): Promise<boolean> {
  const la = getModule();
  if (!la) return false;
  try {
    const [hardware, enrolled] = await Promise.all([
      la.hasHardwareAsync(),
      la.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch (e) {
    console.warn('[applock] zjištění dostupnosti selhalo:', String(e));
    return false;
  }
}

/**
 * Vyžádá si ověření identity. `reason` je text do systémového dialogu.
 * `disableDeviceFallback: false` → po neúspěchu biometrie nabídne kód zařízení.
 * Vrací `true` při úspěchu i vždy, když se ověřit nedá (FAIL-OPEN, viz hlavička).
 */
export async function authenticate(reason: string): Promise<boolean> {
  const la = getModule();
  if (!la) return true;
  try {
    const result = await la.authenticateAsync({
      promptMessage: reason,
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (e) {
    console.warn('[applock] ověření selhalo:', String(e));
    return true;
  }
}
