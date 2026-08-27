# iOS submission — ready vs. missing (static review, 2026-08-27)

Review z Windows CLI: čtení `app.json`, `eas.json`, `apple-app-site-association`,
iOS větví v `src/`, `package.json`. **Nespuštěno na zařízení ani v simulátoru**
(není Mac). Kód prošel `tsc --noEmit` čistě.

---

## ✅ Hotové a v kódu správně

| Oblast | Stav |
| --- | --- |
| Bundle ID | `com.balata.splittingly` konzistentní v `app.json`, `apple-app-site-association` (`5N974388GT.com.balata.splittingly`), `eas.json` |
| Export compliance | `ios.config.usesNonExemptEncryption: false` → App Store se neptá na šifrování |
| ATT (App Tracking Transparency) | `NSUserTrackingUsageDescription` přes `expo-tracking-transparency` plugin. `requestTrackingPermissionsAsync()` se volá v `src/admob.ts:104` **před** `mobileAds().initialize()`. Pořadí ATT → UMP → initialize je správné. |
| Foto/kamera oprávnění | `NSPhotoLibraryUsageDescription` + `NSCameraUsageDescription` přes `expo-image-picker` plugin, anglické věty |
| Apple Sign In | `usesAppleSignIn: true`, `expo-apple-authentication` napojené v `src/api/auth.ts` (nativní `signInAsync`, scopes FULL_NAME + EMAIL, `isAvailableAsync()` guard). Povinné, protože nabízíš Google (Guideline 4.8). |
| Universal Links | `associatedDomains: ["applinks:splittingly.com"]` + živý `apple-app-site-association` s `appID` a cestou `/join/*` |
| IAP | `react-native-iap` v16, `buyPro` posílá `apple: { sku }`, `restorePro` implementované (Apple vyžaduje) a napojené v `store.tsx:696`. Server `verifyApple` jde přes App Store Server API s pořadím produkce → sandbox (správně — nákupy z TestFlightu a od recenzenta chodí ze sandboxu). |
| Sdílení | iOS větev `Share.share({ url })` jako fallback k `expo-sharing` v `ShareCard.tsx` |
| Orientace / tablet | `supportsTablet: false` záměrně (telefon zamčený na výšku dle typu zařízení) |
| EAS submit iOS | `appleTeamId: 5N974388GT`, `ascAppId: 6804715757` vyplněné |
| Klávesnice | iOS větve v `Screen.tsx` (`interactive` dismiss, `automaticallyAdjustKeyboardInsets`, `behavior: padding`) |
| Verze runtime | Expo 54.0.36 · RN 0.81.5 · React 19.1 — aktuální, žádný zastaralý blok |

---

## ⚠️ Potřeba udělat — účet/konzole, zvládneš bez Macu

1. **Apple IAP produkt.** V App Store Connect založ jednorázový
   **non-consumable** s Product ID `splittingly_pro` (musí sedět s
   `PRO_PRODUCT_ID` v `src/config.ts`). Bez něj `fetchProPrice`/`buyPro`
   na iOSu nic nevrátí. Přiřaď ho k appce, vyplň cenu, lokalizace, review
   screenshot.

2. **Apple Sign In v Supabase.** Authentication → Providers → Apple:
   zapnout, vyplnit Services/client ID a Team ID. `IMPLEMENTACE.md` krok 4d
   je neodškrtnutý. Bez toho `signInWithIdToken` na serveru selže.

3. **Edge Function — Apple tajemství.** `verify-purchase` potřebuje
   `APPLE_API_KEY_P8`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID`,
   `APPLE_BUNDLE_ID`. Bez nich `verifyApple()` vrací `false` a Pro se na
   iOSu neověří — stejná třída problému, jakou jsme právě řešili u Googlu.

4. **App Store Connect → App Privacy** dotazník. Musí sedět s
   `docs/privacy.html`. Audit (D4) hlásí, že `privacy.html` sekce „What we
   collect" nezmiňuje Pro nákup ani advertising ID — sladit dřív, než se
   vyplní dotazník, jinak nesedí tři plochy (dotazník / text / realita).

5. **iOS AdMob.** ID jsou v `app.json` (`admobIosAppId`, `admobBannerIos`,
   `admobRectangleIos`), ale audit (V2) je vede jako nepotvrzené proti
   reálnému účtu. Odsouhlasit AdMob iOS ToS, ověřit, že iOS appka v AdMob
   konzoli je „Ready", přidat testovací zařízení.

6. **iOS screenshoty.** App Store chce 6,7" (1290×2796) a 6,5", min. 3 kusy
   na velikost. `store/` má zatím jen jeden platný Apple rozměr (audit V6).

7. **Privacy manifest.** V EAS build logu ověř, že se `PrivacyInfo.xcprivacy`
   zabalil. Expo 54 řeší vlastní moduly; riziko je `react-native-google-mobile-ads`.
   Apple build bez manifestu rovnou odmítne (§3.3.3(B) DPLA).

8. **`mr/ta/ur/sw` bez překladu.** Ne bloker submitu (fallback na en/základní
   jazyk je po L2 opravený), ale App Store listing tvrdí počet jazyků —
   sladit číslo (audit V1) a případně tyhle 4 z pickeru dočasně stáhnout.

---

## ⛔ Blokery — Mac / cloud build / placené účty (ne z tohohle stroje)

- **`eas build -p ios --profile production`** — cloud build, ale potřebuje
  členství v Apple Developer Program ($99/rok), distribution certifikát
  a provisioning profil (EAS je umí spravovat automaticky).
- **Test na reálném zařízení** (simulátor nestačí, u části ani ten ne):
  - Universal Links — `splittingly.com/join/…` otevře appku, ne Safari
  - Apple Sign In — v simulátoru vůbec nefunguje, jen reálné zařízení
  - IAP nákup + `restorePro` přes TestFlight sandbox
  - ATT prompt (v simulátoru se chová jinak)
  - Push notifikace (v Expo Go od SDK 53 nejdou)
- **TestFlight** — interní/externí testeři, pak App Store review.

---

## ❓ Nejde ověřit odsud (Apple portál)

- App ID `com.balata.splittingly` má zapnuté capability **Sign In with Apple**
  a **Associated Domains** (`IMPLEMENTACE.md` 4d.1 a deep-link krok 2).
- Provisioning profil obsahuje `applinks` entitlement.
- App Store Connect appka `6804715757` je ve stavu, kdy přijímá buildy.

---

## Doporučené pořadí

1. Sladit `docs/privacy.html` (D4) → pak App Privacy dotazník.
2. Založit Apple IAP produkt + zapnout Apple Sign In v Supabase.
3. Doplnit Apple tajemství do `verify-purchase`.
4. `eas build -p ios --profile preview` → nainstalovat přes TestFlight →
   proklikat deep-link, Apple Sign In, nákup, ATT na reálném iPhonu.
5. Doplnit iOS screenshoty, ověřit privacy manifest v build logu.
6. `eas build -p ios --profile production` → `eas submit -p ios`.
