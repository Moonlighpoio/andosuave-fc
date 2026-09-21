-- ============================================================
-- ANDO SUAVE FC · Esquema de base de datos (Supabase / PostgreSQL)
-- Ejecuta este script completo en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. Configuración del club (correo del ÚNICO administrador)
--    >>> REEMPLAZA el correo de ejemplo por el correo real del club <<<
-- ------------------------------------------------------------
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);

insert into public.app_settings (key, value)
values ('admin_email', 'rbarriga.pino@gmail.com')
on conflict (key) do update set value = excluded.value;

-- Endurece la tabla de ajustes: solo la usan funciones internas (security definer)
alter table public.app_settings enable row level security;

-- ------------------------------------------------------------
-- 2. Tabla de perfiles (1 perfil por cada usuario registrado)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  nombre     text not null,
  role       text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Trigger: al registrarse un usuario, se crea su perfil.
--    Si el correo es el del administrador, queda con rol 'admin'.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_email text;
begin
  select value into v_admin_email
  from public.app_settings
  where key = 'admin_email';

  insert into public.profiles (id, email, nombre, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', 'Miembro'),
    case when new.email = v_admin_email then 'admin' else 'member' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 4. RLS (Row Level Security)
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

-- ¿El usuario actual es admin? (consulta la tabla de perfiles, segura)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Cada usuario puede leer su propio perfil
create policy "usuarios_leer_propio" on public.profiles
  for select using (auth.uid() = id);

-- Los administradores pueden leer todos los perfiles (panel de gestión)
create policy "admins_leer_todos" on public.profiles
  for select using (public.is_admin());

-- Cada usuario puede actualizar su propio perfil (ej: su nombre)
create policy "usuarios_actualizar_propio" on public.profiles
  for update using (auth.uid() = id);

-- NO se permite eliminar perfiles desde el cliente (anon key):
-- la baja real de un miembro se hace por la Edge Function delete-member
-- con la clave de servicio (ver carpeta supabase/functions).

-- ------------------------------------------------------------
-- 5. Replicación para lectura en tiempo real (opcional)
--    Devuelve completo el objeto de cambio al reescribir un perfil.
-- ------------------------------------------------------------
alter table public.profiles replica identity full;