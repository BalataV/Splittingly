-- ============================================================================
-- Pro batch 2 — vlastní kategorie skupiny + zamčený FX kurz na výdaji.
--
-- NENÍ NASAZENO. Migraci pustí lead / uživatel ručně. Zrcadleno do
-- `supabase/schema.sql`.
--
-- Pro-gate obou featur je KLIENTSKÝ (`src/entitlements.ts`) — RLS o Pro neví.
-- Vědomý kompromis jako u `FREE_RECEIPTS_PER_EXPENSE`: kdo si pohraje s API,
-- kategorii si založí i bez Pro, ale nikoho jiného to nepoškodí.
-- ============================================================================

-- --------------------------------------------------- VLASTNÍ KATEGORIE ---
-- Kategorie je SDÍLENÁ: výdaj s ní vidí a používá celá skupina. Vytvořit
-- vlastní smí (klientsky) jen Pro; free má default kategorie z
-- `src/categories.ts` a vidí custom kategorie od Pro členů.
create table if not exists public.group_categories (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  name       text not null,
  -- Nová tabulka má FK rovnou s `on delete set null`, proto ji
  -- `delete_my_account()` nemusí ručně nulovat jako starší tabulky.
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
-- Jedno jméno na skupinu, bez ohledu na velikost písmen („Food" == „food").
create unique index if not exists group_categories_name_uniq
  on public.group_categories (group_id, lower(name));

alter table public.group_categories enable row level security;
drop policy if exists "categories_select" on public.group_categories;
drop policy if exists "categories_insert" on public.group_categories;
drop policy if exists "categories_update" on public.group_categories;
drop policy if exists "categories_delete" on public.group_categories;
create policy "categories_select" on public.group_categories for select using (public.is_group_member(group_id));
create policy "categories_insert" on public.group_categories for insert with check (public.is_group_member(group_id));
create policy "categories_update" on public.group_categories for update using (public.is_group_member(group_id));
create policy "categories_delete" on public.group_categories for delete using (public.is_group_member(group_id));

alter publication supabase_realtime add table public.group_categories;

-- ------------------------------------------------ ZAMČENÝ FX KURZ VÝDAJE ---
-- `fx_rate` = kolik jednotek `fx_ccy` odpovídá 1 jednotce měny výdaje
-- (`expenses.currency`), zafixováno v čase založení výdaje. Příklad: výdaj
-- v EUR, `fx_ccy = 'CZK'`, `fx_rate = 25.30` → 1 EUR = 25.30 CZK.
-- Oboje nullable; plní se jen u Pro při zakládání výdaje, jinak NULL.
-- Slouží k zobrazení částky v druhé měně bez pozdějšího pohybu kurzu —
-- s penězi se dál počítá VÝHRADNĚ v `amount_minor` (minor units měny výdaje).
alter table public.expenses
  add column if not exists fx_rate numeric,
  add column if not exists fx_ccy  text;

comment on column public.expenses.fx_rate is
  'Pro: zamčený převodní kurz v čase založení — kolik jednotek fx_ccy za 1 jednotku expenses.currency. Nullable.';
comment on column public.expenses.fx_ccy is
  'Pro: cílová měna zamčeného kurzu (ISO kód). Nullable. Nepočítá se z ní, jen zobrazuje.';
