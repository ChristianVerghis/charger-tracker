// Hand-typed mirrors of the Postgres schema in db/migrations/0001_initial_schema.sql.
// Replace with `supabase gen types typescript` output once the project is provisioned.

export type ConnectorType =
  | 'CCS1'
  | 'CCS2'
  | 'J3400'
  | 'CHADEMO'
  | 'TYPE1_J1772'
  | 'TYPE2_MENNEKES'
  | 'TESLA_DESTINATION'
  | 'NEMA_14_50'
  | 'OTHER';

export type CurrentType = 'AC' | 'DC' | 'UNKNOWN';

export type ProbeStatus = 'AVAILABLE' | 'IN_USE' | 'OUT_OF_SERVICE' | 'UNKNOWN';

export type NetworkRow = {
  id: string;
  name: string;
  brand_color: string | null;
  ocm_operator_id: number | null;
  homepage_url: string | null;
  created_at: string;
};

export type StationInsert = {
  ocm_id: number | null;
  network_id: string | null;
  name: string | null;
  address: string | null;
  town: string | null;
  province: string | null;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  metadata: Record<string, unknown>;
};

export type ConnectorInsert = {
  station_id: string;
  ocm_connection_id: number | null;
  type: ConnectorType;
  current: CurrentType;
  max_power_kw: number | null;
  quantity: number;
};

export type EvModelInsert = {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  battery_kwh_usable: number;
  max_dcfc_kw: number;
  connector: ConnectorType;
  charge_10_to_80_min: number;
  notes: string | null;
};
