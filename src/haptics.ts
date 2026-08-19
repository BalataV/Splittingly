// Haptika. Stisk s tvrdým stínem má i fyzickou odezvu — je to podpis směru.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const on = Platform.OS !== 'web';

export function tap() {
  if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function press() {
  if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

/** Vyrovnaný dluh — jediné místo, kde si appka dovolí oslavnou vibraci. */
export function success() {
  if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function warn() {
  if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
}
