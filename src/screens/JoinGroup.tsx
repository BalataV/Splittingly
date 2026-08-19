// Obrazovka 10 — Připojení ke skupině kódem nebo odkazem. Bez reklamy.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Field, Button, Card, Row, Label } from '../components/ui';
import { useApp } from '../store';
import { t } from '../i18n';
import { SPACE, BORDER } from '../theme';

export default function JoinGroup() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const code = state.joinCodeInput;
  const preview = state.joinPreview;

  return (
    <Screen
      title={t('JOIN A\nGROUP')}
      onBack={actions.goBack}
      backLabel={t('Cancel')}
      footer={
        preview
          ? <Button label={t('Join {name}', { name: preview.groupName })} onPress={() => actions.finishJoin({})} disabled={state.busy} />
          : <Button label={t('Check the code')} onPress={() => actions.joinByCode()} disabled={code.length < 6 || state.busy} />
      }
    >
      <Text style={[ty('bodySecondary'), { color: c.textMuted }]}>
        {t('Enter the six-character code someone sent you, or open their invite link.')}
      </Text>

      <View style={{ flexDirection: 'row', gap: 7 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const filled = i < code.length;
          const active = i === code.length;
          return (
            <View
              key={i}
              style={{
                flex: 1, aspectRatio: 1, borderWidth: BORDER.card,
                borderColor: active ? c.primary : c.border,
                backgroundColor: filled ? c.surface : c.surfaceSunken,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 22, color: active ? c.primary : c.text }}>
                {code[i] || ''}
              </Text>
            </View>
          );
        })}
      </View>

      <Field
        label={t('CODE')}
        value={code}
        onChangeText={(v) => actions.patch({ joinCodeInput: v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6), joinPreview: null })}
        autoCapitalize="characters"
        placeholder="AB3K9Z"
      />

      {!!preview && (
        <Card offset={5}>
          <View style={{ flexDirection: 'row', gap: SPACE.md, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, backgroundColor: preview.coverColor, borderWidth: BORDER.small, borderColor: c.border }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[ty('rowTitle'), { color: c.text }]}>{preview.groupName}</Text>
              <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                {preview.members.map((m) => m.name).join(', ')} · {preview.currency}
              </Text>
            </View>
          </View>

          {/* Volné jméno si můžu zabrat — tím se historie výdajů napojí na můj účet. */}
          {preview.members.some((m) => !m.claimed) && (
            <View style={{ gap: 6, marginTop: SPACE.md }}>
              <Label>{t('ARE YOU ONE OF THEM?')}</Label>
              {preview.members.filter((m) => !m.claimed).map((m) => (
                <Row key={m.name} onPress={() => actions.finishJoin({ claimName: m.name })}>
                  <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>{m.name}</Text>
                  <Text style={{ color: c.primary, fontSize: 16 }}>›</Text>
                </Row>
              ))}
            </View>
          )}
        </Card>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.md, marginVertical: SPACE.sm }}>
        <View style={{ flex: 1, height: BORDER.card, backgroundColor: c.border }} />
        <Text style={[ty('caption'), { color: c.textMuted }]}>{t('— or —')}</Text>
        <View style={{ flex: 1, height: BORDER.card, backgroundColor: c.border }} />
      </View>

      <Button label={t('Paste an invite link')} kind="plain" onPress={() => actions.showToast(t('Open the link from your chat app.'))} />
    </Screen>
  );
}
