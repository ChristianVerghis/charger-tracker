import { describe, expect, it } from 'vitest';
import {
  connectionsToConnectorInserts,
  mapConnectionType,
  mapCurrentType,
  mapStationStatus,
  poiToStationInsert,
  type OcmPoi,
} from '../src/ingest/mappers.js';

describe('mapConnectionType', () => {
  it('maps the connection types observed in the GTA snapshot', () => {
    expect(mapConnectionType(1)).toBe('TYPE1_J1772');
    expect(mapConnectionType(32)).toBe('CCS1');
    expect(mapConnectionType(2)).toBe('CHADEMO');
    expect(mapConnectionType(27)).toBe('J3400');
    expect(mapConnectionType(30)).toBe('TESLA_DESTINATION');
    expect(mapConnectionType(25)).toBe('TYPE2_MENNEKES');
  });

  it('falls back to OTHER for unknown / null / undefined', () => {
    expect(mapConnectionType(999)).toBe('OTHER');
    expect(mapConnectionType(null)).toBe('OTHER');
    expect(mapConnectionType(undefined)).toBe('OTHER');
  });
});

describe('mapCurrentType', () => {
  it('classifies AC vs DC', () => {
    expect(mapCurrentType(30)).toBe('DC');
    expect(mapCurrentType(10)).toBe('AC');
    expect(mapCurrentType(20)).toBe('AC');
    expect(mapCurrentType(null)).toBe('UNKNOWN');
    expect(mapCurrentType(undefined)).toBe('UNKNOWN');
  });
});

describe('mapStationStatus', () => {
  it('classifies the OCM status types we filter on', () => {
    expect(mapStationStatus(50)).toBe('OPERATIONAL');
    expect(mapStationStatus(75)).toBe('OPERATIONAL');
    expect(mapStationStatus(150)).toBe('PLANNED');
    expect(mapStationStatus(100)).toBe('NOT_OPERATIONAL');
    expect(mapStationStatus(200)).toBe('NOT_OPERATIONAL');
    expect(mapStationStatus(0)).toBe('UNKNOWN');
    expect(mapStationStatus(null)).toBe('UNKNOWN');
  });
});

describe('poiToStationInsert', () => {
  const poi: OcmPoi = {
    ID: 12345,
    AddressInfo: {
      Title: 'McMaster Innovation Park L2',
      AddressLine1: '175 Longwood Rd S',
      Town: 'Hamilton',
      StateOrProvince: 'Ontario',
      Postcode: 'L8P 0A1',
      Latitude: 43.2557,
      Longitude: -79.9075,
    },
    OperatorID: 5,
    StatusTypeID: 50,
    Connections: [{ ID: 99, ConnectionTypeID: 1, PowerKW: 7.2, Quantity: 2, CurrentTypeID: 10 }],
  };

  it('extracts station fields and resolves network_id from operator map', () => {
    const opMap = new Map<number, string>([[5, 'chargepoint']]);
    const r = poiToStationInsert(poi, opMap);
    expect(r.ocm_id).toBe(12345);
    expect(r.network_id).toBe('chargepoint');
    expect(r.name).toBe('McMaster Innovation Park L2');
    expect(r.town).toBe('Hamilton');
    expect(r.latitude).toBe(43.2557);
    expect(r.longitude).toBe(-79.9075);
    expect(r.metadata).toEqual({ ocmStatusTypeId: 50, ocmOperatorId: 5 });
  });

  it('leaves network_id null when the operator is unmapped', () => {
    const r = poiToStationInsert(poi, new Map());
    expect(r.network_id).toBeNull();
  });

  it('leaves network_id null when the POI has no operator', () => {
    const orphan: OcmPoi = { ...poi, OperatorID: null };
    const r = poiToStationInsert(orphan, new Map([[5, 'chargepoint']]));
    expect(r.network_id).toBeNull();
  });
});

describe('connectionsToConnectorInserts', () => {
  it('maps each connection with the supplied station id', () => {
    const poi: OcmPoi = {
      ID: 1,
      AddressInfo: { Latitude: 0, Longitude: 0 },
      Connections: [
        { ID: 10, ConnectionTypeID: 32, PowerKW: 150, Quantity: 1, CurrentTypeID: 30 },
        { ID: 11, ConnectionTypeID: 27, PowerKW: 250, Quantity: 1, CurrentTypeID: 30 },
      ],
    };
    const r = connectionsToConnectorInserts(poi, 'fake-station-uuid');
    expect(r).toHaveLength(2);
    expect(r[0]!.type).toBe('CCS1');
    expect(r[0]!.current).toBe('DC');
    expect(r[0]!.station_id).toBe('fake-station-uuid');
    expect(r[0]!.max_power_kw).toBe(150);
    expect(r[1]!.type).toBe('J3400');
  });

  it('returns an empty array when the POI has no connections', () => {
    const poi: OcmPoi = { ID: 1, AddressInfo: { Latitude: 0, Longitude: 0 } };
    expect(connectionsToConnectorInserts(poi, 'sid')).toEqual([]);
  });

  it('defaults quantity to 1 when missing', () => {
    const poi: OcmPoi = {
      ID: 1,
      AddressInfo: { Latitude: 0, Longitude: 0 },
      Connections: [{ ID: 10, ConnectionTypeID: 1 }],
    };
    expect(connectionsToConnectorInserts(poi, 'sid')[0]!.quantity).toBe(1);
  });
});
