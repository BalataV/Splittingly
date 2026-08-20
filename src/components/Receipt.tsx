// Náhled účtenky a její prohlížeč na celou obrazovku.
//
// Dřív se místo fotky kreslilo emoji 🧾 — uživatel tedy neviděl, co vlastně
// vyfotil, a nemohl si to zkontrolovat. U appky, kde je účtenka DŮKAZ,
// je to zásadní: nečitelná fotka se musí poznat hned, ne až při hádce.

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from './ui';
import { t } from '../i18n';
import { SPACE, BORDER, INK, BONE } from '../theme';

/**
 * Čtvercový náhled. Po ťuknutí otevře fotku přes celou obrazovku,
 * po podržení nabídne odebrání (pokud je `onRemove`).
 */
export function ReceiptThumb({ uri, size = 56, onRemove }: {
  uri: string; size?: number; onRemove?: () => void;
}) {
  const { c } = useUi();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        onLongPress={onRemove}
        accessibilityRole="imagebutton"
        accessibilityLabel={t('Receipt')}
      >
        <View style={{
          width: size, height: size,
          borderWidth: BORDER.small, borderColor: c.border,
          backgroundColor: c.surfaceSunken,
          overflow: 'hidden',
        }}>
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            // Účtenka je vždycky ta samá fotka — cache šetří data i čekání.
            cachePolicy="memory-disk"
            transition={120}
          />
        </View>
      </Pressable>

      <ReceiptViewer uri={uri} visible={open} onClose={() => setOpen(false)} onRemove={onRemove} />
    </>
  );
}

/** Fotka přes celou obrazovku na inkoustovém podkladu. */
export function ReceiptViewer({ uri, visible, onClose, onRemove }: {
  uri: string; visible: boolean; onClose: () => void; onRemove?: () => void;
}) {
  const { ty } = useUi();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: INK }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: Math.max(insets.top, 12) + SPACE.sm,
          paddingHorizontal: SPACE.screen, paddingBottom: SPACE.md,
        }}>
          <Pressable onPress={onClose} hitSlop={14} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={[ty('rowTitle'), { color: BONE }]}>✕ {t('Close')}</Text>
          </Pressable>
          {!!onRemove && (
            <Pressable
              onPress={() => { onRemove(); onClose(); }}
              hitSlop={14}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={[ty('rowTitle'), { color: '#FF5C45' }]}>{t('Remove')}</Text>
            </Pressable>
          )}
        </View>

        <Image
          source={{ uri }}
          style={{ width, height: height - 120 }}
          // `contain`, ne `cover` — u účtenky jde o čitelnost každého řádku,
          // takže se nesmí nic oříznout.
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
    </Modal>
  );
}

/** Dlaždice „přidat účtenku" — přerušovaný okraj značí volitelnou akci. */
export function ReceiptAdd({ size = 56, onPress, label }: {
  size?: number; onPress: () => void; label?: string;
}) {
  const { c, ty } = useUi();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label || t('Attach receipt')}>
      <View style={{
        width: size, height: size,
        borderWidth: BORDER.small, borderColor: c.border, borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <Text style={{ fontSize: 20 }}>📷</Text>
        {!!label && <Text style={[ty('label'), { color: c.textMuted, fontSize: 9 }]}>{label}</Text>}
      </View>
    </Pressable>
  );
}
