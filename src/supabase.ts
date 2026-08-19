// Klient pro Supabase (cloudová databáze, přihlášení, úložiště fotek).
//
// Klíče se NEPÍŠOU sem do kódu — vyplň je v `app.json` → "extra":
//   "supabaseUrl": "https://xxxx.supabase.co",
//   "supabaseAnonKey": "sb_publishable_…"
// (anon klíč je veřejný a bezpečný do appky — data chrání pravidla RLS v DB.)
//
// Dokud klíče nevyplníš, appka běží v LOKÁLNÍM režimu (data jen v telefonu).
// Nic se tím nerozbije, jen se nic nesdílí.

import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Typ odkazu, kterým uživatel přišel (recovery / invite / …).
// MUSÍ se přečíst hned při načtení modulu — klient hash z adresy po zpracování
// smaže. Supabase navíc z `redirect_to` zahazuje query string, takže vlastní
// parametr se sem nikdy nedostane a tohle je jediný spolehlivý způsob, jak
// poznat příchod z odkazu na obnovu hesla.
export const initialAuthType: string | null = (() => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search || '');
    return hash.get('type') || query.get('type') || null;
  } catch {
    return null;
  }
})();

/** Jednorázový token z e-mailového odkazu (`?token_hash=…&type=recovery`). */
export const initialAuthTokenHash: string | null = (() => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search || '').get('token_hash');
  } catch {
    return null;
  }
})();

/** Chyba z odkazu (vypršel / už použitý) — Supabase ji vrací v hashi. */
export const initialAuthError: string | null = (() => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    return hash.get('error_description') || hash.get('error') || null;
  } catch {
    return null;
  }
})();

const extra = (Constants.expoConfig?.extra || {}) as Record<string, string>;
const SUPABASE_URL = extra.supabaseUrl || '';
const SUPABASE_ANON_KEY = extra.supabaseAnonKey || '';

export { SUPABASE_URL, SUPABASE_ANON_KEY };
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// V cloudovém režimu je klient k dispozici; v lokálním se API vrstva nevolá.
// Typujeme jako SupabaseClient (ne null), aby API soubory nemusely všude řešit null.
export const supabase = (isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Na webu necháme klienta zpracovat návrat z OAuthu z URL (?code=…);
        // v nativní appce řešíme redirect ručně přes WebBrowser.
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null) as SupabaseClient;
