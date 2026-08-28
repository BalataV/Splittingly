// Obrazovka 31 — Vlastní kategorie skupiny (Pro).
//
// Kategorie je SDÍLENÁ: výdaj s ní vidí každý člen. VYTVOŘIT vlastní smí jen
// Pro; free má všechny výchozí kategorie z `categories.ts` a vidí custom od
// Pro členů. Přejmenovat / smazat smí kterýkoli člen (RLS to tak pouští) —
// stejný „členové si věří" model jako u výdajů.
//
// ŽÁDNÁ REKLAMA: nastavení skupiny, ne feed.
//
// Přidání a přejmenování řeší lokální stav TÉHLE obrazovky (Field), ne další
// ScreenName ani globální `state.dialog`.

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Button, Field, Row } from '../components/ui';
import { useApp } from '../store';
import { t } from '../i18n';
import { canUseCustomCategories } from '../entitlements';
import { SPACE, BORDER } from '../theme';

export default function GroupCategories() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const g = state.groups.find((x) => x.id === state.selectedGroup);

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);

  if (!g) return <Screen title={t('CATEGORIES')} onBack={actions.goBack}><Text style={{ color: c.text }} /></Screen>;

  const list = state.groupCategories[g.id] || [];
  const canAdd = canUseCustomCategories(state.isPro);

  const add = async () => {
    const v = name.trim();
    if (!v || busy) return;
    if (!canAdd) { actions.navigate('remove_ads'); return; }
    setBusy(true);
    try {
      await actions.addGroupCategory(v);
      setName('');
    } finally {
      setBusy(false);
    }
  };

  const saveRename = async (id: string) => {
    const v = editName.trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      await actions.renameGroupCategory(id, v);
      setEditingId(null);
      setEditName('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('CATEGORIES')} onBack={actions.goBack}>
      <Text style={[ty('caption'), { color: c.textMuted }]}>
        {t('Custom categories are shared with everyone in the group. The default categories are always available.')}
      </Text>

      <View style={{ flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-end' }}>
        <Field
          value={name}
          onChangeText={setName}
          placeholder={t('New category')}
          autoCapitalize="sentences"
          style={{ flex: 1 }}
        />
        <Button label={t('Add')} kind="plain" offset={0} onPress={add} disabled={busy || !name.trim()} style={{ width: 90 }} />
      </View>
      {!canAdd && (
        <Text style={[ty('caption'), { color: c.textMuted }]}>
          {t('Adding your own categories is a Pro feature.')}
        </Text>
      )}

      {list.length === 0 ? (
        <View style={{ borderWidth: BORDER.card, borderColor: c.border, borderStyle: 'dashed', padding: SPACE.xl }}>
          <Text style={[ty('bodySecondary'), { color: c.textMuted, textAlign: 'center' }]}>
            {t('No custom categories yet.')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 7 }}>
          {list.map((cat) =>
            editingId === cat.id ? (
              <View key={cat.id} style={{ flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-end' }}>
                <Field
                  value={editName}
                  onChangeText={setEditName}
                  autoCapitalize="sentences"
                  style={{ flex: 1 }}
                />
                <Button label={t('Save')} kind="plain" offset={0} onPress={() => saveRename(cat.id)} disabled={busy || !editName.trim()} style={{ width: 80 }} />
                <Button label={t('Cancel')} kind="plain" offset={0} onPress={() => { setEditingId(null); setEditName(''); }} style={{ width: 80 }} />
              </View>
            ) : (
              <Row key={cat.id} onPress={() => { setEditingId(cat.id); setEditName(cat.name); }}>
                <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>{cat.name}</Text>
                <Button
                  label={t('Delete')}
                  kind="plain"
                  offset={0}
                  onPress={() => actions.deleteGroupCategory(cat.id)}
                  disabled={busy}
                  style={{ width: 90 }}
                />
              </Row>
            ),
          )}
        </View>
      )}
    </Screen>
  );
}
