// Vstupní komponenta: načtení písem, směr čtení, poskytovatelé, kořen.
import React, { useEffect, useState } from 'react';
import { View, I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Device from 'expo-device';
import { useFonts } from 'expo-font';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { AppProvider } from './src/store';
import Root from './src/Root';
import ErrorBoundary from './src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [fontsLoaded] = useFonts({
    ArchivoBlack_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    // RTL se v React Native zapíná NA ÚROVNI PROCESU a projeví se až po
    // restartu. Layout proto stavíme na logických vlastnostech (flexDirection
    // 'row' + `rtl` z kontextu), aby se přepnutí jazyka projevilo hned a
    // I18nManager byl jen doplněk pro systémové prvky.
    I18nManager.allowRTL(true);
  }, []);

  useEffect(() => {
    /*
     * Orientace se řídí TYPEM ZAŘÍZENÍ, ne konfigurací.
     *
     * `orientation` v app.json je jedna globální hodnota — buď zamkne všechno,
     * nebo nic. My chceme obojí zároveň: telefon na výšku (formuláře na šířku
     * jsou tam nepoužitelné a nikdo tak appku nedrží), tablet volně (tam ho
     * lidé drží na šířku a Google Play za portrait-only snižuje viditelnost
     * v tabletové sekci).
     *
     * Proto je v konfiguraci `default` a zámek se nastaví tady při startu.
     */
    (async () => {
      try {
        const type = await Device.getDeviceTypeAsync();
        if (type === Device.DeviceType.TABLET || type === Device.DeviceType.DESKTOP) {
          await ScreenOrientation.unlockAsync();
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch {
        // Zámek je pohodlí, ne požadavek — když selže, appka běží dál.
      }
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#FFE500' }} />;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <Root />
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
