// Obrazovka 19 — Historie aktivit.
//
// Nativní reklama, každý dvanáctý řádek. Pozná se podle toho, co NEMÁ:
// žádný avatar a žádná částka. Každý skutečný řádek nese obojí.

import React from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Avatar, Skeleton } from '../components/ui';
import { Money, MoneySlot } from '../components/Money';
import { NativeAdRow } from '../components/AdSlot';
import { useApp } from '../store';
import { t, fmtTime } from '../i18n';
import { buildActivity, groupByDay } from '../activity';
import { isNativeAdRow } from '../ads';
import { initial } from '../logic';
import { SPACE, BORDER } from '../theme';

export default function Activity() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const items = buildActivity(state.groups, state.expenses, state.payments);
  const days = groupByDay(items);

  let rowIndex = 0;

  return (
    <Screen title={t('ACTIVITY')}>
      {!items.length && (
        <View style={{ borderWidth: BORDER.card, borderColor: c.border, borderStyle: 'dashed', padding: SPACE.xl, alignItems: 'center' }}>
          <Text style={[ty('bodySecondary'), { color: c.textMuted, textAlign: 'center' }]}>
            {t('Nothing has happened yet. That is the quietest a group ever gets.')}
          </Text>
        </View>
      )}

      {days.map((day) => (
        <View key={day.key} style={{ gap: 6 }}>
          <Text style={[ty('label'), { color: c.textMuted, marginTop: SPACE.sm }]}>{day.label}</Text>
          {day.items.map((item) => {
            rowIndex += 1;
            const showAd = isNativeAdRow(rowIndex, state.isPro);
            return (
              <View key={item.id} style={{ gap: 6 }}>
                <View
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
                    borderWidth: BORDER.small, borderColor: c.border,
                    backgroundColor: c.surface, paddingVertical: 11, paddingHorizontal: 13,
                  }}
                >
                  <Avatar initial={initial(item.actor)} color="#101010" size={28} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[ty('caption'), { color: c.text }]}>{item.text}</Text>
                    <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                      {item.groupName} · {fmtTime(item.at)}
                    </Text>
                  </View>
                  {item.amountMinor !== null && item.currency && (
                    <MoneySlot minWidth={84}>
                      <Money amountMinor={item.amountMinor} currency={item.currency} />
                    </MoneySlot>
                  )}
                </View>
                {showAd && <NativeAdRow onUpgrade={() => actions.navigate('remove_ads')} />}
              </View>
            );
          })}
        </View>
      ))}

      {items.length > 0 && (
        <View style={{ gap: SPACE.sm, marginTop: SPACE.md, opacity: 0.75 }}>
          <Skeleton height={56} />
          <Text style={[ty('caption'), { color: c.textMuted, textAlign: 'center' }]}>{t('Loading older activity…')}</Text>
        </View>
      )}
    </Screen>
  );
}
