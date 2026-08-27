// Push tokeny — uložení mého tokenu a načtení tokenů ostatních členů skupiny.
import { supabase } from '../supabase';

export async function savePushToken(token: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from('push_tokens').upsert({
    user_id: u.user.id,
    token,
    updated_at: new Date().toISOString(),
  });
}

/** Tokeny ostatních členů dané skupiny (přes SECURITY DEFINER RPC). */
export async function groupPushTokens(groupId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('group_push_tokens', { p_group_id: groupId });
  if (error) {
    console.warn('[api] group_push_tokens selhalo, notifikace se neodešlou —', error.code || '', error.message || String(error));
    return [];
  }
  return (data || []).map((r: any) => r.token).filter(Boolean);
}
