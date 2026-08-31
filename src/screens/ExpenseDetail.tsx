// Obrazovka 15 — Detail výdaje a jeho historie.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Screen from '../components/Screen';
import { useUi, Card, Button, Rule, Avatar, HardShadow } from '../components/ui';
import { Money, MoneySlot, ApproxMoney } from '../components/Money';
import { ReceiptThumb } from '../components/Receipt';
import { useApp, CLOUD_MODE } from '../store';
import { expensesApi } from '../api';
import { t, fmtDate, fmtTime } from '../i18n';
import { shareOf, fmt, applyRate } from '../money';
import { decimalsOf } from '../currencies';
import { category } from '../categories';
import { initial, ME } from '../logic';
import { SPACE, BORDER } from '../theme';
import type { AuditEntry } from '../types';

export default function ExpenseDetail() {
  const { c, ty } = useUi();
  const { state, actions } = useApp();
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const gid = state.selectedGroup;
  const e = gid ? (state.expenses[gid] || []).find((x) => x.id === state.selectedExpense) : null;

  useEffect(() => {
    if (!CLOUD_MODE || !e) return;
    expensesApi.fetchAudit(e.id).then(setAudit).catch(() => undefined);
  }, [e?.id]);

  if (!e) {
    return <Screen title={t('EXPENSE')} onBack={actions.goBack}><Text style={{ color: c.text }}>{t('Not found.')}</Text></Screen>;
  }

  const cat = category(e.category);

  return (
    <Screen
      title={t('EXPENSE')}
      onBack={actions.goBack}
      right={
        <Pressable onPress={() => actions.startEditExpense(e.id)} hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={[ty('rowTitle'), { color: c.primary }]}>{t('Edit')}</Text>
        </Pressable>
      }
    >
      <HardShadow offset={5}>
        <View style={{ backgroundColor: c.surface, borderWidth: BORDER.card, borderColor: c.border, padding: 14, gap: SPACE.md }}>
          <View style={{ flexDirection: 'row', gap: SPACE.md, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, backgroundColor: c.accent, borderWidth: BORDER.small, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>{cat.glyph}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: 'ArchivoBlack_400Regular', fontSize: 20, color: c.text }}>{e.desc}</Text>
              <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                {fmtDate(e.spentAt)} · {fmtTime(e.spentAt)} · {t(cat.label)}
              </Text>
            </View>
          </View>

          <Money amountMinor={e.amountMinor} currency={e.currency} role="sectionAmount" style={{ fontSize: 34, textAlign: 'left' }} />
          {/* Zamčený kurz (Pro) přebíjí živý „≈" jen pro toho, kdo ho zamkl
              (shoda s jeho zobrazovací měnou). Ostatní vidí dál živý přepočet. */}
          {e.fxRate != null && e.fxCcy && state.currency === e.fxCcy ? (
            <Text style={[ty('rowMeta'), { color: c.textMuted, marginTop: -6 }]}>
              {t('≈ {amount} (locked rate)', {
                amount: fmt(
                  applyRate(e.amountMinor, decimalsOf(e.currency), decimalsOf(e.fxCcy), e.fxRate),
                  e.fxCcy,
                ),
              })}
            </Text>
          ) : (
            <ApproxMoney amountMinor={e.amountMinor} currency={e.currency} style={{ marginTop: -6 }} />
          )}

          <Text style={[ty('caption'), { color: c.textMuted }]}>
            {e.payer === ME ? t('Paid by you') : t('Paid by {who}', { who: e.payer })} · {
              e.splitType === 'equal' ? t('split equally between {n}', { n: e.parts.length })
              : e.splitType === 'shares' ? t('split by shares between {n}', { n: e.parts.length })
              : t('split by exact amounts between {n}', { n: e.parts.length })
            }
          </Text>
        </View>
      </HardShadow>

      <Text style={[ty('label'), { color: c.textMuted, marginTop: SPACE.sm }]}>{t('WHO OWES WHAT')}</Text>

      <View style={{ borderWidth: BORDER.card, borderColor: c.border }}>
        {e.parts.map((p, i) => {
          const share = shareOf(e.amountMinor, e.parts, e.splitType, e.shares, e.exactMinor, e.payer, p);
          const isPayer = p === e.payer;
          const value = isPayer ? e.amountMinor - share : share;
          return (
            <View
              key={p}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
                padding: 11,
                borderTopWidth: i === 0 ? 0 : BORDER.inner, borderTopColor: c.dividerInner,
              }}
            >
              <Avatar initial={initial(p)} color={p === ME ? state.avatarColor : '#101010'} size={28} />
              <Text style={[ty('rowTitle'), { color: c.text, flex: 1 }]}>{p === ME ? t('You') : p}</Text>
              <MoneySlot>
                <Money amountMinor={value} currency={e.currency} color={isPayer ? c.positive : c.negative} />
                <Text style={[ty('rowMeta'), { color: isPayer ? c.positive : c.negative }]}>
                  {isPayer ? t('lent') : t('owes')}
                </Text>
              </MoneySlot>
            </View>
          );
        })}
      </View>

      {e.receipts.length > 0 && (
        <>
          <Text style={[ty('label'), { color: c.textMuted, marginTop: SPACE.sm }]}>{t('RECEIPTS')}</Text>
          <View style={{ flexDirection: 'row', gap: SPACE.sm, flexWrap: 'wrap' }}>
            {/* Ťuknutím se otevře přes celou obrazovku. Odebrat jde jen
                v editaci výdaje, ne odsud — tady se účtenka jen prohlíží. */}
            {e.receipts.map((url) => (
              <ReceiptThumb key={url} uri={url} size={78} />
            ))}
          </View>
        </>
      )}

      {e.editCount > 0 && (
        <Text style={[ty('caption'), { color: c.textMuted }]}>
          {t('Edited {n} times · tap for the full audit trail.', { n: e.editCount })}
        </Text>
      )}

      {audit.length > 0 && (
        <>
          <Text style={[ty('label'), { color: c.textMuted, marginTop: SPACE.sm }]}>{t('HISTORY')}</Text>
          <View style={{ gap: 6 }}>
            {audit.map((a) => (
              <View key={a.id} style={{ borderWidth: BORDER.small, borderColor: c.border, padding: 10, gap: 2 }}>
                <Text style={[ty('rowTitle'), { color: c.text }]}>
                  {a.actorName} · {t(a.action)}
                </Text>
                <Text style={[ty('rowMeta'), { color: c.textMuted }]}>
                  {a.field ? `${a.field}: ${a.oldValue || '—'} → ${a.newValue || '—'} · ` : ''}
                  {fmtDate(a.createdAt)} {fmtTime(a.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Rule style={{ marginTop: SPACE.lg }} />

      {/* Nájem, týdenní nákup — cokoliv pravidelného. Otevře se jako nový
          koncept k doladění, ne rovnou uložené (viz `duplicateExpense`). */}
      <Button label={t('Duplicate expense')} kind="plain" offset={0} onPress={() => actions.duplicateExpense(e.id)} />

      {/* Destruktivní akce: červený okraj, červený text, průhledná výplň —
          nikdy plná červená plocha, aby se na ni netrefil palec omylem. */}
      <Pressable onPress={() => actions.patch({ dialog: 'delete_expense' })}>
        <View style={{ borderWidth: BORDER.card, borderColor: c.negative, padding: 14, alignItems: 'center' }}>
          <Text style={[ty('button'), { color: c.negative }]}>{t('Delete expense')}</Text>
        </View>
      </Pressable>

      {state.dialog === 'delete_expense' && (
        <Card fill={c.negativeSurface} borderColor={c.negative}>
          <Text style={[ty('caption'), { color: c.isDark ? c.negativeTextOnSurface : c.negative }]}>
            {t('This removes the expense and recalculates every balance in the group.')}
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.md }}>
            <Button label={t('Cancel')} kind="plain" offset={0} onPress={() => actions.patch({ dialog: null })} style={{ flex: 1 }} />
            <Button label={t('Delete')} kind="negative" offset={0} onPress={() => actions.deleteExpense(e.id)} style={{ flex: 1 }} />
          </View>
        </Card>
      )}
    </Screen>
  );
}
