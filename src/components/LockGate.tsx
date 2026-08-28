// Zamčená obrazovka. Renderuje ji `Root` MÍSTO celé appky, když je
// `state.locked` — bez tab baru, banneru a čehokoli dalšího. Za zámkem
// není žádné tajemství (viz `src/applock.ts`), je to soukromí na cizí oči,
// ne kryptografická hranice.
//
// Jednorázový automatický pokus na mountu: většina lidí zvládne Face ID /
// otisk hned, takže se nemusí ještě ťukat na tlačítko. Když ho zavřou nebo
// selže, zůstane tlačítko „Unlock".

import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { useUi, Button } from './ui';
import { useApp } from '../store';
import { t } from '../i18n';
import { SPACE, THEMES } from '../theme';

export default function LockGate() {
  const { c } = useUi();
  const { state, actions } = useApp();
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    actions.unlock();
  }, [actions]);

  const dark = c.isDark;
  const ground = dark ? '#101010' : THEMES[state.theme].accent;
  const ink = dark ? '#FAF7F0' : '#101010';

  return (
    <View style={{ flex: 1, backgroundColor: ground, alignItems: 'center', justifyContent: 'center', gap: SPACE.lg, padding: 40 }}>
      <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 34, lineHeight: 33, color: ink, textAlign: 'center', letterSpacing: -0.7 }}>
        {'SPLIT\nTINGLY'}
      </Text>
      <Text style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 15, color: ink, textAlign: 'center', opacity: 0.9 }}>
        {t('Locked. Confirm your identity to continue.')}
      </Text>
      <View style={{ width: '100%', maxWidth: 320 }}>
        <Button label={t('Unlock')} onPress={() => actions.unlock()} />
      </View>
    </View>
  );
}
