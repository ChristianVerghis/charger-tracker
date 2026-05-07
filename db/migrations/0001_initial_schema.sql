-- 0001_initial_schema.sql
-- Initial schema for charger-tracker. Apply in Supabase via SQL editor or `supabase db push`.
-- See ../EV-Network/02_credibility_builds/project_01_charger_tracker/spec.md for the data-model sketch.

create extension if not exists postgis;
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ==========================================================================
-- Enums
-- ==========================================================================

do $$ begin
  create type connector_type as enum (
    'CCS1', 'CCS2', 'J3400', 'CHADEMO',
    'TYPE1_J1772', 'TYPE2_MENNEKES',
    'TESLA_DESTINATION', 'NEMA_14_50', 'OTHER'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type current_type as enum ('AC', 'DC', 'UNKNOWN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type probe_status as enum ('AVAILABLE', 'IN_USE', 'OUT_OF_SERVICE', 'UNKNOWN');
exception when duplicate_object then null; end $$;

-- ==========================================================================
-- Tables
-- ==========================================================================

-- Charging networks (Tesla, Flo, Ivy, ChargePoint, Electrify Canada, etc.)
create table if not exists networks (
  id              text primary key,                  -- slug, e.g. 'tesla', 'flo'
  name            text not null,
  brand_color     text,
  ocm_operator_id integer unique,                    -- cross-ref to OCM OperatorID
  homepage_url    text,
  created_at      timestamptz not null default now()
);

-- Physical charging sites.
-- Latitude/longitude are stored as base columns (so PostgREST upserts are simple
-- numeric inserts), and `location` is a generated PostGIS geography column kept
-- in sync automatically. Querying use the geography column; writes set lat/lng.
create table if not exists stations (
  id          uuid primary key default gen_random_uuid(),
  ocm_id      integer unique,                        -- OCM POI ID; unique cross-ref
  network_id  text references networks(id),
  name        text,
  address     text,
  town        text,
  province    text,
  postal_code text,
  latitude    numeric(9,6) not null,
  longitude   numeric(9,6) not null,
  location    geography(point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) stored,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists stations_location_idx on stations using gist (location);
create index if not exists stations_network_idx  on stations(network_id);
create index if not exists stations_town_idx     on stations(town);

-- Individual plugs at a station
create table if not exists connectors (
  id                uuid primary key default gen_random_uuid(),
  station_id        uuid not null references stations(id) on delete cascade,
  ocm_connection_id integer unique,
  type              connector_type not null,
  current           current_type not null default 'UNKNOWN',
  max_power_kw      numeric(6,1),
  quantity          smallint not null default 1,
  created_at        timestamptz not null default now()
);

create index if not exists connectors_station_idx on connectors(station_id);
create index if not exists connectors_type_idx    on connectors(type);

-- Time-series of status checks. (connector_id, ts) is the natural PK.
create table if not exists status_probes (
  connector_id uuid not null references connectors(id) on delete cascade,
  ts           timestamptz not null,
  status       probe_status not null,
  source       text not null,                         -- 'ocm', 'ocpi-ivy', 'tesla', etc.
  primary key (connector_id, ts)
);

create index if not exists status_probes_ts_idx on status_probes(ts desc);

-- EV models (drives the insight feature)
create table if not exists ev_models (
  id                  text primary key,               -- slug, e.g. 'tesla-model-y-2024-long-range-awd'
  make                text not null,
  model               text not null,
  year                smallint not null,
  trim                text,
  battery_kwh_usable  numeric(5,1) not null,
  max_dcfc_kw         numeric(5,1) not null,
  connector           connector_type not null,
  charge_10_to_80_min smallint not null,
  notes               text
);

create index if not exists ev_models_make_model_idx on ev_models(make, model);

-- ==========================================================================
-- Materialized view: rolling reliability per connector
-- ==========================================================================

drop materialized view if exists connector_reliability;
create materialized view connector_reliability as
select
  connector_id,
  count(*) filter (where ts > now() - interval '30 days' and status in ('AVAILABLE','IN_USE'))::float
    / nullif(count(*) filter (where ts > now() - interval '30 days' and status != 'UNKNOWN'), 0)
    as reliability_30d,
  count(*) filter (where ts > now() - interval '7 days'  and status in ('AVAILABLE','IN_USE'))::float
    / nullif(count(*) filter (where ts > now() - interval '7 days'  and status != 'UNKNOWN'), 0)
    as reliability_7d,
  max(ts)        as last_probe_at,
  count(*) filter (where ts > now() - interval '30 days') as probe_count_30d
from status_probes
where ts > now() - interval '30 days'
group by connector_id;

create unique index if not exists connector_reliability_pk on connector_reliability(connector_id);

-- Refresh helper. Cron from the app calls this every 15 minutes.
create or replace function refresh_connector_reliability()
returns void
language plpgsql
as $$
begin
  refresh materialized view concurrently connector_reliability;
end;
$$;

-- ==========================================================================
-- Row-Level Security: anonymous public read; writes require service_role
-- ==========================================================================

alter table networks       enable row level security;
alter table stations       enable row level security;
alter table connectors     enable row level security;
alter table status_probes  enable row level security;
alter table ev_models      enable row level security;

drop policy if exists anon_read on networks;
create policy anon_read on networks      for select to anon, authenticated using (true);

drop policy if exists anon_read on stations;
create policy anon_read on stations      for select to anon, authenticated using (true);

drop policy if exists anon_read on connectors;
create policy anon_read on connectors    for select to anon, authenticated using (true);

drop policy if exists anon_read on status_probes;
create policy anon_read on status_probes for select to anon, authenticated using (true);

drop policy if exists anon_read on ev_models;
create policy anon_read on ev_models     for select to anon, authenticated using (true);

-- service_role bypasses RLS by default — no policies needed for writes.
