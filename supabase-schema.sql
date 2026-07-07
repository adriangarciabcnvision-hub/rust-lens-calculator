-- ============================================================
-- RUST Lens Calculator - Esquema de base de datos Supabase
-- Ejecutar UNA VEZ en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists cameras (
  id text primary key,
  name text not null unique,
  sensor_width numeric not null,
  sensor_height numeric not null,
  pixel_size numeric not null,
  resolution_h integer not null default 0,
  resolution_v integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists lenses (
  id text primary key,
  name text not null unique,
  focal_length numeric not null,
  aperture text,
  created_at timestamptz not null default now()
);

create table if not exists catalog_requests (
  id text primary key,
  type text not null check (type in ('camera', 'lens')),
  requested_by text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Herramienta interna: acceso abierto con la anon key (los roles se gestionan en la app).
alter table cameras enable row level security;
alter table lenses enable row level security;
alter table catalog_requests enable row level security;

drop policy if exists "acceso total cameras" on cameras;
create policy "acceso total cameras" on cameras for all using (true) with check (true);

drop policy if exists "acceso total lenses" on lenses;
create policy "acceso total lenses" on lenses for all using (true) with check (true);

drop policy if exists "acceso total requests" on catalog_requests;
create policy "acceso total requests" on catalog_requests for all using (true) with check (true);
