// Opakované výdaje (Pro) — datová vrstva nad tabulkou `recurring_expenses`.
//
// Šablona jen popisuje, CO a JAK ČASTO se má opakovat. Vlastní výdaje z ní
// vytváří serverová funkce `run_due_recurring` (RPC `runDueRecurring`), když
// dozraje `next_run` — klient je nikdy nezakládá sám, aby dva členové
// otvírající skupinu naráz nevytvořili dvojitý výdaj.
//
// Členové se odkazují přes ID (`payer_id`, `part_ids`) stejně jako u
// `expenses`; jména se doplní až při generování z aktuálních `group_members`.
//
// Pro-gate je v `src/entitlements.ts` (`canUseRecurring`) a je KLIENTSKÝ —
// RLS pouští zápis každému členovi skupiny, viz poznámka tamtéž.

import { supabase } from '../supabase';

/** weekly = každých N týdnů · monthly = každých N měsíců · interval = každých N dní */
export type Cadence = 'weekly' | 'monthly' | 'interval';

export interface RawRecurring {
  id: string;
  groupId: string;
  payerId: string | null;
  partIds: string[];
  amountMinor: number;
  currency: string;
  desc: string;
  category: string;
  cadence: Cadence;
  /** „každých N" — kolik týdnů / měsíců / dní mezi výskyty (1–366). */
  intervalCount: number;
  /** Den v měsíci pro `monthly` (1–31, zkrácený měsíc se ořízne). Jinak null. */
  anchorDay: number | null;
  /** Kdy vznikne další výdaj (ISO). */
  nextRun: string;
  active: boolean;
  createdAt: string;
}

export interface RecurringInput {
  groupId: string;
  payerId: string | null;
  partIds: string[];
  amountMinor: number;
  currency: string;
  desc: string;
  category: string;
  cadence: Cadence;
  intervalCount: number;
  anchorDay: number | null;
  nextRun: string;
}

const SELECT =
  'id, group_id, payer_id, part_ids, amount_minor, currency, description, ' +
  'category, cadence, interval_count, anchor_day, next_run, active, created_at';

function mapRecurring(r: any): RawRecurring {
  return {
    id: r.id,
    groupId: r.group_id,
    payerId: r.payer_id || null,
    partIds: r.part_ids || [],
    amountMinor: Number(r.amount_minor) || 0,
    currency: r.currency || 'EUR',
    desc: r.description,
    category: r.category || 'other',
    cadence: (r.cadence || 'monthly') as Cadence,
    intervalCount: Number(r.interval_count) || 1,
    anchorDay: r.anchor_day ?? null,
    nextRun: r.next_run,
    active: !!r.active,
    createdAt: r.created_at,
  };
}

/** `anchor_day` dává smysl jen u `monthly`; u ostatních kadencí se nutí na null. */
function anchorFor(input: RecurringInput): number | null {
  return input.cadence === 'monthly' ? input.anchorDay : null;
}

/** Všechny šablony skupiny, nejnovější první. Vrací i vypnuté (`active = false`). */
export async function listRecurring(groupId: string): Promise<RawRecurring[]> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select(SELECT)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRecurring);
}

export async function createRecurring(input: RecurringInput): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({
      group_id: input.groupId,
      payer_id: input.payerId,
      part_ids: input.partIds,
      amount_minor: input.amountMinor,
      currency: input.currency,
      description: input.desc,
      category: input.category,
      cadence: input.cadence,
      interval_count: input.intervalCount,
      anchor_day: anchorFor(input),
      next_run: input.nextRun,
      created_by: u.user?.id,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Přepíše šablonu. `created_by` a `active` se nemění (na to je `deactivateRecurring`). */
export async function updateRecurring(id: string, input: RecurringInput): Promise<void> {
  const { error } = await supabase
    .from('recurring_expenses')
    .update({
      payer_id: input.payerId,
      part_ids: input.partIds,
      amount_minor: input.amountMinor,
      currency: input.currency,
      description: input.desc,
      category: input.category,
      cadence: input.cadence,
      interval_count: input.intervalCount,
      anchor_day: anchorFor(input),
      next_run: input.nextRun,
    })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Vypnutí šablony. Řádek ZŮSTÁVÁ — drží ho vazba `expenses.recurring_id`
 * z už vygenerovaných výdajů — jen přestane generovat další.
 */
export async function deactivateRecurring(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').update({ active: false }).eq('id', id);
  if (error) throw error;
}

/**
 * Nechá server vytvořit výdaje ze všech šablon skupiny, kterým dozrál
 * `next_run`. Vrací počet vytvořených výdajů (0 = nic nedozrálo). Volá se
 * při otevření skupiny; je idempotentní, takže opakované volání nevadí.
 */
export async function runDueRecurring(groupId: string): Promise<number> {
  const { data, error } = await supabase.rpc('run_due_recurring', { p_group_id: groupId });
  if (error) throw error;
  return Number(data) || 0;
}
