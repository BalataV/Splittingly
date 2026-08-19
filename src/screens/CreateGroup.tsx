// Obrazovka 09 — Založení skupiny. Bez reklamy.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Field, Button, Chip, Label, Row } from '../components/ui';
import { MascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { t } from '../i18n';
import { quipFor } from '../quips';
import { currency } from '../currencies';
import { COVER_COLORS, SPACE, BORDER } from '../theme';

export default function CreateGroup() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const cur = currency(state.newGroupCurrency);

  return (
    <Screen
      title={t('NEW\nGROUP')}
      onBack={actions.goBack}
      backLabel={t('Cancel')}
      footer={<Button label={t('Create group')} onPress={actions.createGroup} disabled={state.busy || !state.newGroupName.trim()} />}
    >
      <Field label={t('NAME')} value={state.newGroupName} onChangeText={(v) => actions.patch({ newGroupName: v })}
        placeholder={t('Barcelona Trip')} autoCapitalize="words" />

      <Label>{t('COVER')}</Label>
      <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
        {COVER_COLORS.map((col) => {
          const selected = state.newGroupColor === col;
          return (
            <Pressable key={col} onPress={() => actions.patch({ newGroupColor: col })} accessibilityLabel={t('Cover colour')}>
              <View style={{ position: 'relative' }}>
                {selected && <View style={{ position: 'absolute', top: 3, left: 3, right: -3, bottom: -3, backgroundColor: c.shadow }} />}
                <View style={{ width: 52, height: 52, backgroundColor: col, borderWidth: BORDER.card, borderColor: c.border }} />
              </View>
            </Pressable>
          );
        })}
        {/* fotka jako obálka — přerušovaný okraj značí volitelnou možnost */}
        <View style={{ width: 52, height: 52, borderWidth: BORDER.card, borderColor: c.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20 }}>📷</Text>
        </View>
      </View>

      <Label>{t('CURRENCY')}</Label>
      <Row border={BORDER.card} onPress={() => actions.navigate('currency')}>
        <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>
          {cur.code} — {t(cur.name)}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 18 }}>›</Text>
      </Row>

      <Label>{t('MEMBERS')}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm }}>
        <Chip label={t('You')} active />
        {state.newGroupMembers.map((n) => (
          <Chip key={n} label={n} onRemove={() => actions.removeDraftMember(n)} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-end' }}>
        <Field
          value={state.newMemberInput}
          onChangeText={(v) => actions.patch({ newMemberInput: v })}
          placeholder={t('Add a name')}
          autoCapitalize="words"
          style={{ flex: 1 }}
        />
        <Button label={t('Add')} kind="plain" onPress={actions.addDraftMember} offset={0} style={{ width: 90 }} />
      </View>

      <Text style={[ty('caption'), { color: c.textMuted }]}>
        {t('You can also send an invite link after the group exists.')}
      </Text>

      {state.mascotsOn && <MascotStrip who="analyst" text={quipFor('welcome', 'analyst', true) || ''} />}
    </Screen>
  );
}
