// Hlášky obou maskotů.
//
// PRAVIDLO, KDO MLUVÍ (není to nálada, je to SMĚR):
//   • The Closer mluví, když peníze ODCHÁZEJÍ — přidání výdaje, velké částky,
//     žebříček, oslava.
//   • The Analyst mluví, když PŘICHÁZEJÍ NÁSLEDKY — bilance, statistiky,
//     připomínky, varování, roční přehled.
//   • SPOLU se objeví jen na pěti místech: detail skupiny, vyrovnaný stav,
//     roční přehled, sdílecí kartička a prázdný stav. Jinak by z jejich sporu
//     byl běžící gag místo události.
//   • NIKDY u načítání (nikdo není vtipný, když se čeká) a nikdy vedle pole
//     s heslem — leda až po neúspěšném pokusu.
//
// PRÁVNÍ MANTINEL: obě postavy jsou obecné archetypy („nadšenec do utrácení"
// a „skeptik nad čísly"). Nesmí připomínat konkrétního člověka, herce ani
// filmovou postavu a nesmí obsahovat repliku z existujícího díla. Všechny
// hlášky níž jsou původní. Když přidáváš další, drž se toho.
//
// Žádná politika, žádné národnostní stereotypy, nic nábožensky ani kulturně
// citlivého — postavy jedou do všech trhů.
//
// PŘEKLAD: text hlášky jde přes `t()` stejně jako zbytek appky (anglický
// text = klíč slovníku). Když píšeš NOVOU hlášku, piš anglicky — překlad se
// doplňuje ve `i18n.ts`. Nepřekládej doslova; hláška má hlavně dobře znít.

import { t } from './i18n';
import type { MascotName } from './types';

export type Situation =
  | 'welcome' | 'empty' | 'settled' | 'growing' | 'error' | 'offline'
  | 'celebration' | 'overview' | 'group' | 'stats' | 'year' | 'search'
  | 'login_failed' | 'confirm_email' | 'split_error' | 'share';

export interface Quip {
  who: MascotName;
  situation: Situation;
  text: string;
}

export const QUIPS: Quip[] = [
  // ---- uvítání --------------------------------------------------------------
  { who: 'closer',  situation: 'welcome', text: 'New group? Say less. Somebody here is about to become very generous.' },
  { who: 'analyst', situation: 'welcome', text: 'Four people, one shared wallet. I have seen how this ends. Adding you anyway.' },
  { who: 'closer',  situation: 'welcome', text: 'One bill, no arguments. That is the pitch. The arguments are extra.' },
  { who: 'closer',  situation: 'welcome', text: 'A new group is just an empty scoreboard. Give it a week.' },
  { who: 'analyst', situation: 'welcome', text: 'You are about to find out exactly who orders the most and admits it least.' },
  { who: 'closer',  situation: 'welcome', text: 'Nobody has spent a cent yet. This is the calmest the app will ever look.' },
  { who: 'analyst', situation: 'welcome', text: 'Every group starts even. Ask me again in a month.' },

  // ---- prázdný stav ---------------------------------------------------------
  { who: 'closer',  situation: 'empty', text: 'No expenses yet. Tragic. Go make a memory, I will handle the paperwork.' },
  { who: 'analyst', situation: 'empty', text: 'Zero expenses. Statistically the healthiest this group will ever be.' },
  { who: 'closer',  situation: 'empty', text: 'An empty ledger is just an invitation.' },
  { who: 'closer',  situation: 'empty', text: 'Nothing logged. Either nobody has paid for anything, or somebody is being generous off the books.' },
  { who: 'analyst', situation: 'empty', text: 'No data. I have nothing to say about you yet, which is rare and will not last.' },
  { who: 'closer',  situation: 'empty', text: 'The first expense is always the hardest. After that it is a lifestyle.' },

  // ---- vyrovnáno (emocionální vrchol) ---------------------------------------
  { who: 'closer',  situation: 'settled', text: 'Zero. Nobody owes anybody a good time. Somebody fix this immediately.' },
  { who: 'analyst', situation: 'settled', text: 'Balance zero. Enjoy it. Historically this lasts nine days.' },
  { who: 'closer',  situation: 'settled', text: 'Everyone is even. So nobody owes anybody a good time? Fix that.' },
  { who: 'analyst', situation: 'settled', text: 'All accounts settled. A rare, fully documented moment of peace.' },
  { who: 'closer',  situation: 'settled', text: 'Debt-free group. Feels good, doesn’t it. Don’t get used to it.' },
  { who: 'analyst', situation: 'settled', text: 'Net balance zero across the board. I checked twice. It held.' },

  // ---- dluh dlouho roste ----------------------------------------------------
  { who: 'closer',  situation: 'growing', text: 'Two hundred and forty in the red. That is not debt, that is a portfolio.' },
  { who: 'analyst', situation: 'growing', text: 'Three people owe you. Two have stopped opening the app.' },
  { who: 'analyst', situation: 'growing', text: 'This balance has not moved in eleven days. Neither has anybody else.' },
  { who: 'analyst', situation: 'growing', text: 'The number keeps climbing and nobody has mentioned it out loud yet.' },
  { who: 'closer',  situation: 'growing', text: 'A balance this size deserves a name and a small ceremony.' },

  // ---- chyba a offline ------------------------------------------------------
  { who: 'closer',  situation: 'error',   text: 'Server is down. Take it as a sign. Order another round, log it later.' },
  { who: 'closer',  situation: 'error',   text: 'Something broke. Not the maths, just the plumbing. It will pass.' },
  { who: 'analyst', situation: 'offline', text: 'Connection lost. Your numbers are safe. Your friendships, unclear.' },
  { who: 'analyst', situation: 'offline', text: 'No signal. The ledger keeps counting anyway; it does not need an audience.' },

  // ---- oslava ---------------------------------------------------------------
  { who: 'closer',  situation: 'celebration', text: 'You covered the whole table. That is not spending, that is leadership.' },
  { who: 'closer',  situation: 'celebration', text: 'Another round is not an expense. It is a position you are taking.' },
  { who: 'analyst', situation: 'celebration', text: 'Group spend up 41% this month. I am not saying anything. I am just saying it.' },
  { who: 'closer',  situation: 'celebration', text: 'Biggest expense of the trip, and you did not even flinch. Respect.' },
  { who: 'analyst', situation: 'celebration', text: 'That single receipt is now the group’s top line item. Noted, filed, moving on.' },

  // ---- konkrétní obrazovky --------------------------------------------------
  { who: 'closer',  situation: 'overview', text: "Three people owe you. You're basically a bank with better taste." },
  { who: 'closer',  situation: 'overview', text: 'Every group in one place. Somewhere in here, somebody owes you dinner.' },
  { who: 'closer',  situation: 'overview', text: 'This is your whole financial life with your friends, in one tidy list. Brave of you.' },
  { who: 'closer',  situation: 'overview', text: 'One glance and you already know who to text first.' },

  { who: 'closer',  situation: 'group',    text: 'Four days, six dinners. Historic run.' },
  { who: 'analyst', situation: 'group',    text: 'Six dinners. Two payers. Do the maths.' },
  { who: 'closer',  situation: 'group',    text: 'This group spends like it is a competition. Somebody is winning.' },
  { who: 'analyst', situation: 'group',    text: 'One transfer settles this whole group. It has been ready for days. Nobody has tapped it.' },
  { who: 'closer',  situation: 'group',    text: 'Every entry here is a small, well-documented act of generosity.' },
  { who: 'analyst', situation: 'group',    text: 'The pattern is clear if you squint: same three people, same order.' },

  { who: 'analyst', situation: 'stats',    text: "Group spend is up 41% this month. I'm not saying anything. I'm just saying it." },
  { who: 'analyst', situation: 'stats',    text: 'One category eats most of the budget here. You already know which one.' },
  { who: 'analyst', situation: 'stats',    text: 'This chart is not an accusation. It is just extremely specific.' },
  { who: 'analyst', situation: 'stats',    text: 'Numbers do not lie, they just wait for someone to look at them.' },

  { who: 'closer',  situation: 'year',     text: 'Forty-one dinners. A body of work.' },
  { who: 'analyst', situation: 'year',     text: 'Forty-one dinners. Two cooks.' },
  { who: 'closer',  situation: 'year',     text: 'A whole year, reduced to receipts. Somehow still the best part.' },
  { who: 'analyst', situation: 'year',     text: 'Twelve months of evidence, neatly totalled. You are welcome.' },

  { who: 'analyst', situation: 'search',   text: "Three visits to the same restaurant. I'm not judging. I'm indexing." },
  { who: 'analyst', situation: 'search',   text: 'Search finds everything. Including the things you were hoping it would not.' },
  { who: 'analyst', situation: 'search',   text: 'Every receipt, filed and findable. Nothing here forgets.' },

  { who: 'closer',  situation: 'login_failed',   text: 'You were gone eleven days. The group kept spending. Brace yourself.' },
  { who: 'analyst', situation: 'login_failed',   text: "Statistically it's the password from two phones ago." },
  { who: 'analyst', situation: 'login_failed',   text: 'Wrong password. The group balance did not wait for you to remember it.' },

  { who: 'closer',  situation: 'confirm_email',  text: 'Six digits between you and the group chat. Type faster.' },
  { who: 'closer',  situation: 'confirm_email',  text: 'One code, one inbox, one step from being fully caught up.' },

  { who: 'analyst', situation: 'split_error',    text: "Ten euros unassigned. It doesn't disappear. It just becomes somebody's problem later." },
  { who: 'analyst', situation: 'split_error',    text: 'The split does not add up yet. Small gap, but it never closes itself.' },

  { who: 'closer',  situation: 'share',    text: '18 expenses, 4 days, 0 arguments.' },
  { who: 'analyst', situation: 'share',    text: 'Zero arguments recorded. Recording continues.' },
  { who: 'closer',  situation: 'share',    text: 'A whole trip, reconciled to the cent. Send it before anyone disputes it.' },
  { who: 'analyst', situation: 'share',    text: 'This card is the whole story. No footnotes, no disputes on file.' },
];

let lastText: string | null = null;

/**
 * Vybere hlášku pro situaci a postavu. Neopakuje tu samou dvakrát po sobě.
 * Vrací `null`, když maskoti nemají mluvit (uživatel je vypnul v nastavení).
 */
export function quipFor(situation: Situation, who: MascotName, enabled = true): string | null {
  if (!enabled) return null;
  const pool = QUIPS.filter((q) => q.situation === situation && q.who === who);
  if (!pool.length) return null;
  let pick = pool[Math.floor(Math.random() * pool.length)];
  for (let i = 0; i < 5 && pick.text === lastText && pool.length > 1; i += 1) {
    pick = pool[Math.floor(Math.random() * pool.length)];
  }
  lastText = pick.text;
  return t(pick.text);
}

/** Obrazovky, kde se obě postavy potkávají. Nikde jinde nevystupují spolu. */
export const DUAL_SITUATIONS: Situation[] = ['group', 'settled', 'year', 'share', 'empty'];
