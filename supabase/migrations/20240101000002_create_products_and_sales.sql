-- ============================================================
-- Migration: Criar tabelas products e sales com RLS
-- Projeto: ControlMarket
-- ============================================================

-- 1. Criar tabela de produtos
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

-- Habilitar RLS para produtos
alter table public.products enable row level security;

drop policy if exists "Users can manage their own products" on public.products;
create policy "Users can manage their own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índice de performance por user_id
create index if not exists products_user_id_idx on public.products (user_id);

-- 2. Criar tabela de vendas
create table if not exists public.sales (
  id text not null primary key,
  user_id uuid references auth.users not null,
  date timestamp with time zone not null,
  items jsonb not null,
  total text not null,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para vendas
alter table public.sales enable row level security;

drop policy if exists "Users can manage their own sales" on public.sales;
create policy "Users can manage their own sales" on public.sales
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Índice de performance por user_id e data
create index if not exists sales_user_id_idx on public.sales (user_id);
create index if not exists sales_date_idx on public.sales (date desc);

-- 3. Habilitar Realtime para as tabelas
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.profiles;
