import type {
  ConnectorInsert,
  ConnectorType,
  CurrentType,
  StationInsert,
} from '../db/types.js';

// Subset of the Open Charge Map POI shape we actually use.
// The runtime validation lives in scripts/ingest-ocm.ts (zod); this is the
// trimmed type that downstream code consumes after that validation.
export type OcmPoi = {
  ID: number;
  AddressInfo: {
    Title?: string | null;
    AddressLine1?: string | null;
    Town?: string | null;
    StateOrProvince?: string | null;
    Postcode?: string | null;
    Latitude: number;
    Longitude: number;
  };
  OperatorID?: number | null;
  StatusTypeID?: number | null;
  Connections?: Array<{
    ID: number;
    ConnectionTypeID?: number | null;
    StatusTypeID?: number | null;
    LevelID?: number | null;
    PowerKW?: number | null;
    Quantity?: number | null;
    CurrentTypeID?: number | null;
  }> | null;
};

// OCM ConnectionTypeID → our connector_type enum.
// IDs sourced from /v3/referencedata; resolved against the GTA snapshot in
// build_log.md (2026-05-01 evening entry).
export function mapConnectionType(ocmId: number | null | undefined): ConnectorType {
  switch (ocmId) {
    case 1:
      return 'TYPE1_J1772';
    case 32:
      return 'CCS1';
    case 2:
      return 'CHADEMO';
    case 30:
      return 'TESLA_DESTINATION';
    case 27:
      return 'J3400';
    case 25:
      return 'TYPE2_MENNEKES';
    default:
      return 'OTHER';
  }
}

// OCM CurrentTypeID → our current_type enum.
// 10 = Single-Phase AC, 20 = Three-Phase AC, 30 = DC.
export function mapCurrentType(ocmId: number | null | undefined): CurrentType {
  if (ocmId === 30) return 'DC';
  if (ocmId === 10 || ocmId === 20) return 'AC';
  return 'UNKNOWN';
}

export type StationStatus = 'OPERATIONAL' | 'PLANNED' | 'NOT_OPERATIONAL' | 'UNKNOWN';

// OCM StatusTypeID → coarse classification we actually use for filtering.
// 50 = Operational, 75 = Partly Operational, 100 = Not Operational,
// 150 = Planned For Future Date, 200 = Removed.
export function mapStationStatus(ocmId: number | null | undefined): StationStatus {
  if (ocmId === 50 || ocmId === 75) return 'OPERATIONAL';
  if (ocmId === 150) return 'PLANNED';
  if (ocmId === 100 || ocmId === 200) return 'NOT_OPERATIONAL';
  return 'UNKNOWN';
}

export function poiToStationInsert(
  poi: OcmPoi,
  networkIdByOperator: Map<number, string>,
): StationInsert {
  const operatorId = poi.OperatorID ?? null;
  const networkId = operatorId != null ? networkIdByOperator.get(operatorId) ?? null : null;
  return {
    ocm_id: poi.ID,
    network_id: networkId,
    name: poi.AddressInfo.Title ?? null,
    address: poi.AddressInfo.AddressLine1 ?? null,
    town: poi.AddressInfo.Town ?? null,
    province: poi.AddressInfo.StateOrProvince ?? null,
    postal_code: poi.AddressInfo.Postcode ?? null,
    latitude: poi.AddressInfo.Latitude,
    longitude: poi.AddressInfo.Longitude,
    metadata: {
      ocmStatusTypeId: poi.StatusTypeID ?? null,
      ocmOperatorId: operatorId,
    },
  };
}

export function connectionsToConnectorInserts(
  poi: OcmPoi,
  stationId: string,
): ConnectorInsert[] {
  return (poi.Connections ?? []).map((c) => ({
    station_id: stationId,
    ocm_connection_id: c.ID,
    type: mapConnectionType(c.ConnectionTypeID),
    current: mapCurrentType(c.CurrentTypeID),
    max_power_kw: c.PowerKW ?? null,
    quantity: c.Quantity ?? 1,
  }));
}
