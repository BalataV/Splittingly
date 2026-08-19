// Feed změn (obrazovka 19). Skládá se z už načtených dat, ne z vlastní tabulky —
// výdaje a platby nesou čas, takže historii lze poskládat na klientovi.

import { t } from './i18n';
import type { ActivityItem, Group, Expense, Payment } from './types';

export function buildActivity(
  groups: Group[],
  expenses: Record<string, Expense[]>,
  payments: Record<string, Payment[]>,
  limit = 60,
): ActivityItem[] {
  const out: ActivityItem[] = [];

  groups.forEach((g) => {
    (expenses[g.id] || []).forEach((e) => {
      out.push({
        id: 'e' + e.id,
        kind: e.editCount > 0 ? 'edit' : 'expense',
        groupId: g.id,
        groupName: g.name,
        actor: e.payer,
        text: e.editCount > 0
          ? t('{who} edited {what}', { who: e.payer, what: e.desc })
          : t('{who} added {what}', { who: e.payer, what: e.desc }),
        amountMinor: e.amountMinor,
        currency: e.currency,
        at: e.spentAt,
      });
    });
    (payments[g.id] || []).forEach((p) => {
      out.push({
        id: 'p' + p.id,
        kind: 'payment',
        groupId: g.id,
        groupName: g.name,
        actor: p.from,
        text: t('{from} settled up with {to}', { from: p.from, to: p.to }),
        amountMinor: p.amountMinor,
        currency: p.currency,
        at: p.createdAt,
      });
    });
  });

  return out.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}

/** Seskupení podle dne — hlavičky "TODAY" / "YESTERDAY" / datum. */
export function groupByDay(items: ActivityItem[]): { key: string; label: string; items: ActivityItem[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);

  const buckets: Record<string, ActivityItem[]> = {};
  items.forEach((i) => {
    const d = new Date(i.at);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    (buckets[key] = buckets[key] || []).push(i);
  });

  return Object.keys(buckets)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((key) => {
      const d = new Date(key);
      let label = key;
      if (d.getTime() === today.getTime()) label = t('Today');
      else if (d.getTime() === yesterday.getTime()) label = t('Yesterday');
      return { key, label: label.toUpperCase(), items: buckets[key] };
    });
}
