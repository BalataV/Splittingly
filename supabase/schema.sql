-- ============================================================================
-- Splittingly — databázové schéma pro Supabase
-- Vlož celý tento soubor do Supabase: SQL Editor → New query → Run
--
-- KLÍČOVÉ ROZHODNUTÍ: peníze se ukládají v MINOR UNITS (celá čísla).
-- 12,34 EUR = 1234. 1000 JPY = 1000 (jen má 0 desetinných míst).
-- Nikdy float — jinak se dělení na tři nikdy nesečte zpátky na celek.
-- Kolik má měna desetinných míst ví klient (src/currencies.ts).
-- ============================================================================

-- ---------------------------------------------------------------- TABULKY ---

-- Profil = uživatel + všechna jeho nastavení (jazyk, měna, vzhled, notifikace).
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  display_name      text,
  avatar_color      text not null default '#1F49FF',
  -- předvolby (jazyk a měna jsou ZÁMĚRNĚ nezávislé — appka italsky, počítání v THB)
  lang              text not null default 'en',
  currency          text not null default 'EUR',
  theme             text not null default 'acid',       -- acid | mint | neon | dusk
  mode              text not null default 'system',     -- light | dark | system
  text_size         text not null default 'medium',     -- small | medium | large
  notif_expense     boolean not null default true,
  notif_settled     boolean not null default true,
  notif_edited      boolean not null default true,
  notif_weekly      boolean not null default false,
  notif_closer      boolean not null default true,      -- maskot "The Closer"
  notif_analyst     boolean not null default true,      -- maskot "The Analyst"
  quiet_from        int  not null default 23,           -- tiché hodiny 23:00-08:00
  quiet_to          int  not null default 8,
  personalised_ads  boolean not null default false,     -- ZÁMĚRNĚ vypnuto (screen 28)
  is_pro            boolean not null default false,
  pro_since         timestamptz,
  reward_theme      text,                               -- téma odemčené reklamou
  reward_until      timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  currency     text not null default 'EUR',
  cover_color  text not null default '#FFE500',
  share_code   text unique not null,
  created_by   uuid references auth.users(id),
  archived     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  name       text not null,
  color      text,
  user_id    uuid references auth.users(id),
  role       text not null default 'member',
  -- "former member": člen odejde, ale jeho výdaje ve skupině zůstanou,
  -- aby ostatním seděly bilance (viz obrazovka 29 Delete account).
  left_at    timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, name)
);
create unique index if not exists group_members_group_user_uniq
  on public.group_members(group_id, user_id) where user_id is not null;

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups(id) on delete cascade,
  description   text not null,
  amount_minor  bigint not null,                 -- viz poznámka nahoře
  currency      text not null default 'EUR',
  -- Odkaz na členy přes ID; jména jsou jen popisek pro případ nezmigrovaného řádku.
  payer_id      uuid references public.group_members(id),
  part_ids      uuid[] not null default '{}',
  payer_name    text not null,
  part_names    text[] not null default '{}',
  split_type    text not null default 'equal',   -- equal | shares | exact
  shares        int[],                           -- pro 'shares': počet podílů na osobu
  exact_minor   bigint[],                        -- pro 'exact': přesná částka na osobu
  category      text not null default 'other',
  spent_at      timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  edit_count    int not null default 0
);
create index if not exists expenses_group_idx on public.expenses(group_id, spent_at desc);

-- Účtenek může být k výdaji víc (Pro = neomezeně).
create table if not exists public.expense_receipts (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  url        text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Audit stopa: kdo, co, z čeho na co, kdy (obrazovka 15 "HISTORY").
create table if not exists public.expense_audit (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  actor_id   uuid references auth.users(id),
  actor_name text,
  action     text not null,                      -- created | edited | deleted
  field      text,
  old_value  text,
  new_value  text,
  created_at timestamptz not null default now()
);
create index if not exists expense_audit_group_idx on public.expense_audit(group_id, created_at desc);

-- Vyrovnání dluhu. Appka peníze NEPŘEVÁDÍ, jen zaznamenává, že k platbě došlo.
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  from_id      uuid references public.group_members(id),
  to_id        uuid references public.group_members(id),
  from_name    text not null,
  to_name      text not null,
  amount_minor bigint not null,
  currency     text not null default 'EUR',
  method       text not null default 'cash',     -- cash | transfer | other
  note         text,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create table if not exists public.push_tokens (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  token      text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------- POMOCNÉ FUNKCE ---

-- Jsem členem skupiny? SECURITY DEFINER obejde RLS → žádná rekurze v politikách.
create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer set search_path = public as $fn$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid() and left_at is null
  );
$fn$;

-- Náhled skupiny podle kódu — kdo už uvnitř je (obrazovka 10 Join group).
create or replace function public.group_preview(code text)
returns table (group_id uuid, group_name text, group_currency text, cover_color text,
               member_name text, claimed boolean, is_me boolean)
language sql security definer set search_path = public as $fn$
  select g.id, g.name, g.currency, g.cover_color,
         m.name, (m.user_id is not null), (m.user_id = auth.uid())
  from public.groups g
  join public.group_members m on m.group_id = g.id and m.left_at is null
  where g.share_code = upper(code) and g.archived = false
  order by m.created_at;
$fn$;

-- Připojení kódem: buď zaberu volné jméno (claim_name), nebo přidám nové (new_name).
create or replace function public.join_group_choose(code text, claim_name text, new_name text)
returns uuid language plpgsql security definer set search_path = public as $fn$
declare gid uuid; dname text;
begin
  select id into gid from public.groups where share_code = upper(code) and archived = false;
  if gid is null then raise exception 'GROUP_NOT_FOUND'; end if;

  -- Už členem? Vrať skupinu, nic nedělej (idempotentní — odkaz jde otevřít víckrát).
  if exists (select 1 from public.group_members
             where group_id = gid and user_id = auth.uid() and left_at is null) then
    return gid;
  end if;

  if claim_name is not null then
    update public.group_members
       set user_id = auth.uid()
     where group_id = gid and name = claim_name and user_id is null and left_at is null;
    if not found then raise exception 'NAME_ALREADY_TAKEN'; end if;
  else
    select display_name into dname from public.profiles where id = auth.uid();
    insert into public.group_members(group_id, name, user_id, role)
    values (gid, coalesce(nullif(new_name, ''), dname, 'New member'), auth.uid(), 'member');
  end if;
  return gid;
end;
$fn$;

-- Jednoduché připojení bez výběru jména (odkaz z pozvánky).
create or replace function public.join_group_by_code(code text)
returns uuid language plpgsql security definer set search_path = public as $fn$
begin
  return public.join_group_choose(code, null, null);
end;
$fn$;

-- Push tokeny ostatních členů skupiny (kromě mého).
create or replace function public.group_push_tokens(p_group_id uuid)
returns table (token text)
language sql security definer set search_path = public as $fn$
  select t.token
  from public.push_tokens t
  join public.group_members m on m.user_id = t.user_id
  where m.group_id = p_group_id and m.left_at is null and t.user_id <> auth.uid()
    and public.is_group_member(p_group_id);
$fn$;

-- GDPR: smazání účtu. Výdaje ZŮSTÁVAJÍ ve skupině pod "former member",
-- aby ostatním členům seděly bilance; osobní vazba (user_id) se zruší.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'NOT_SIGNED_IN'; end if;
  update public.group_members
     set user_id = null, left_at = now(), name = 'Former member ' || left(id::text, 4)
   where user_id = uid;
  delete from public.push_tokens where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$fn$;

-- ------------------------------------------ ZABEZPEČENÍ (Row Level Security) ---

alter table public.profiles         enable row level security;
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.expenses         enable row level security;
alter table public.expense_receipts enable row level security;
alter table public.expense_audit    enable row level security;
alter table public.payments         enable row level security;
alter table public.push_tokens      enable row level security;

drop policy if exists "profiles_select"      on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_select"      on public.profiles for select using (true);
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);

-- Pro si NIKDO nezapne sám.
--
-- Politika výš pouští uživatele na jeho vlastní řádek, jenže RLS pracuje
-- po ŘÁDCÍCH, ne po sloupcích — bez tohohle by si kdokoli poslal
-- `update profiles set is_pro = true` a Edge Funkce `verify-purchase`
-- by byla jen ozdoba.
--
-- ⚠️ Nestačí `revoke update (is_pro, pro_since)`. Postgres bere práva
-- jako součet: kdo má UPDATE na CELOU tabulku, smí měnit každý sloupec
-- a sloupcový revoke se na něm neprojeví. Supabase přitom roli
-- `authenticated` tabulkové UPDATE ve výchozím stavu dává. Musí se tedy
-- napřed sebrat celé a pak vrátit po sloupcích — bez těch dvou.
--
-- Zapisuje je jedině servisní klíč po ověření účtenky u Googlu / Applu.
revoke update on public.profiles from authenticated, anon;
grant update (
  email, display_name, avatar_color,
  lang, currency, theme, mode, text_size,
  notif_expense, notif_settled, notif_edited, notif_weekly,
  notif_closer, notif_analyst, quiet_from, quiet_to,
  personalised_ads, reward_theme, reward_until
) on public.profiles to authenticated;

-- `id` a `created_at` schválně chybí taky: identita řádku a čas vzniku
-- nejsou předvolby a klient nemá důvod je přepisovat.

drop policy if exists "groups_select_member" on public.groups;
drop policy if exists "groups_insert_own"    on public.groups;
drop policy if exists "groups_update_member" on public.groups;
create policy "groups_select_member" on public.groups for select
  using (public.is_group_member(id) or created_by = auth.uid());
create policy "groups_insert_own"    on public.groups for insert with check (created_by = auth.uid());
create policy "groups_update_member" on public.groups for update using (public.is_group_member(id));

drop policy if exists "members_select" on public.group_members;
drop policy if exists "members_insert" on public.group_members;
drop policy if exists "members_update" on public.group_members;
drop policy if exists "members_delete" on public.group_members;
create policy "members_select" on public.group_members for select
  using (public.is_group_member(group_id) or user_id = auth.uid());
create policy "members_insert" on public.group_members for insert with check (
  exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid())
  or public.is_group_member(group_id) or user_id = auth.uid()
);
create policy "members_update" on public.group_members for update using (public.is_group_member(group_id));
create policy "members_delete" on public.group_members for delete using (public.is_group_member(group_id));

drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_delete" on public.expenses;
create policy "expenses_select" on public.expenses for select using (public.is_group_member(group_id));
create policy "expenses_insert" on public.expenses for insert with check (public.is_group_member(group_id));
create policy "expenses_update" on public.expenses for update using (public.is_group_member(group_id));
create policy "expenses_delete" on public.expenses for delete using (public.is_group_member(group_id));

drop policy if exists "receipts_select" on public.expense_receipts;
drop policy if exists "receipts_insert" on public.expense_receipts;
drop policy if exists "receipts_delete" on public.expense_receipts;
create policy "receipts_select" on public.expense_receipts for select using (public.is_group_member(group_id));
create policy "receipts_insert" on public.expense_receipts for insert with check (public.is_group_member(group_id));
create policy "receipts_delete" on public.expense_receipts for delete using (public.is_group_member(group_id));

drop policy if exists "audit_select" on public.expense_audit;
drop policy if exists "audit_insert" on public.expense_audit;
create policy "audit_select" on public.expense_audit for select using (public.is_group_member(group_id));
create policy "audit_insert" on public.expense_audit for insert with check (public.is_group_member(group_id));

drop policy if exists "payments_select" on public.payments;
drop policy if exists "payments_insert" on public.payments;
drop policy if exists "payments_delete" on public.payments;
create policy "payments_select" on public.payments for select using (public.is_group_member(group_id));
create policy "payments_insert" on public.payments for insert with check (public.is_group_member(group_id));
create policy "payments_delete" on public.payments for delete using (public.is_group_member(group_id));

drop policy if exists "push_own" on public.push_tokens;
create policy "push_own" on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------- ŽIVÁ SYNCHRONIZACE ---
-- Realtime: změny ve skupině se objeví ostatním okamžitě, bez tahání za obrazovku.
-- (Když už tabulka v publikaci je, Postgres zahlásí chybu — pak tenhle blok přeskoč.)
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.expense_receipts;

-- ------------------------------------------------------- ÚLOŽIŠTĚ FOTEK ---
-- Bucket "receipts" vytvoř ručně: Storage → New bucket → název "receipts" → PUBLIC.
drop policy if exists "receipts_upload" on storage.objects;
create policy "receipts_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts');
drop policy if exists "receipts_remove" on storage.objects;
create policy "receipts_remove" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and owner = auth.uid());

-- ------------------------------------------- PROFIL PŘI REGISTRACI (trigger) ---
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name',
                   new.raw_user_meta_data->>'name',
                   split_part(coalesce(new.email, 'friend@'), '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$fn$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
