npx eas-cli init --account balatav# E-mailové šablony

Vloží se ručně: **Supabase → Authentication → Templates**. Editace šablon je
odemčená až po zapnutí vlastního SMTP (Zoner), což už je hotové.

Otevři soubor, zkopíruj **celý obsah** (komentář na začátku klidně taky, HTML
komentáře se v e-mailu nezobrazí) a vlož do pole *Message body*. Předmět
přepiš podle tabulky níž.

| Šablona v Supabase | Soubor | Subject | Priorita |
| --- | --- | --- | --- |
| Confirm sign up | `confirm-signup.html` | `Confirm your Splittingly account` | **nutné** |
| Reset password | `reset-password.html` | `Reset your Splittingly password` | **nutné** |
| Magic link or OTP | — | — | appka nepoužívá |
| Invite user | — | — | appka nepoužívá |
| Change email address | výchozí stačí | | nízká |
| Reauthentication | výchozí stačí | | nízká |
| Security (Password changed, …) | výchozí stačí | | nízká |

## Proč to nejde nechat na výchozích

1. **Výchozí šablona neobsahuje kód.** Appka má obrazovku 07 se šesti políčky
   a volá `verifyOtp` — bez `{{ .Token }}` v e-mailu nemá uživatel co zadat.
   Tohle je jediný funkční důvod; zbytek je vzhled.
2. Výchozí e-mail nemá značku a chodí ve stylu „Supabase Auth". U appky, která
   pracuje s penězi, to vypadá jako phishing a lidé na to neklikají.

## Proměnné, které NESMÍŠ přepsat

| Proměnná | Co je |
| --- | --- |
| `{{ .ConfirmationURL }}` | odkaz s jednorázovým tokenem; míří na `https://splittingly.com/app/` |
| `{{ .Token }}` | šestimístný kód pro obrazovku 07 |
| `{{ .Email }}` | adresa příjemce (v šablonách nepoužito, ale funguje) |

## Ověření, že to jede

1. V appce se zaregistruj na skutečnou adresu.
2. E-mail musí dorazit **od `support@splittingly.com`**, ne od Supabase.
3. Musí v něm být tlačítko **i** šestimístný kód.
4. Kód opiš do appky → účet se potvrdí.
5. Odkaz otevři v prohlížeči → `https://splittingly.com/app/` musí ukázat
   „EMAIL CONFIRMED".

## Limity odesílání

Zoner tarif *E-mail Gratis* + Supabase rate limit = **30 e-mailů/hodinu**.
Na začátek to stačí. Až se appka rozjede, tohle bude škrtit registrace —
přejdi na **Resend** nebo **Postmark** (free tier ~3 000 e-mailů/měsíc, lepší
doručitelnost, vlastní DKIM). Mění se jen údaje v *SMTP Settings*, šablony
zůstávají.
