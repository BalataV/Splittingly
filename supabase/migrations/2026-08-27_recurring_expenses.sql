-- ============================================================================
-- Recurring expenses (Pro) — šablona výdaje, který se opakuje podle rozvrhu.
--
-- NENÍ NASAZENO. Čeká na schválení a na přístupový token. Zrcadleno
-- do `supabase/schema.sql`.
--
-- Princip omezení: automatizace je perk plátce. Free uživatel ten samý
-- výdaj přidá ručně, takže se neomezuje nic, co se dotkne ostatních členů
-- skupiny (viz `src/entitlements.ts`).
-- ============================================================================

-- --------------------------------------------------------------- TABULKA ---
create table if not exists public.recurring_expenses (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups(id) on delete cascade,
  -- Odkaz na členy přes ID (jako u `expenses`); jména se doplní při generování.
  payer_id       uuid references public.group_members(id),
  part_ids       uuid[] not null default '{}',
  amount_minor   bigint not null,                       -- MINOR UNITS, celé číslo
  currency       text not null default 'EUR',
  description    text not null,
  category       text not null default 'other',
  -- weekly  = každých N týdnů
  -- monthly = každých N měsíců (na `anchor_day`, zkrácený měsíc se ořízne)
  -- interval= každých N dní
  cadence        text not null default 'monthly'
                   check (cadence in ('weekly', 'monthly', 'interval')),
  interval_count int not null default 1 check (interval_count between 1 and 366),
  anchor_day     int check (anchor_day between 1 and 31),   -- jen pro 'monthly', jinak NULL
  next_run       timestamptz not null,                      -- kdy vzniká další výdaj
  active         boolean not null default true,
  -- `on delete set null`: smazání účtu autora nesmí shodit šablonu ani
  -- historii (past z auditu 2026-08-27 — FK bez `on delete` = NO ACTION).
  -- Nová tabulka má FK rovnou s `on delete set null`, proto ji
  -- `delete_my_account()` nemusí ručně nulovat jako starší tabulky.
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists recurring_group_idx on public.recurring_expenses(group_id);
create index if not exists recurring_due_idx   on public.recurring_expenses(next_run) where active;

-- Vazba vygenerovaného výdaje na šablonu. U ručních výdajů zůstává NULL.
-- `on delete set null`: smazání šablony NESMÍ smazat výdaje, které už drží
-- ostatním bilance (stejný princip „nuluj, nemaž" jako u mazání účtu).
alter table public.expenses
  add column if not exists recurring_id uuid
    references public.recurring_expenses(id) on delete set null;

-- ------------------------------------------------------------------- RPC ---
-- Vytvoří výdaje ze všech šablon, kterým dozrál `next_run`. Volá klient při
-- otevření skupiny. Vrací počet vytvořených výdajů.
--
-- Idempotentní: `next_run` se posouvá dopředu, takže druhé zavolání ve
-- stejném období nic nevytvoří. `for update skip locked` ochrání před
-- dvojím během, když skupinu otevřou dva členové naráz.
create or replace function public.run_due_recurring(p_group_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row      public.recurring_expenses;
  v_new_id   uuid;
  v_created  int := 0;
  v_guard    int;
  v_base     timestamptz;
  v_last_day int;
begin
  -- SECURITY DEFINER obchází RLS, takže členství si ověřujeme sami.
  if not public.is_group_member(p_group_id) then
    raise exception 'NOT_A_MEMBER';
  end if;

  for v_row in
    select * from public.recurring_expenses
     where group_id = p_group_id and active and next_run <= now()
     for update skip locked
  loop
    v_guard := 0;

    -- Jedna smyčka přes všechna zmeškaná období. Prvních 60 kroků vytvoří
    -- výdaj, zbytek (po extrémně dlouhé pauze) jen posune `next_run`
    -- dopředu, ať dlouhá pauza nezaplaví skupinu stovkami řádků. Posun
    -- data je pořád stejný blok, takže `anchor_day` se u monthly aplikuje
    -- i ve skip-ahead části a den v měsíci nezůstane natrvalo posunutý.
    while v_row.next_run <= now() loop
      if v_guard < 60 then
        insert into public.expenses (
          group_id, description, amount_minor, currency,
          payer_id, part_ids, payer_name, part_names,
          split_type, category, spent_at, created_by, recurring_id
        )
        select
          v_row.group_id, v_row.description, v_row.amount_minor, v_row.currency,
          v_row.payer_id, v_row.part_ids,
          coalesce((select name from public.group_members where id = v_row.payer_id), ''),
          coalesce((select array_agg(m.name order by p.ord)
                      from unnest(v_row.part_ids) with ordinality as p(pid, ord)
                      join public.group_members m on m.id = p.pid), '{}'),
          'equal', v_row.category, v_row.next_run, v_row.created_by, v_row.id
        returning id into v_new_id;

        -- Aby řádek dával smysl na obrazovce HISTORY.
        insert into public.expense_audit (expense_id, group_id, actor_id, actor_name, action)
        values (v_new_id, v_row.group_id, v_row.created_by, 'Recurring', 'created');

        v_created := v_created + 1;
        v_guard   := v_guard + 1;
      end if;

      -- Posun `next_run` na další období (vždy stejně, i po strop 60).
      if v_row.cadence = 'weekly' then
        v_row.next_run := v_row.next_run + make_interval(weeks => v_row.interval_count);
      elsif v_row.cadence = 'interval' then
        v_row.next_run := v_row.next_run + make_interval(days => v_row.interval_count);
      else  -- monthly
        v_base := v_row.next_run + make_interval(months => v_row.interval_count);
        if v_row.anchor_day is not null then
          v_last_day := extract(day from (date_trunc('month', v_base)
                                          + interval '1 month' - interval '1 day'))::int;
          v_row.next_run := date_trunc('month', v_base)
                          + make_interval(days => least(v_row.anchor_day, v_last_day) - 1)
                          + (v_row.next_run - date_trunc('day', v_row.next_run));
        else
          v_row.next_run := v_base;
        end if;
      end if;
    end loop;

    update public.recurring_expenses set next_run = v_row.next_run where id = v_row.id;
  end loop;

  return v_created;
end;
$fn$;

-- ------------------------------------------------------------------- RLS ---
-- Stejný model jako `expenses`: všechno jen členům skupiny.
alter table public.recurring_expenses enable row level security;

drop policy if exists "recurring_select" on public.recurring_expenses;
drop policy if exists "recurring_insert" on public.recurring_expenses;
drop policy if exists "recurring_update" on public.recurring_expenses;
drop policy if exists "recurring_delete" on public.recurring_expenses;
create policy "recurring_select" on public.recurring_expenses for select
  using (public.is_group_member(group_id));
create policy "recurring_insert" on public.recurring_expenses for insert
  with check (public.is_group_member(group_id));
create policy "recurring_update" on public.recurring_expenses for update
  using (public.is_group_member(group_id));
create policy "recurring_delete" on public.recurring_expenses for delete
  using (public.is_group_member(group_id));

-- Živá synchronizace: šablona přidaná jedním členem se objeví ostatním.
alter publication supabase_realtime add table public.recurring_expenses;
