// Výdaje, účtenky, platby a audit stopa.
//
// Členové se odkazují přes ID (`payer_id`, `part_ids`, `from_id`, `to_id`).
// Jména (`payer_name`, `part_names`, …) se zapisují jen jako popisek; klient
// čte podle ID a překládá je na AKTUÁLNÍ jméno, takže přejmenování člena
// nepřepisuje historii.

import { supabase } from '../supabase';
import type { SplitType, PayMethod, AuditEntry } from '../types';

export interface RawExpense {
  id: string;
  groupId: string;
  desc: string;
  amountMinor: number;
  currency: string;
  // Pro: zamčený FX kurz z času založení. `fxRate` = kolik jednotek `fxCcy`
  // za 1 jednotku `currency`. Jen zobrazení — nepočítá se z něj.
  fxRate?: number;
  fxCcy?: string;
  payerId: string | null;
  partIds: string[];
  payerName: string;
  partNames: string[];
  splitType: SplitType;
  shares: number[] | null;
  exactMinor: number[] | null;
  category: string;
  spentAt: string;
  editCount: number;
  createdAt: string;
  receipts: string[];
}

const SELECT =
  'id, group_id, description, amount_minor, currency, fx_rate, fx_ccy, payer_id, part_ids, payer_name, part_names, ' +
  'split_type, shares, exact_minor, category, spent_at, edit_count, created_at, ' +
  'expense_receipts(url)';

function mapExpense(e: any): RawExpense {
  return {
    id: e.id,
    groupId: e.group_id,
    desc: e.description,
    amountMinor: Number(e.amount_minor) || 0,
    currency: e.currency || 'EUR',
    fxRate: e.fx_rate != null ? Number(e.fx_rate) : undefined,
    fxCcy: e.fx_ccy || undefined,
    payerId: e.payer_id || null,
    partIds: e.part_ids || [],
    payerName: e.payer_name,
    partNames: e.part_names || [],
    splitType: (e.split_type || 'equal') as SplitType,
    shares: e.shares ? e.shares.map(Number) : null,
    exactMinor: e.exact_minor ? e.exact_minor.map(Number) : null,
    category: e.category || 'other',
    spentAt: e.spent_at,
    editCount: e.edit_count || 0,
    createdAt: e.created_at,
    receipts: (e.expense_receipts || []).map((r: any) => r.url),
  };
}

export async function fetchExpenses(groupId: string): Promise<RawExpense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select(SELECT)
    .eq('group_id', groupId)
    .order('spent_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapExpense);
}

/** Výdaje pro VÍCE skupin jedním dotazem místo N — přehled se tím načte naráz. */
export async function fetchExpensesForGroups(groupIds: string[]): Promise<Record<string, RawExpense[]>> {
  if (!groupIds.length) return {};
  const { data, error } = await supabase
    .from('expenses')
    .select(SELECT)
    .in('group_id', groupIds)
    .order('spent_at', { ascending: false });
  if (error) throw error;
  const byGroup: Record<string, RawExpense[]> = {};
  (data || []).forEach((e: any) => {
    (byGroup[e.group_id] = byGroup[e.group_id] || []).push(mapExpense(e));
  });
  return byGroup;
}

export interface ExpenseInput {
  groupId: string;
  desc: string;
  amountMinor: number;
  currency: string;
  payerId: string | null;
  payerName: string;
  partIds: string[];
  partNames: string[];
  splitType: SplitType;
  shares: number[] | null;
  exactMinor: number[] | null;
  category: string;
  spentAt: string;
  // Pro: zamčený FX kurz. Volitelné — plní je jen Pro při zakládání výdaje.
  fxRate?: number | null;
  fxCcy?: string | null;
}

export async function addExpense(input: ExpenseInput): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      group_id: input.groupId,
      description: input.desc,
      amount_minor: input.amountMinor,
      currency: input.currency,
      payer_id: input.payerId,
      payer_name: input.payerName,
      part_ids: input.partIds,
      part_names: input.partNames,
      split_type: input.splitType,
      shares: input.shares,
      exact_minor: input.exactMinor,
      category: input.category,
      spent_at: input.spentAt,
      fx_rate: input.fxRate ?? null,
      fx_ccy: input.fxCcy ?? null,
      created_by: u.user?.id,
    })
    .select('id')
    .single();
  if (error) throw error;
  await logAudit(data.id, input.groupId, 'created', null, null, null);
  return data.id as string;
}

export async function updateExpense(id: string, input: ExpenseInput, changes: { field: string; from: string; to: string }[]) {
  const { error } = await supabase
    .from('expenses')
    .update({
      description: input.desc,
      amount_minor: input.amountMinor,
      currency: input.currency,
      payer_id: input.payerId,
      payer_name: input.payerName,
      part_ids: input.partIds,
      part_names: input.partNames,
      split_type: input.splitType,
      shares: input.shares,
      exact_minor: input.exactMinor,
      category: input.category,
      spent_at: input.spentAt,
      // FX kurz se přepisuje jen když ho volající výslovně poslal — jinak
      // by editace z ne-Pro cesty smazala zamčený kurz z původního založení.
      ...(input.fxRate !== undefined ? { fx_rate: input.fxRate } : {}),
      ...(input.fxCcy !== undefined ? { fx_ccy: input.fxCcy } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;

  // Počet úprav se hlídá zvlášť — detail výdaje ho ukazuje ("Edited twice").
  const { data: cur } = await supabase.from('expenses').select('edit_count').eq('id', id).maybeSingle();
  await supabase.from('expenses').update({ edit_count: (cur?.edit_count || 0) + 1 }).eq('id', id);

  // Změna částky přepočítá VŠECHNY podíly a celá skupina o tom dostane zprávu.
  for (const ch of changes) {
    await logAudit(id, input.groupId, 'edited', ch.field, ch.from, ch.to);
  }
}

export async function deleteExpense(id: string, groupId: string) {
  await logAudit(id, groupId, 'deleted', null, null, null);
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ------------------------------------------------------------------ účtenky

export async function addReceipt(expenseId: string, groupId: string, url: string) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('expense_receipts')
    .insert({ expense_id: expenseId, group_id: groupId, url, created_by: u.user?.id });
  if (error) throw error;
}

export async function removeReceipt(expenseId: string, url: string) {
  const { error } = await supabase.from('expense_receipts').delete().eq('expense_id', expenseId).eq('url', url);
  if (error) throw error;
}

// -------------------------------------------------------------------- audit

async function logAudit(
  expenseId: string,
  groupId: string,
  action: 'created' | 'edited' | 'deleted',
  field: string | null,
  oldValue: string | null,
  newValue: string | null,
) {
  const { data: u } = await supabase.auth.getUser();
  const { data: p } = await supabase.from('profiles').select('display_name').eq('id', u.user?.id || '').maybeSingle();
  await supabase.from('expense_audit').insert({
    expense_id: expenseId,
    group_id: groupId,
    actor_id: u.user?.id,
    actor_name: p?.display_name || 'Someone',
    action,
    field,
    old_value: oldValue,
    new_value: newValue,
  });
}

export async function fetchAudit(expenseId: string): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('expense_audit')
    .select('id, expense_id, actor_name, action, field, old_value, new_value, created_at')
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: a.id,
    expenseId: a.expense_id,
    actorName: a.actor_name || 'Someone',
    action: a.action,
    field: a.field,
    oldValue: a.old_value,
    newValue: a.new_value,
    createdAt: a.created_at,
  }));
}

// ------------------------------------------------------------------- platby

export interface PaymentInput {
  groupId: string;
  fromId: string | null;
  toId: string | null;
  fromName: string;
  toName: string;
  amountMinor: number;
  currency: string;
  method: PayMethod;
  note: string | null;
}

export async function addPayment(input: PaymentInput) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from('payments').insert({
    group_id: input.groupId,
    from_id: input.fromId,
    to_id: input.toId,
    from_name: input.fromName,
    to_name: input.toName,
    amount_minor: input.amountMinor,
    currency: input.currency,
    method: input.method,
    note: input.note,
    created_by: u.user?.id,
  });
  if (error) throw error;
}

export async function fetchPaymentsForGroups(groupIds: string[]): Promise<Record<string, any[]>> {
  if (!groupIds.length) return {};
  const { data, error } = await supabase
    .from('payments')
    .select('id, group_id, from_id, to_id, from_name, to_name, amount_minor, currency, method, note, created_at')
    .in('group_id', groupIds);
  if (error) throw error;
  const byGroup: Record<string, any[]> = {};
  (data || []).forEach((p: any) => { (byGroup[p.group_id] = byGroup[p.group_id] || []).push(p); });
  return byGroup;
}
