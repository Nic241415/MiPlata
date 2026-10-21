-- Mi Plata: tabla donde se guardan los datos de cada persona.
-- Cómo usarlo: en Supabase abre "SQL Editor" → "New query", pega TODO este archivo y toca "Run".
-- Se puede correr más de una vez sin dañar nada.

create table if not exists public.docs (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  col        text        not null,  -- colección: accounts, txs, goals…
  id         text        not null,  -- identificador del documento dentro de la colección
  data       jsonb       not null,  -- el documento
  updated_at timestamptz not null default now(),
  primary key (user_id, col, id)
);

-- Seguridad: cada persona solo puede ver y cambiar SUS filas.
alter table public.docs enable row level security;

drop policy if exists "docs: ver lo mío"     on public.docs;
drop policy if exists "docs: crear lo mío"   on public.docs;
drop policy if exists "docs: cambiar lo mío" on public.docs;
drop policy if exists "docs: borrar lo mío"  on public.docs;

create policy "docs: ver lo mío"     on public.docs for select to authenticated using ((select auth.uid()) = user_id);
create policy "docs: crear lo mío"   on public.docs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "docs: cambiar lo mío" on public.docs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "docs: borrar lo mío"  on public.docs for delete to authenticated using ((select auth.uid()) = user_id);

-- Solo las personas con sesión iniciada pueden usar la tabla (nadie anónimo).
revoke all on public.docs from anon;
grant select, insert, update, delete on public.docs to authenticated;
