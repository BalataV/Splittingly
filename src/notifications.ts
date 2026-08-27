// Push notifikace přes Expo.
//
// Odesílá se z klienta na Expo push API — pro appku téhle velikosti je to
// v pořádku a ušetří to serverovou část. Až bude potřeba plánované zprávy
// (týdenní souhrn), přesune se to do Supabase Edge Function; rozhraní tady
// zůstane stejné.

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { pushApi } from './api';
import type { NotifPrefs } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Vyžádá povolení a uloží token. Vrací token, nebo null (uživatel odmítl). */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulátor push neumí
  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Splittingly',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#FFE500',
      });
    }

    const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    await pushApi.savePushToken(token);
    return token;
  } catch {
    return null;
  }
}

/** Jsme v tichých hodinách? Notifikace se pak neposílá. */
export function inQuietHours(prefs: NotifPrefs, now = new Date()): boolean {
  const h = now.getHours();
  const { quietFrom, quietTo } = prefs;
  if (quietFrom === quietTo) return false;
  // interval přes půlnoc (23 → 8) i běžný (1 → 6)
  return quietFrom > quietTo ? h >= quietFrom || h < quietTo : h >= quietFrom && h < quietTo;
}

/** Pošle zprávu ostatním členům skupiny. Chyby polykáme — push není kritická cesta. */
export async function notifyGroup(groupId: string, title: string, body: string): Promise<void> {
  try {
    const tokens = await pushApi.groupPushTokens(groupId);
    if (!tokens.length) return;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(tokens.map((to) => ({ to, title, body, sound: null }))),
    });
  } catch (e) {
    // notifikace, která nedorazí, nesmí shodit uložení výdaje
    console.warn('[notifications] odeslání push zprávy skupině selhalo:', String(e));
  }
}
