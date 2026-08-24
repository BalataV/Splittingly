// Nativní moduly, které v testu nemají co dělat.
//
// Čisté funkce jako `inQuietHours` bydlí v souborech, které přes datovou
// vrstvu vtáhnou Supabase a s ním AsyncStorage — a ten bez nativní části
// při importu rovnou spadne. Testy o úložiště nezavadí, takže ho stačí
// nahradit oficiálním mockem knihovny.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// expo-constants čte app.json; v testu stačí prázdné `extra`, aby se
// Supabase klient postavil bez klíčů a nikam se nepřipojoval.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} }, easConfig: null },
}));
