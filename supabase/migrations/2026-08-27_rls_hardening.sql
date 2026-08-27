-- ============================================================================
-- RLS hardening — audit 2026-08-27, body S1 a S2
--
-- NENÍ NASAZENO. Chybí přístupový token; migraci pustí lead ručně
-- (SQL Editor → New query → Run, nebo `supabase db push`) až po živém
-- ověření proti běžícímu RLS.
--
-- Obsah se zrcadlí i do `supabase/schema.sql`, aby čistá instalace
-- odpovídala nasazenému stavu.
-- ============================================================================

-- ------------------------------------------------------------------------ S1 ---
-- Otevřené čtení celé tabulky `profiles`.
--
-- `using (true)` bez klauzule `to` platilo i pro roli `anon`, takže kdokoli
-- s veřejným anon klíčem z app bundlu si přečetl `select * from profiles` —
-- e-maily, jména a `is_pro` všech uživatelů. GDPR únik.
--
-- Ověřeno grepem v `src/`: aplikace nikdy nečte cizí profil.
--   • src/api/auth.ts:163  fetchProfile   → .eq('id', u.user.id)      (jen vlastní)
--   • src/api/auth.ts:173  updateProfile  → .eq('id', u.user.id)      (jen vlastní)
--   • src/api/expenses.ts:190  logAudit   → .eq('id', u.user?.id)     (jen vlastní)
--   • žádný .tsx nesahá na `profiles` přímo
--   • RPC `group_preview` čte jen `groups` + `group_members`, ne `profiles`
--   • `profiles` není v `supabase_realtime` publikaci
-- Jména členů drží `group_members`, `is_pro` se dotýká jen UI plátce —
-- nikdo jiný cizí profil nepotřebuje.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id);

-- ------------------------------------------------------------------------ S2 ---
-- Self-join do libovolné skupiny.
--
-- Větev `or user_id = auth.uid()` v `with check` dovolovala klientovi
-- `insert into group_members {group_id: <cizí UUID>, user_id: <já>}` a obejít
-- připojení kódem. Pak `is_group_member` odemklo všechny výdaje a platby
-- té skupiny.
--
-- Ověřeno, že legitimní cesty tuhle větev nepotřebují:
--   • createGroup (src/api/groups.ts:54-69) — skupina se vloží s
--     `created_by = auth.uid()`, členské řádky (včetně vlastního s user_id)
--     kryje větev `exists (... g.created_by = auth.uid())`
--   • addMember (src/api/groups.ts:123) — insert bez `user_id`, volá ho člen
--     skupiny → kryje `public.is_group_member(group_id)`
--   • připojení kódem — RPC `join_group_choose` je SECURITY DEFINER a RLS
--     obchází úplně
drop policy if exists "members_insert" on public.group_members;
create policy "members_insert" on public.group_members for insert with check (
  exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid())
  or public.is_group_member(group_id)
);
