// Fronta zápisů, které se nepodařilo odeslat.
//
// PROČ: uživatel zadává výdaje v hospodě, v metru, na horách — tedy přesně
// tam, kde signál není. Kdyby appka v takové chvíli řekla „nepodařilo se
// uložit", ztratí se přesně ten údaj, kvůli kterému si ji nainstaloval.
//
// JAK: zápis se nejdřív promítne do stavu (uživatel ho hned vidí), a když
// odeslání selže, uloží se sem. Fronta se zkusí odeslat při startu, při
// každém obnovení dat a po každém úspěšném zápisu.
//
// CO SE NEFRONTUJE: čtení (to se prostě neaktualizuje) a akce, které bez
// serveru nemají smysl — připojení do skupiny kódem, mazání účtu, nákup.
// U nich je poctivější říct „tohle potřebuje připojení" než slibovat, že
// se to samo dodělá.
//
// POŘADÍ SE DODRŽUJE. Fronta je FIFO a při chybě se zastaví — kdyby se
// přeskakovalo, mohla by úprava výdaje dorazit dřív než jeho vytvoření.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExpenseInput, PaymentInput } from './api/expenses';

const QUEUE_KEY = '@splittingly/queue-v1';

export type QueuedOp =
  | { id: string; at: string; kind: 'expense.add'; groupId: string; input: ExpenseInput; receipts: string[] }
  | { id: string; at: string; kind: 'expense.update'; groupId: string; expenseId: string; input: ExpenseInput }
  | { id: string; at: string; kind: 'expense.delete'; groupId: string; expenseId: string }
  | { id: string; at: string; kind: 'payment.add'; groupId: string; input: PaymentInput };

/**
 * Vstup do fronty bez polí, která si doplní sama.
 *
 * Obyčejné `Omit<QueuedOp, …>` by tu nefungovalo: na sjednocení typů se
 * neroznásobí přes jednotlivé varianty a TypeScript by z něj udělal průnik,
 * ve kterém chybí `expenseId` i `input`. Tenhle tvar Omit rozdistribuuje.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type QueuedOpInput = DistributiveOmit<QueuedOp, 'id' | 'at'>;

export interface QueueHandlers {
  addExpense: (input: ExpenseInput, receipts: string[]) => Promise<void>;
  updateExpense: (expenseId: string, input: ExpenseInput) => Promise<void>;
  deleteExpense: (expenseId: string, groupId: string) => Promise<void>;
  addPayment: (input: PaymentInput) => Promise<void>;
}

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function load(): Promise<QueuedOp[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedOp[]) : [];
  } catch {
    // Poškozená fronta se zahodí — je to horší než ji mít, ale lepší než
    // appku, která kvůli ní nenastartuje.
    return [];
  }
}

async function save(ops: QueuedOp[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  } catch (e) {
    // nevadí — přijde se na to při dalším pokusu
    console.warn('[queue] uložení fronty operací selhalo:', String(e));
  }
}

export async function enqueue(op: QueuedOpInput): Promise<number> {
  const ops = await load();
  ops.push({ ...op, id: newId(), at: new Date().toISOString() } as QueuedOp);
  await save(ops);
  return ops.length;
}

export async function count(): Promise<number> {
  return (await load()).length;
}

export async function clear(): Promise<void> {
  await save([]);
}

/**
 * Zkusí odeslat frontu. Vrací, kolik položek zbývá.
 *
 * Při první chybě se ZASTAVÍ a zbytek nechá na příště — pořadí je důležité
 * a opakované bušení do nedostupného serveru nikomu nepomůže.
 */
export async function flush(h: QueueHandlers): Promise<number> {
  let ops = await load();
  if (!ops.length) return 0;

  while (ops.length) {
    const op = ops[0];
    try {
      if (op.kind === 'expense.add') await h.addExpense(op.input, op.receipts);
      else if (op.kind === 'expense.update') await h.updateExpense(op.expenseId, op.input);
      else if (op.kind === 'expense.delete') await h.deleteExpense(op.expenseId, op.groupId);
      else if (op.kind === 'payment.add') await h.addPayment(op.input);
      ops = ops.slice(1);
      await save(ops);
    } catch (e) {
      if (isPermanent(e)) {
        // Zápis, který server odmítl z věcného důvodu (smazaná skupina,
        // odebraný člen), se opakováním nespraví. Zahodíme ho, ať neblokuje
        // frontu donekonečna.
        ops = ops.slice(1);
        await save(ops);
        continue;
      }
      break; // nejspíš pořád offline — zkusíme to příště
    }
  }
  return ops.length;
}

/**
 * Je chyba trvalá (nemá smysl opakovat), nebo dočasná (výpadek sítě)?
 *
 * Rozhodujeme podle HTTP kódu: 4xx kromě 408/429 je věcné odmítnutí,
 * všechno ostatní (včetně chybějící odpovědi) bereme jako výpadek.
 */
function isPermanent(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  if (typeof status !== 'number') return false;
  if (status === 408 || status === 429) return false;
  return status >= 400 && status < 500;
}

/** Je chyba způsobená tím, že nejsme online? */
export function looksOffline(e: unknown): boolean {
  const msg = String((e as Error)?.message || '').toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('connection') ||
    !(e as { status?: number })?.status
  );
}
