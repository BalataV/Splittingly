// Skupiny a členové — čtení/zápis do Supabase.
import { supabase } from '../supabase';
import type { JoinPreview } from '../types';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez 0/O a 1/I — kód se diktuje po telefonu

function randomCode(): string {
  let out = '';
  for (let i = 0; i < 6; i += 1) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export interface RawGroup {
  id: string;
  name: string;
  currency: string;
  coverColor: string;
  shareCode: string;
  archived: boolean;
  members: { id: string; name: string; color: string | null; userId: string | null; leftAt: string | null }[];
}

export async function fetchGroups(): Promise<RawGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, currency, cover_color, share_code, archived, group_members(id, name, color, user_id, left_at)')
    .eq('archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    currency: g.currency,
    coverColor: g.cover_color || '#FFE500',
    shareCode: g.share_code,
    archived: !!g.archived,
    members: (g.group_members || [])
      .filter((m: any) => !m.left_at)
      .map((m: any) => ({ id: m.id, name: m.name, color: m.color, userId: m.user_id, leftAt: m.left_at })),
  }));
}

export async function createGroup(
  name: string,
  currency: string,
  coverColor: string,
  memberNames: string[],
  meName: string,
): Promise<RawGroup> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  const code = randomCode();

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, currency, cover_color: coverColor, share_code: code, created_by: userId })
    .select()
    .single();
  if (error) throw error;

  const palette = ['#FFE500', '#1F49FF', '#FF2D16', '#00A34A', '#101010'];
  const rows = memberNames.map((n, i) => ({
    group_id: group.id,
    name: n,
    color: palette[i % palette.length],
    user_id: n === meName ? userId : null,
    role: n === meName ? 'admin' : 'member',
  }));
  const { data: members, error: mErr } = await supabase.from('group_members').insert(rows).select();
  if (mErr) throw mErr;

  return {
    id: group.id,
    name: group.name,
    currency: group.currency,
    coverColor: group.cover_color,
    shareCode: code,
    archived: false,
    members: (members || []).map((m: any) => ({ id: m.id, name: m.name, color: m.color, userId: m.user_id, leftAt: null })),
  };
}

/** Náhled skupiny podle kódu — kdo už uvnitř je (obrazovka 10). */
export async function groupPreview(code: string): Promise<JoinPreview | null> {
  const { data, error } = await supabase.rpc('group_preview', { code: code.toUpperCase() });
  // Pozor: `group_preview` je čisté SQL a na neznámý kód vrací PRÁZDNÝ
  // výsledek, ne chybu. `error` tady tedy znamená skutečné selhání (síť,
  // RLS, DB) — ne „skupina neexistuje". Nezaměňovat, jinak člověk s
  // výpadkem sítě dostane hlášku „no such group".
  if (error) {
    console.error('[api] group_preview selhalo —', error.code || '', error.message || String(error));
    throw new Error('PREVIEW_FAILED');
  }
  if (!data || !data.length) return null;
  return {
    code: code.toUpperCase(),
    groupId: data[0].group_id,
    groupName: data[0].group_name,
    currency: data[0].group_currency,
    coverColor: data[0].cover_color,
    members: data.map((r: any) => ({ name: r.member_name, claimed: r.claimed, isMe: r.is_me })),
  };
}

/** Připojení s výběrem jména: zaberu volné místo, nebo přidám nové. */
export async function joinGroupChoose(code: string, claimName: string | null, newName: string | null): Promise<string> {
  const { data, error } = await supabase.rpc('join_group_choose', {
    code: code.toUpperCase(),
    claim_name: claimName || null,
    new_name: newName || null,
  });
  if (error) throw new Error(error.message || 'JOIN_FAILED');
  return data as string;
}

export async function joinGroupByCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_group_by_code', { code: code.toUpperCase() });
  if (error) throw new Error('GROUP_NOT_FOUND');
  return data as string;
}

export async function addMember(groupId: string, name: string, color: string) {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, name, color });
  if (error) throw error;
}

/** Odchod ze skupiny: člen zůstane jako „former member", historie nepadá. */
export async function leaveGroup(groupId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase
    .from('group_members')
    .update({ user_id: null, left_at: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('user_id', u.user.id);
  if (error) throw error;
}

export async function archiveGroup(id: string) {
  const { error } = await supabase.from('groups').update({ archived: true }).eq('id', id);
  if (error) throw error;
}

export async function renameMe(groupId: string, name: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase
    .from('group_members')
    .update({ name })
    .eq('group_id', groupId)
    .eq('user_id', u.user.id);
  if (error) throw error;
}
