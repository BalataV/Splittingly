// Nahrávání fotek účtenek do Supabase Storage (bucket "receipts").
import { supabase } from '../supabase';

/**
 * Nahraje lokální fotku (uri z foťáku/galerie) a vrátí veřejnou URL,
 * kterou pak uvidí všichni členové skupiny.
 */
export async function uploadReceipt(localUri: string, groupId: string): Promise<string> {
  const ext = (localUri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const path = `${groupId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const res = await fetch(localUri);
  const arrayBuffer = await res.arrayBuffer();

  const { error } = await supabase.storage.from('receipts').upload(path, arrayBuffer, {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  return data.publicUrl;
}
