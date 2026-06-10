-- ============================================================
-- ControlMarket — Script SQL Completo para o Supabase
-- Execute no SQL Editor: https://supabase.com/dashboard/project/zjwpoxqymtvpttoswzhj/sql
-- ============================================================

-- ========================
-- TABELA: profiles
-- ========================
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

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists status text default 'trial';
alter table public.profiles add column if not exists trial_ends_at timestamp with time zone;

alter table public.profiles enable row level security;

drop policy if exists "Permitir leitura para todos" on public.profiles;
create policy "Permitir leitura para todos" on public.profiles for select using (true);

drop policy if exists "Permitir criação própria" on public.profiles;
create policy "Permitir criação própria" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Permitir alteração própria" on public.profiles;
create policy "Permitir alteração própria" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Controle administrativo total" on public.profiles;
create policy "Controle administrativo total" on public.profiles for all using (true) with check (true);

-- ========================
-- TABELA: products
-- ========================
create table if not exists public.products (
  id text not null primary key,
  user_id uuid references auth.users not null,
  name text not null,
  price text not null,
  stock text not null,
  barcode text,
  cost_price text,
  profit_margin text,
  min_stock text,
  image_url text,
  updated_at text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products enable row level security;

drop policy if exists "Users can manage their own products" on public.products;
create policy "Users can manage their own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists products_user_id_idx on public.products (user_id);

-- ========================
-- TABELA: sales
-- ========================
create table if not exists public.sales (
  id text not null primary key,
  user_id uuid references auth.users not null,
  date timestamp with time zone not null,
  items jsonb not null,
  total text not null,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sales enable row level security;

drop policy if exists "Users can manage their own sales" on public.sales;
create policy "Users can manage their own sales" on public.sales
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists sales_user_id_idx on public.sales (user_id);
create index if not exists sales_date_idx on public.sales (date desc);

-- ========================
-- REALTIME
-- ========================
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.profiles;

-- ========================
-- TRIGGER: Auto-cadastro no signup
-- ========================
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CONCLUÍDO! Todas as tabelas e configurações foram aplicadas.
-- ============================================================
