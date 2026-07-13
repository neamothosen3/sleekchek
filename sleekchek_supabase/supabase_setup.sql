-- ============================================================================
-- SLEEKCHEK — Supabase setup
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste all of this → Run)
-- ============================================================================

-- 1. Products table -----------------------------------------------------------
create table if not exists products (
  id bigint generated always as identity primary key,
  title text not null,
  category text not null,           -- Tshirt / Man Shirt / Kids Tshirt / Woman Oversize Tshirt
  price integer not null,           -- BDT, stored as integer taka
  old_price integer,
  description text default '',
  sizes text[] not null default '{}',
  image_url text,                   -- public Supabase Storage URL
  tag text,                         -- e.g. "New", "Sale"
  created_at timestamptz default now()
);

alter table products enable row level security;

-- Anyone (including logged-out shoppers) can read products.
create policy "Public read access"
  on products for select
  using (true);

-- Only logged-in admin users (Supabase Auth) can add/edit/delete.
create policy "Authenticated insert"
  on products for insert
  to authenticated
  with check (true);

create policy "Authenticated update"
  on products for update
  to authenticated
  using (true);

create policy "Authenticated delete"
  on products for delete
  to authenticated
  using (true);

-- 2. Storage bucket for product images ----------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Authenticated upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
