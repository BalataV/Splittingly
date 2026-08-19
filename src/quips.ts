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

  // ---- prázdný stav ---------------------------------------------------------
  { who: 'closer',  situation: 'empty', text: 'No expenses yet. Tragic. Go make a memory, I will handle the paperwork.' },
  { who: 'analyst', situation: 'empty', text: 'Zero expenses. Statistically the healthiest this group will ever be.' },
  { who: 'closer',  situation: 'empty', text: 'An empty ledger is just an invitation.' },

  // ---- vyrovnáno (emocionální vrchol) ---------------------------------------
  { who: 'closer',  situation: 'settled', text: 'Zero. Nobody owes anybody a good time. Somebody fix this immediately.' },
  { who: 'analyst', situation: 'settled', text: 'Balance zero. Enjoy it. Historically this lasts nine days.' },
  { who: 'closer',  situation: 'settled', text: 'Everyone is even. So nobody owes anybody a good time? Fix that.' },

  // ---- dluh dlouho roste ----------------------------------------------------
  { who: 'closer',  situation: 'growing', text: 'Two hundred and forty in the red. That is not debt, that is a portfolio.' },
  { who: 'analyst', situation: 'growing', text: 'Three people owe you. Two have stopped opening the app.' },
  { who: 'analyst', situation: 'growing', text: 'This balance has not moved in eleven days. Neither has anybody else.' },

  // ---- chyba a offline ------------------------------------------------------
  { who: 'closer',  situation: 'error',   text: 'Server is down. Take it as a sign. Order another round, log it later.' },
  { who: 'analyst', situation: 'offline', text: 'Connection lost. Your numbers are safe. Your friendships, unclear.' },

  // ---- oslava ---------------------------------------------------------------
  { who: 'closer',  situation: 'celebration', text: 'You covered the whole table. That is not spending, that is leadership.' },
  { who: 'closer',  situation: 'celebration', text: 'Another round is not an expense. It is a position you are taking.' },
  { who: 'analyst', situation: 'celebration', text: 'Group spend up 41% this month. I am not saying anything. I am just saying it.' },

  // ---- konkrétní obrazovky --------------------------------------------------
  { who: 'closer',  situation: 'overview', text: "Three people owe you. You're basically a bank with better taste." },
  { who: 'closer',  situation: 'group',    text: 'Four days, six dinners. Historic run.' },
  { who: 'analyst', situation: 'group',    text: 'Six dinners. Two payers. Do the maths.' },
  { who: 'analyst', situation: 'stats',    text: "Group spend is up 41% this month. I'm not saying anything. I'm just saying it." },
  { who: 'closer',  situation: 'year',     text: 'Forty-one dinners. A body of work.' },
  { who: 'analyst', situation: 'year',     text: 'Forty-one dinners. Two cooks.' },
  { who: 'analyst', situation: 'search',   text: "Three visits to the same restaurant. I'm not judging. I'm indexing." },
  { who: 'closer',  situation: 'login_failed',   text: 'You were gone eleven days. The group kept spending. Brace yourself.' },
  { who: 'analyst', situation: 'login_failed',   text: "Statistically it's the password from two phones ago." },
  { who: 'closer',  situation: 'confirm_email',  text: 'Six digits between you and the group chat. Type faster.' },
  { who: 'analyst', situation: 'split_error',    text: "Ten euros unassigned. It doesn't disappear. It just becomes somebody's problem later." },
  { who: 'closer',  situation: 'share',    text: '18 expenses, 4 days, 0 arguments.' },
  { who: 'analyst', situation: 'share',    text: 'Zero arguments recorded. Recording continues.' },
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
  return pick.text;
}

/** Obrazovky, kde se obě postavy potkávají. Nikde jinde nevystupují spolu. */
export const DUAL_SITUATIONS: Situation[] = ['group', 'settled', 'year', 'share', 'empty'];
