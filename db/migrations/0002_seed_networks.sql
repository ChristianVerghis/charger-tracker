-- 0002_seed_networks.sql
-- Seed of known networks, keyed to OCM OperatorIDs we observed in our first
-- Hamilton+GTA snapshot. Idempotent; re-runnable. Add new operators as the
-- ingestion uncovers them (run with `pnpm ingest:ocm` then check for unmapped
-- operator IDs in the summary).

insert into networks (id, name, ocm_operator_id, brand_color, homepage_url) values
  ('chargepoint',  'ChargePoint',         5,    '#0D7BC2', 'https://www.chargepoint.com/'),
  ('flo',          'Flo',                 89,   '#00B14F', 'https://www.flo.com/'),
  ('swtch',        'SWTCH',               3493, '#FF6A13', 'https://swtchenergy.com/'),
  ('tesla',        'Tesla (Tesla-only)',  23,   '#E31937', 'https://www.tesla.com/findus/charging'),
  ('tesla-open',   'Tesla (Magic-Dock)',  3534, '#E31937', 'https://www.tesla.com/findus/charging'),
  ('chargelab',    'ChargeLab',           3621, '#0EA5E9', 'https://chargelab.co/'),
  ('ivy',          'IVY',                 3416, '#1F8B4C', 'https://ivycharging.com/'),
  ('ev-connect',   'EV Connect',          3372, '#003C71', 'https://www.evconnect.com/'),
  ('jule',         'Jule',                3488, '#000000', 'https://jule.io/')
on conflict (id) do update set
  name            = excluded.name,
  ocm_operator_id = excluded.ocm_operator_id,
  brand_color     = excluded.brand_color,
  homepage_url    = excluded.homepage_url;
