// Obrazovka 14 — Přiložení účtenky. Inkoustový podklad, akcentní spoušť.
// Bez reklamy.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from '../components/ui';
import { useApp } from '../store';
import { t } from '../i18n';
import { SPACE, BORDER, INK, BONE } from '../theme';

export default function ReceiptCapture() {
  const { ty } = useUi();
  const { state, actions } = useApp();
  const insets = useSafeAreaInsets();
  const attached = state.draft.receipts.length;

  return (
    <View style={{ flex: 1, backgroundColor: INK, paddingTop: Math.max(insets.top, 12) + SPACE.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACE.screen, minHeight: 44, alignItems: 'center' }}>
        <Pressable onPress={actions.goBack} hitSlop={12}>
          <Text style={[ty('rowTitle'), { color: BONE }]}>✕ {t('Cancel')}</Text>
        </Pressable>
        <Pressable onPress={() => actions.attachReceipt('library')} hitSlop={12}>
          <Text style={[ty('rowTitle'), { color: '#FFE500' }]}>{t('Gallery')}</Text>
        </Pressable>
      </View>

      {/* hledáček */}
      <View style={{ flex: 1, margin: SPACE.screen, borderWidth: BORDER.card, borderColor: BONE, backgroundColor: '#2A2A2A' }}>
        <View style={{ position: 'absolute', top: 24, left: 24, right: 24, bottom: 24, borderWidth: BORDER.card, borderColor: '#FFE500', borderStyle: 'dashed' }} />
        <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#FFE500', paddingHorizontal: 6, paddingVertical: 3 }}>
          <Text style={[ty('label'), { color: INK }]}>{t('AUTO-CROP ON')}</Text>
        </View>
      </View>

      {attached > 0 && (
        <View style={{ paddingHorizontal: SPACE.screen, gap: SPACE.sm }}>
          <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
            {state.draft.receipts.slice(0, 4).map((url) => (
              <View key={url} style={{ width: 56, height: 56, backgroundColor: '#2A2A2A', borderWidth: BORDER.small, borderColor: BONE, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>🧾</Text>
              </View>
            ))}
          </View>
          <Text style={[ty('caption'), { color: '#9A9A9A' }]}>
            {t('{n} receipts already attached to this expense. Long-press to remove.', { n: attached })}
          </Text>
        </View>
      )}

      {/* spoušť + boční popisky ve FIXNÍCH sloupcích, aby se střed nehnul,
          i když překlad „Flash" nebo „Skip" povyroste */}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: SPACE.xl,
          paddingBottom: Math.max(insets.bottom, 12) + SPACE.lg,
          paddingTop: SPACE.lg,
        }}
      >
        <View style={{ width: 64 }}>
          <Text style={[ty('rowTitle'), { color: '#9A9A9A' }]}>{t('Flash')}</Text>
        </View>

        <Pressable onPress={() => actions.attachReceipt('camera')} accessibilityLabel={t('Take a photo')}>
          <View style={{ width: 74, height: 74, borderWidth: 4, borderColor: BONE, backgroundColor: '#FFE500', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 52, height: 52, backgroundColor: INK }} />
          </View>
        </Pressable>

        <View style={{ width: 64, alignItems: 'flex-end' }}>
          <Pressable onPress={actions.goBack} hitSlop={12}>
            <Text style={[ty('rowTitle'), { color: '#9A9A9A' }]}>{t('Skip')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
