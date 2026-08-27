// Obrazovky 30 a 30b — Opakované výdaje (Pro).
//
// Šablona jen POPISUJE, co a jak často se má opakovat. Vlastní výdaje z ní
// vytváří server (`runDueRecurring` při otevření skupiny) — klient je nikdy
// nezakládá sám. Funkce žije jen v cloudovém režimu; vstup v detailu skupiny
// je proto podmíněný `CLOUD_MODE`.
//
// ŽÁDNÁ REKLAMA: je to peněžní nastavení skupiny, ne feed.
//
// Split je zatím vždy „equal" — UI pro shares/exact tu schválně není.

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Button, Field, Label, Chip, Segmented, Stepper, Card, Row, Toggle, HardShadow } from '../components/ui';
import { Money, MoneySlot } from '../components/Money';
import { useApp } from '../store';
import { t, plural, fmtDate } from '../i18n';
import { parseAmount } from '../money';
import { currency, decimalsOf } from '../currencies';
import { CATEGORIES } from '../categories';
import { ME } from '../logic';
import { canUseRecurring } from '../entitlements';
import { SPACE, BORDER } from '../theme';
import type { Cadence } from '../types';

/**
 * Lidská věta o kadenci. Skládá se přes `t()` + `plural()`, nikdy
 * konkatenací — jazyky mají jiný slovosled i jiné množné číslo.
 */
function cadenceSentence(cadence: Cadence, count: number, anchorDay: number): string {
  if (cadence === 'weekly') return plural(count, 'Every week', 'Every {n} weeks');
  if (cadence === 'interval') return plural(count, 'Every day', 'Every {n} days');
  return plural(count, 'Every month on day {day}', 'Every {n} months on day {day}', { day: anchorDay });
}

function isoFromDate(ymd: string): string | null {
  const d = new Date(ymd + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ------------------------------------------------------- 30 · seznam / nabídka

export function Recurring() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const g = state.groups.find((x) => x.id === state.selectedGroup);
  if (!g) return <Screen title={t('RECURRING')} onBack={actions.goBack}><Text style={{ color: c.text }} /></Screen>;

  // Bez Pro: krátké vysvětlení a cesta na nabídku — stejně jako u exportu.
  if (!canUseRecurring(state.isPro)) {
    return (
      <Screen
        title={t('RECURRING')}
        onBack={actions.goBack}
        footer={<Button label={t('Unlock recurring with Pro')} kind="accent" onPress={() => actions.navigate('remove_ads')} />}
      >
        <Card fill={c.accent}>
          <Text style={[ty('caption'), { color: c.onAccent }]}>
            {t('A recurring expense adds itself on a schedule — rent, a subscription, the shared bill. Set it up once and it keeps posting.')}
          </Text>
        </Card>
      </Screen>
    );
  }

  const list = state.recurring[g.id] || [];

  return (
    <Screen
      title={t('RECURRING')}
      onBack={actions.goBack}
      footer={<Button label={t('Add recurring expense')} onPress={actions.startAddRecurring} />}
    >
      {list.length === 0 ? (
        <View style={{ borderWidth: BORDER.card, borderColor: c.border, borderStyle: 'dashed', padding: SPACE.xl }}>
          <Text style={[ty('bodySecondary'), { color: c.textMuted, textAlign: 'center' }]}>
            {t('No recurring expenses yet.')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 7 }}>
          {list.map((r) => (
            <Row key={r.id} onPress={() => actions.startEditRecurring(r.id)}>
              <View style={{ flex: 1, gap: 2, opacity: r.active ? 1 : 0.5 }}>
                <Text style={[ty('rowTitle'), { color: c.text }]}>{r.desc || t('Recurring expense')}</Text>
                <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                  {cadenceSentence(r.cadence, r.intervalCount, r.anchorDay ?? 1)}
                  {r.active
                    ? ' · ' + t('Next {date}', { date: fmtDate(r.nextRun) })
                    : ' · ' + t('Off')}
                </Text>
              </View>
              <MoneySlot>
                <Money amountMinor={r.amountMinor} currency={r.currency} />
              </MoneySlot>
              {r.active && (
                <View style={{ marginLeft: SPACE.sm }}>
                  {/* API umí šablonu jen VYPNOUT (`deactivateRecurring`), ne
                      znovu zapnout — přepínač jde proto jen jedním směrem. */}
                  <Toggle value onChange={() => actions.turnOffRecurring(r.id)} label={t('Turn off')} />
                </View>
              )}
            </Row>
          ))}
        </View>
      )}
    </Screen>
  );
}

// --------------------------------------------------------- 30b · formulář

export function RecurringForm() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const d = state.recurringDraft;
  const g = state.groups.find((x) => x.id === d.groupId);
  if (!g) return <Screen title={t('NEW RECURRING')} onBack={actions.goBack}><Text style={{ color: c.text }} /></Screen>;

  const cur = currency(d.currency);
  const amountMinor = parseAmount(d.amountText, d.currency);
  const nextRunIso = isoFromDate(d.nextRunDate);
  const canSave = amountMinor > 0 && d.parts.length > 0 && !!nextRunIso && !state.busy;

  return (
    <Screen
      title={d.id ? t('EDIT RECURRING') : t('NEW RECURRING')}
      onBack={actions.goBack}
      backLabel={t('Cancel')}
      footer={
        <Button
          label={d.id ? t('Save changes') : t('Save recurring expense')}
          onPress={actions.saveRecurring}
          disabled={!canSave}
        />
      }
    >
      {/* částka — měna je pevně měna skupiny */}
      <HardShadow offset={5}>
        <View style={{ backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, paddingVertical: 12, paddingHorizontal: 16 }}>
          <Label>{t('AMOUNT')}</Label>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACE.sm }}>
            <Field
              value={d.amountText}
              onChangeText={(v) => actions.setRecurringDraft({ amountText: v })}
              keyboardType="decimal-pad"
              placeholder={decimalsOf(d.currency) === 0 ? '0' : '0' + cur.dec + '00'}
              style={{ flex: 1 }}
            />
            <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 22, color: c.primary }}>{cur.code}</Text>
          </View>
        </View>
      </HardShadow>

      <Field
        value={d.desc}
        onChangeText={(v) => actions.setRecurringDraft({ desc: v })}
        placeholder={t('What was it?')}
      />

      <View style={{ gap: 6 }}>
        <Label>{t('PAID BY')}</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: SPACE.sm, paddingRight: SPACE.screen }}>
          {g.members.map((m) => (
            <Chip key={m} label={m === ME ? t('You') : m} active={d.payer === m}
              onPress={() => actions.setRecurringDraft({ payer: m })} />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 6 }}>
        <Label>{t('SPLIT WITH')}</Label>
        <View style={{ flexDirection: 'row', gap: SPACE.sm, flexWrap: 'wrap' }}>
          {g.members.map((m) => (
            <Chip key={m} label={m === ME ? t('You') : m} active={d.parts.includes(m)}
              onPress={() => actions.toggleRecurringPart(m)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Label>{t('CATEGORY')}</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: SPACE.sm, paddingRight: SPACE.screen }}>
          {CATEGORIES.map((cat) => (
            <Chip key={cat.key} label={cat.glyph + '  ' + t(cat.label)} active={d.category === cat.key}
              onPress={() => actions.setRecurringDraft({ category: cat.key })} />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 6 }}>
        <Label>{t('CADENCE')}</Label>
        <Segmented<Cadence>
          value={d.cadence}
          onChange={(v) => actions.setRecurringDraft({ cadence: v })}
          options={[
            { key: 'weekly', label: t('Weekly') },
            { key: 'monthly', label: t('Monthly') },
            { key: 'interval', label: t('Daily') },
          ]}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.md }}>
        <Label>{t('REPEAT EVERY')}</Label>
        <Stepper value={d.intervalCount} min={1} max={366}
          onChange={(v) => actions.setRecurringDraft({ intervalCount: v })} />
      </View>

      {d.cadence === 'monthly' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.md }}>
          <Label>{t('DAY OF MONTH')}</Label>
          <Stepper value={d.anchorDay} min={1} max={31}
            onChange={(v) => actions.setRecurringDraft({ anchorDay: v })} />
        </View>
      )}

      <Field
        label={t('FIRST RUN')}
        value={d.nextRunDate}
        onChangeText={(v) => actions.setRecurringDraft({ nextRunDate: v })}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        error={nextRunIso ? undefined : t('Enter a date as YYYY-MM-DD.')}
      />

      {/* čitelné shrnutí rozvrhu */}
      <Card fill={c.surfaceSunken}>
        <Text style={[ty('caption'), { color: c.text }]}>
          {cadenceSentence(d.cadence, d.intervalCount, d.anchorDay)}
          {nextRunIso ? ' · ' + t('Next {date}', { date: fmtDate(nextRunIso) }) : ''}
        </Text>
      </Card>
    </Screen>
  );
}
