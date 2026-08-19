# Splittingly

Mobile app for splitting shared expenses in a group — flatmates, friends on
holiday, family. Anyone logs what they paid and who it concerns; the app works
out who owes whom and minimises the number of transfers needed to clear the
group. Ten debts collapse into one payment.

React Native + Expo (iOS and Android). Free and ad-supported, with a one-time
purchase that removes every ad. About 50 languages and an independently chosen
currency.

## Quick start

```bash
npm install
npm run typecheck     # must pass clean
npm run check:money   # money maths must pass clean
npm start             # scan the QR code with Expo Go
```

Without Supabase keys in `app.json` the app runs in **local mode** — data lives
on the phone only, nothing is shared. That is a fine way to click through it.

## Documentation

| File | What it is |
| --- | --- |
| `IMPLEMENTACE.md` | Step-by-step deployment guide (Czech) — **start here** |
| `AGENTS.md` | Project context and conventions (Czech) |
| `supabase/schema.sql` | Database schema, RLS policies and RPCs |
| `docs/` | Public website (GitHub Pages) |

## Licence

Proprietary. All rights reserved.
