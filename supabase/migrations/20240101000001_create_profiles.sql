-- ============================================================
-- Migration: Criar tabela profiles e trigger de auto-cadastro
-- Projeto: ControlMarket
-- ============================================================

-- 1. Criar tabela de perfis de usuários
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  name text,
  phone text,
  business_name text,
  status text default 'trial',
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garantir colunas adicionais se a tabela já existia
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists status text default 'trial';
alter table public.profiles add column if not exists trial_ends_at timestamp with time zone;

-- 2. Habilitar RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Políticas de acesso
drop policy if exists "Permitir leitura para todos" on public.profiles;
create policy "Permitir leitura para todos" on public.profiles
  for select using (true);

drop policy if exists "Permitir criação própria" on public.profiles;
create policy "Permitir criação própria" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Permitir alteração própria" on public.profiles;
create policy "Permitir alteração própria" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Controle administrativo total" on public.profiles;
create policy "Controle administrativo total" on public.profiles
  for all using (true) with check (true);

-- 3. Função automática para capturar dados do Auth Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone, business_name, status, trial_ends_at, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'business_name', ''),
    'trial',
    (new.created_at + interval '7 days'),
    new.created_at
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(nullif(excluded.name, ''), profiles.name),
    phone = coalesce(nullif(excluded.phone, ''), profiles.phone),
    business_name = coalesce(nullif(excluded.business_name, ''), profiles.business_name);
  return new;
end;
$$;

-- 4. Vincular trigger ao cadastro do Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
