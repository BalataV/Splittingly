// Obrazovka 21 — Sdílecí kartička „kdo komu dluží" pro sociální sítě.
//
// Jediné místo, kde je povolená celoobrazovková reklama — a to AŽ PO sdílení,
// jednou za spuštění. Nikdy při startu a nikdy po vyrovnání dluhu.
//
// Nic neopustí appku, dokud uživatel nevybere cíl sdílení. Jména se dají
// zkrátit na iniciály a částky úplně skrýt.

import React, { useRef, useState } from 'react';
import { View, Text, Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Screen from '../components/Screen';
import { useUi, Button, Chip, HardShadow, Rule } from '../components/ui';
import { Money } from '../components/Money';
import Mascot, { DualMascotStrip } from '../components/Mascot';
import { useApp } from '../store';
import { t } from '../i18n';
import { quipFor } from '../quips';
import { transfersFor, initial, ME } from '../logic';
import { mayShowInterstitial, markInterstitialShown } from '../ads';
import { SPACE, BORDER } from '../theme';

export default function ShareCard() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const shotRef = useRef<View>(null);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [initialsOnly, setInitialsOnly] = useState(false);
  const [style, setStyle] = useState<'yellow' | 'blue' | 'ink'>('yellow');

  const g = state.groups.find((x) => x.id === state.selectedGroup) || state.groups[0];
  if (!g) return <Screen title={t('SHARE')} onBack={actions.goBack}><Text style={{ color: c.text }} /></Screen>;

  const expenses = state.expenses[g.id] || [];
  const transfers = transfersFor(g, expenses, state.payments[g.id]);
  const settled = transfers.length === 0;

  const bg = style === 'yellow' ? c.accent : style === 'blue' ? c.primary : c.text;
  const fg = style === 'yellow' ? c.onAccent : style === 'blue' ? c.onPrimary : c.bg;

  const name = (n: string) => {
    const label = n === ME ? t('You') : n;
    return initialsOnly ? initial(label) : label;
  };

  const doShare = async () => {
    try {
      const uri = await captureRef(shotRef, { format: 'png', quality: 1 });

      // `Share.share({ url })` z React Native umí obrázek POUZE na iOS —
      // na Androidu tichý spolkne a odešle jen text, takže uživateli přijde
      // holá věta bez kartičky. `expo-sharing` posílá skutečný soubor na
      // obou platformách a systémový dialog pak nabídne i uložení.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${g.name} — Splittingly`,
          UTI: 'public.png',
        });
      } else if (Platform.OS === 'ios') {
        await Share.share({ url: uri });
      } else {
        actions.showToast(t('Sharing is not available on this device.'));
        return;
      }

      if (mayShowInterstitial('share', state.isPro)) {
        markInterstitialShown();
        // Skutečný interstitial se doplní se SDK; tady je jen záznam, že padl.
      }
    } catch {
      actions.showToast(t('Could not create the image.'));
    }
  };

  return (
    <Screen
      title={t('SHARE CARD')}
      onBack={actions.goBack}
      backLabel={t('Close')}
      footer={<Button label={t('Share image')} kind="accent" onPress={doShare} />}
    >
      <Text style={[ty('label'), { color: c.textMuted }]}>{t('PREVIEW · 1080×1080')}</Text>

      <HardShadow offset={6}>
        <View ref={shotRef} collapsable={false} style={{ aspectRatio: 1 }}>
          <View style={{ flex: 1, backgroundColor: bg, borderWidth: BORDER.card, borderColor: c.border, padding: 18, gap: SPACE.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 15, lineHeight: 16, color: fg, flex: 1 }}>
                {g.name.toUpperCase()}
              </Text>
              <View style={{ width: 24, height: 24, backgroundColor: c.accent, borderWidth: 2, borderColor: c.border }} />
            </View>

            <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 30, lineHeight: 29, color: fg }}>
              {settled ? t('WE ARE\nALL EVEN.') : t('WHO OWES\nWHOM.')}
            </Text>

            <Rule />

            <View style={{ flex: 1, gap: 6 }}>
              {(settled ? [] : transfers.slice(0, 4)).map((tr) => (
                <View key={tr.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: SPACE.sm }}>
                  <Text style={[ty('rowTitle'), { color: fg, flex: 1 }]}>
                    {name(tr.from)} → {name(tr.to)}
                  </Text>
                  {!hideAmounts && <Money amountMinor={tr.amountMinor} currency={tr.currency} color={fg} />}
                </View>
              ))}
              {settled && (
                <Text style={[ty('bodySecondary'), { color: fg }]}>
                  {t('{n} expenses · 0 arguments', { n: expenses.length })}
                </Text>
              )}
            </View>

            {/* Patička s oběma maskoty — jedno z pěti míst, kde jsou spolu. */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACE.sm }}>
              <Text style={[ty('label'), { color: fg, flex: 1, fontSize: 10.5 }]}>
                {t('{n} expenses', { n: expenses.length })} / {g.members.length} {t('people')} / 0 {t('arguments')}
              </Text>
              <Mascot who="closer" size={52} />
              <Mascot who="analyst" size={52} />
            </View>
          </View>
        </View>
      </HardShadow>

      {/* Komentář MIMO zachycovanou kartu — do sdíleného obrázku se nedostane,
          je to jen doprovod pro appku. Jedno z pěti míst, kde jsou spolu. */}
      <DualMascotStrip
        closer={quipFor('share', 'closer', true) || ''}
        analyst={quipFor('share', 'analyst', true) || ''}
      />

      <View style={{ flexDirection: 'row', gap: SPACE.sm, flexWrap: 'wrap' }}>
        <Chip label={t('Yellow')} active={style === 'yellow'} onPress={() => setStyle('yellow')} />
        <Chip label={t('Blue')} active={style === 'blue'} onPress={() => setStyle('blue')} />
        <Chip label={t('Ink')} active={style === 'ink'} onPress={() => setStyle('ink')} />
        <Chip label={t('Amounts on')} active={!hideAmounts} onPress={() => setHideAmounts(!hideAmounts)} />
        <Chip label={t('Initials only')} active={initialsOnly} onPress={() => setInitialsOnly(!initialsOnly)} />
      </View>

      <Text style={[ty('caption'), { color: c.textMuted }]}>
        {t('Names can be shortened to initials and amounts hidden entirely before sharing. Nothing leaves the app until you pick a destination.')}
      </Text>
    </Screen>
  );
}
