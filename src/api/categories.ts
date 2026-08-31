// Vlastní kategorie skupiny (Pro) — datová vrstva nad `group_categories`.
//
// Kategorie je SDÍLENÁ: výdaj s ní vidí a používá celá skupina. Vytvořit
// vlastní smí (klientsky, viz `canUseCustomCategories` v entitlements.ts)
// jen Pro; free má default kategorie z `src/categories.ts` a vidí custom
// od Pro členů.
//
// `expenses.category` je volný text, ne cizí klíč — smazání kategorie tady
// nepřepíše historii, výdaje s ní si drží svůj řetězec.

import { supabase } from '../supabase';

export interface RawGroupCategory {
  id: string;
  groupId: string;
  name: string;
  createdAt: string;
}

const SELECT = 'id, group_id, name, created_at';

function mapCategory(c: any): RawGroupCategory {
  return { id: c.id, groupId: c.group_id, name: c.name, createdAt: c.created_at };
}

// Založení i přejmenování může spadnout na unikát `(group_id, lower(name))`
// → Postgres `unique_violation` (kód 23505). Překlopíme na hlášku, kterou
// `store.tsx` mapuje na lokalizovaný toast; ostatní chyby probublají dál.
const CATEGORY_EXISTS = 'category already exists';

function throwCategoryError(error: { code?: string }): never {
  if (error.code === '23505') throw new Error(CATEGORY_EXISTS);
  throw error;
}

export async function listGroupCategories(groupId: string): Promise<RawGroupCategory[]> {
  const { data, error } = await supabase
    .from('group_categories')
    .select(SELECT)
    .eq('group_id', groupId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCategory);
}

export async function createGroupCategory(groupId: string, name: string): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('group_categories')
    .insert({ group_id: groupId, name: name.trim(), created_by: u.user?.id })
    .select('id')
    .single();
  if (error) throwCategoryError(error);
  return data.id as string;
}

export async function renameGroupCategory(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('group_categories')
    .update({ name: name.trim() })
    .eq('id', id);
  if (error) throwCategoryError(error);
}

export async function deleteGroupCategory(id: string): Promise<void> {
  const { error } = await supabase.from('group_categories').delete().eq('id', id);
  if (error) throw error;
}
