// CSV a PDF export skupiny. Pro appka bez Pro tohle nemá — `canExport()`
// v `entitlements.ts` rozhoduje, tenhle soubor jen umí obojí VYROBIT.
//
// PDF jde přes `expo-print` (HTML → PDF, appka žádný PDF formát nekreslí
// sama). CSV je čistý text zapsaný přes File/Directory API z
// `expo-file-system` (SDK 54). Obojí končí jako lokální soubor a nabídne
// se přes `expo-sharing` — stejná cesta, jakou appka už používá pro
// sdílecí kartičku (`ShareCard.tsx`).
//
// Číslo v CSV je ZÁMĚRNĚ bez tisícového oddělovače a s tečkou jako
// desetinnou čárkou (`fmtNumber` dává „1.234,56" podle měny appky — to by
// se v tabulkovém procesoru otevřeném v jiném národním nastavení mohlo
// přečíst úplně jinak). CSV musí být čitelné odkudkoli, ne jen z appky.

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { fmt } from './money';
import { decimalsOf, minorFactor } from './currencies';
import { fmtDate, t } from './i18n';
import { category } from './categories';
import { total, dominantCurrency, byCategory } from './stats';
import { transfersFor, currenciesIn, ME } from './logic';
import type { Group, Expense, Payment } from './types';

function displayName(name: string): string {
  return name === ME ? t('You') : name;
}

function rawNumber(amountMinor: number, code: string): string {
  return (amountMinor / minorFactor(code)).toFixed(decimalsOf(code));
}

function csvField(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(',');
}

function safeFilename(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'group';
}

// ---------------------------------------------------------------------- CSV

export function buildExpensesCsv(expenses: Expense[], payments: Payment[]): string {
  const lines: string[] = [];
  lines.push(csvRow(['Date', 'Type', 'Description', 'Amount', 'Currency', 'Paid by', 'Split with', 'Category']));

  [...expenses]
    .sort((a, b) => a.spentAt.localeCompare(b.spentAt))
    .forEach((e) => {
      lines.push(csvRow([
        fmtDate(e.spentAt),
        'Expense',
        e.desc,
        rawNumber(e.amountMinor, e.currency),
        e.currency,
        displayName(e.payer),
        e.parts.map(displayName).join(' / '),
        t(category(e.category).label),
      ]));
    });

  [...payments]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((p) => {
      lines.push(csvRow([
        fmtDate(p.createdAt),
        'Payment',
        `${displayName(p.from)} -> ${displayName(p.to)}`,
        rawNumber(p.amountMinor, p.currency),
        p.currency,
        displayName(p.from),
        displayName(p.to),
        '',
      ]));
    });

  // \r\n — CSV je historicky DOS řádkování, některé tabulkové procesory
  // bez něj první/poslední buňku slepí s okolím.
  return lines.join('\r\n');
}

// ---------------------------------------------------------------------- PDF

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildGroupPdfHtml(group: Group, expenses: Expense[], payments: Payment[]): string {
  const currencies = currenciesIn(expenses, payments, group.currency);
  const dom = dominantCurrency(expenses, group.currency);
  const cats = byCategory(expenses, dom);
  const transfers = transfersFor(group, expenses, payments);
  const sortedExpenses = [...expenses].sort((a, b) => b.spentAt.localeCompare(a.spentAt));

  const totalsRows = currencies
    .map((cur) => `<tr><td>${esc(cur)}</td><td class="num">${esc(fmt(total(expenses, cur), cur))}</td></tr>`)
    .join('');

  const catRows = cats
    .map((c) => `<tr><td>${esc(t(category(c.key).label))}</td><td class="num">${esc(fmt(c.amountMinor, dom))}</td><td class="num">${c.pct}%</td></tr>`)
    .join('');

  const transferRows = transfers.length
    ? transfers.map((tr) => `<tr><td>${esc(displayName(tr.from))} → ${esc(displayName(tr.to))}</td><td class="num">${esc(fmt(tr.amountMinor, tr.currency))}</td></tr>`).join('')
    : `<tr><td colspan="2" class="muted">${esc(t('Everyone is even.'))}</td></tr>`;

  const expenseRows = sortedExpenses
    .map((e) => `
      <tr>
        <td>${esc(fmtDate(e.spentAt))}</td>
        <td>${esc(e.desc)}</td>
        <td>${esc(t(category(e.category).label))}</td>
        <td>${esc(displayName(e.payer))}</td>
        <td>${esc(e.parts.map(displayName).join(', '))}</td>
        <td class="num">${esc(fmt(e.amountMinor, e.currency))}</td>
      </tr>`)
    .join('');

  const paymentRows = payments.length
    ? [...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => `
      <tr>
        <td>${esc(fmtDate(p.createdAt))}</td>
        <td colspan="4">${esc(displayName(p.from))} → ${esc(displayName(p.to))}</td>
        <td class="num">${esc(fmt(p.amountMinor, p.currency))}</td>
      </tr>`).join('')
    : '';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #101010; padding: 28px; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  .meta { color: #5F5F5F; font-size: 11px; margin-bottom: 20px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 8px; border-bottom: 2px solid #101010; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; color: #5F5F5F; padding: 4px 6px; border-bottom: 1px solid #ccc; }
  td { padding: 5px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.num, th.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .muted { color: #5F5F5F; }
  .brand { display: inline-block; background: #FFE500; border: 2px solid #101010; padding: 2px 8px; font-weight: 700; font-size: 11px; margin-bottom: 10px; }
</style>
</head>
<body>
  <div class="brand">SPLITTINGLY</div>
  <h1>${esc(group.name)}</h1>
  <div class="meta">${esc(t('Exported on {date}', { date: fmtDate(new Date().toISOString()) }))} · ${esc(group.members.map(displayName).join(', '))}</div>

  <h2>${esc(t('TOTALS'))}</h2>
  <table><tbody>${totalsRows}</tbody></table>

  ${cats.length ? `<h2>${esc(t('BY CATEGORY'))}</h2><table><tbody>${catRows}</tbody></table>` : ''}

  <h2>${esc(t('OUTSTANDING TRANSFERS'))}</h2>
  <table><tbody>${transferRows}</tbody></table>

  <h2>${esc(t('EXPENSES'))}</h2>
  <table>
    <thead><tr><th>${esc(t('Date'))}</th><th>${esc(t('Description'))}</th><th>${esc(t('Category'))}</th><th>${esc(t('Paid by'))}</th><th>${esc(t('Split with'))}</th><th class="num">${esc(t('Amount'))}</th></tr></thead>
    <tbody>${expenseRows}</tbody>
  </table>

  ${payments.length ? `<h2>${esc(t('PAYMENTS'))}</h2><table><tbody>${paymentRows}</tbody></table>` : ''}
</body>
</html>`;
}

// ---------------------------------------------------------- soubor + sdílení

export interface ExportedFile {
  uri: string;
  mimeType: string;
  filename: string;
}

export async function exportGroupCsv(group: Group, expenses: Expense[], payments: Payment[]): Promise<ExportedFile> {
  const csv = buildExpensesCsv(expenses, payments);
  const filename = `splittingly-${safeFilename(group.name)}.csv`;
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  return { uri: file.uri, mimeType: 'text/csv', filename };
}

export async function exportGroupPdf(group: Group, expenses: Expense[], payments: Payment[]): Promise<ExportedFile> {
  const html = buildGroupPdfHtml(group, expenses, payments);
  // A4, ne výchozí US Letter — appka je mezinárodní, většina uživatelů
  // mimo Severní Ameriku by dostala formát, který jim nesedí do tiskárny.
  const { uri } = await Print.printToFileAsync({ html, base64: false, width: 595, height: 842 });
  return { uri, mimeType: 'application/pdf', filename: `splittingly-${safeFilename(group.name)}.pdf` };
}
