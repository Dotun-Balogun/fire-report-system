-- =====================================================================
-- Plateau State Fire Service — Online Fire Disaster Report Management
-- Run with: supabase db push   (or paste into the SQL editor)
-- =====================================================================

create extension if not exists pgcrypto;

-- Real Postgres ENUM types (not text+check) — this is what lets Supabase's
-- type generator produce proper literal-union types instead of collapsing
-- these columns to a plain `string` when you run `pnpm gen:types`.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'fire_severity') then
    create type public.fire_severity as enum ('small', 'spreading', 'major');
  end if;
  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type public.incident_status as enum ('received', 'verified', 'dispatched', 'resolved');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- fire_stations
-- ---------------------------------------------------------------------
create table if not exists public.fire_stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  contact_phone text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- profiles — fire-service STAFF only (admins & dispatchers).
-- Citizens never get a row here. Credentials themselves (password hashes,
-- MFA, etc.) live in Supabase's own auth.users table, not in application
-- code — this table only carries the role/metadata Supabase Auth doesn't.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'dispatcher')),
  station_id uuid references public.fire_stations (id),
  phone text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- incident_reports
-- photo_path stores a private Supabase Storage object path
-- ("<user-id>/<file>.jpg"), never a bare URL typed by a user — a signed
-- URL is generated on demand only for whoever is allowed to view it.
-- ---------------------------------------------------------------------
create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  reporter_id uuid not null references auth.users (id),
  station_id uuid references public.fire_stations (id),
  description text,
  landmark text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  location_accuracy_m numeric,
  severity fire_severity not null,
  photo_path text,
  phone text,
  status incident_status not null default 'received',
  reported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incident_reports_reporter_idx on public.incident_reports (reporter_id);
create index if not exists incident_reports_station_idx on public.incident_reports (station_id);
create index if not exists incident_reports_status_idx on public.incident_reports (status);

-- ---------------------------------------------------------------------
-- incident_assignments (resolves the many-to-many between incidents and
-- responders from the ERD)
-- ---------------------------------------------------------------------
create table if not exists public.incident_assignments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incident_reports (id) on delete cascade,
  responder_id uuid not null references public.profiles (id),
  assigned_at timestamptz not null default now(),
  status_note text
);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists incident_reports_set_updated_at on public.incident_reports;
create trigger incident_reports_set_updated_at
  before update on public.incident_reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Advanced: auto-assign the nearest fire station by great-circle distance
-- as soon as a report comes in with coordinates, so a dispatcher never has
-- to manually hunt for "which station covers this address" under time
-- pressure. Dispatchers can still reassign later.
-- ---------------------------------------------------------------------
create or replace function public.nearest_station(p_lat numeric, p_lng numeric)
returns uuid language sql stable as $$
  select id
  from public.fire_stations
  order by
    -- haversine distance, good enough at state scale
    2 * 6371 * asin(sqrt(
      power(sin(radians(p_lat - latitude) / 2), 2) +
      cos(radians(latitude)) * cos(radians(p_lat)) *
      power(sin(radians(p_lng - longitude) / 2), 2)
    ))
  asc
  limit 1;
$$;

create or replace function public.assign_nearest_station()
returns trigger language plpgsql as $$
begin
  if new.station_id is null and new.latitude is not null and new.longitude is not null then
    new.station_id := public.nearest_station(new.latitude, new.longitude);
  end if;
  return new;
end;
$$;

drop trigger if exists incident_reports_assign_station on public.incident_reports;
create trigger incident_reports_assign_station
  before insert on public.incident_reports
  for each row execute function public.assign_nearest_station();

-- ---------------------------------------------------------------------
-- is_staff() helper — used throughout RLS policies below
-- ---------------------------------------------------------------------
create or replace function public.is_staff(p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = p_uid and role in ('admin', 'dispatcher')
  );
$$;

-- ---------------------------------------------------------------------
-- Public, minimal-surface status lookup for the "/track/[code]" page.
-- Deliberately returns only what a reporter needs to see, nothing else,
-- so the tracking link is safe to text/share without exposing the table.
-- ---------------------------------------------------------------------
create or replace function public.get_incident_status(p_tracking_code text)
returns table (
  status incident_status,
  severity fire_severity,
  station_name text,
  reported_at timestamptz,
  updated_at timestamptz
) language sql stable security definer set search_path = public as $$
  select ir.status, ir.severity, fs.name, ir.reported_at, ir.updated_at
  from public.incident_reports ir
  left join public.fire_stations fs on fs.id = ir.station_id
  where ir.tracking_code = p_tracking_code;
$$;

grant execute on function public.get_incident_status(text) to anon, authenticated;

-- =====================================================================
-- Row-Level Security
-- =====================================================================
alter table public.fire_stations enable row level security;
alter table public.profiles enable row level security;
alter table public.incident_reports enable row level security;
alter table public.incident_assignments enable row level security;

-- fire_stations: readable by anyone (not sensitive), writable by staff only
drop policy if exists "fire_stations_select_all" on public.fire_stations;
create policy "fire_stations_select_all" on public.fire_stations
  for select using (true);

drop policy if exists "fire_stations_staff_write" on public.fire_stations;
create policy "fire_stations_staff_write" on public.fire_stations
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- profiles: a staff member can see their own row; admins see all
drop policy if exists "profiles_self_or_admin_select" on public.profiles;
create policy "profiles_self_or_admin_select" on public.profiles
  for select using (id = auth.uid() or public.is_staff(auth.uid()));

-- incident_reports
drop policy if exists "incident_reports_insert_own" on public.incident_reports;
create policy "incident_reports_insert_own" on public.incident_reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists "incident_reports_select_own_or_staff" on public.incident_reports;
create policy "incident_reports_select_own_or_staff" on public.incident_reports
  for select using (reporter_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "incident_reports_staff_update" on public.incident_reports;
create policy "incident_reports_staff_update" on public.incident_reports
  for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- incident_assignments: staff only
drop policy if exists "incident_assignments_staff_all" on public.incident_assignments;
create policy "incident_assignments_staff_all" on public.incident_assignments
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- =====================================================================
-- Storage: private bucket for incident photos
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('incident-photos', 'incident-photos', false)
on conflict (id) do nothing;

drop policy if exists "incident_photos_insert_own_folder" on storage.objects;
create policy "incident_photos_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'incident-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "incident_photos_select_own_or_staff" on storage.objects;
create policy "incident_photos_select_own_or_staff" on storage.objects
  for select using (
    bucket_id = 'incident-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid()))
  );

-- =====================================================================
-- Realtime: let the admin dashboard receive new/updated reports instantly
-- =====================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'incident_reports'
  ) then
    alter publication supabase_realtime add table public.incident_reports;
  end if;
end $$;

-- =====================================================================
-- Seed data — replace with the Service's real stations
-- =====================================================================
insert into public.fire_stations (name, location, latitude, longitude, contact_phone)
values
  ('Jos Central Fire Station', 'Jos North, Plateau State', 9.9285, 8.8921, '+234-800-000-0001'),
  ('Bukuru Fire Station', 'Jos South, Plateau State', 9.8038, 8.8595, '+234-800-000-0002')
on conflict do nothing;

-- To create your first admin account:
--   1. Sign the person up normally through Supabase Auth (dashboard or app).
--   2. Then run:
--      insert into public.profiles (id, full_name, role)
--      values ('<their-auth-user-id>', 'Full Name', 'admin');
