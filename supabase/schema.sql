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

-- Seguridad: cada persona solo puede ver y cambiar SUS filas (los administradores, más abajo, solo pueden ver las de todos).
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

-- ---------------------------------------------------------------------------
-- Administradores: pueden VER (solo ver, nunca cambiar ni borrar) los datos de todas las personas,
-- desde el panel "Administración" de la app.
-- Nadie puede volverse administrador desde la app: solo se agrega aquí, en el SQL Editor (ver abajo).

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "admins: saber si soy admin" on public.admins;
create policy "admins: saber si soy admin" on public.admins for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- ¿La persona con sesión es administradora?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = (select auth.uid())) $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- El administrador puede leer las filas de todos (sigue sin poder cambiarlas ni borrarlas).
drop policy if exists "docs: el admin ve todo" on public.docs;
create policy "docs: el admin ve todo" on public.docs for select to authenticated using ((select public.is_admin()));

-- Lista de personas registradas (usuario/correo, fecha de registro y último ingreso). Solo para administradores.
create or replace function public.admin_users()
returns table (user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Solo para administradores' using errcode = '42501'; end if;
  return query select u.id, u.email::text, u.created_at, u.last_sign_in_at from auth.users u order by u.created_at;
end $$;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- Para volverte administrador: crea primero tu usuario en la app, luego quita los dos guiones
-- de la línea de abajo, cambia TU_USUARIO por tu nombre de usuario y corre solo esa línea.
-- insert into public.admins (user_id) select id from auth.users where email = lower('TU_USUARIO') || '@mp.local' on conflict do nothing;
