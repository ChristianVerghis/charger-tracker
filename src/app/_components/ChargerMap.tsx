'use client';

import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import type { SlimPoi } from '@/lib/snapshot-types';
import { hasDcfc, maxKw, tier, TIER_COLORS } from '@/lib/snapshot-types';

type FeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      id: number;
      name: string;
      town: string;
      maxKw: number;
      hasDcfc: number;
      color: string;
    };
    geometry: { type: 'Point'; coordinates: [number, number] };
  }>;
};

function toFeatureCollection(pois: SlimPoi[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pois.map((p) => {
      const kw = maxKw(p);
      return {
        type: 'Feature',
        properties: {
          id: p.id,
          name: p.name,
          town: p.town,
          maxKw: kw,
          hasDcfc: hasDcfc(p) ? 1 : 0,
          color: TIER_COLORS[tier(p)],
        },
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      };
    }),
  };
}

const SOURCE_ID = 'stations';

export function ChargerMap({
  pois,
  selectedId,
  onSelect,
}: {
  pois: SlimPoi[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const data = useMemo(() => toFeatureCollection(pois), [pois]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [-79.55, 43.65],
      zoom: 9,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 40,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#94a3b8', 25, '#64748b', 100, '#475569'],
          'circle-radius': ['step', ['get', 'point_count'], 14, 25, 18, 100, 24],
          'circle-stroke-color': '#0b0f14',
          'circle-stroke-width': 1.5,
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 },
        paint: { 'text-color': '#fff' },
      });
      map.addLayer({
        id: 'unclustered',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3, 14, 7],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0b0f14',
        },
      });
      map.addLayer({
        id: 'unclustered-selected',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], -1]],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 10,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      });

      map.on('click', 'unclustered', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = (f.properties as { id?: number }).id;
        if (typeof id === 'number') onSelectRef.current(id);
      });
      map.on('mouseenter', 'unclustered', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'clusters', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const clusterId = (f.properties as { cluster_id?: number }).cluster_id;
        if (typeof clusterId !== 'number') return;
        const src = map.getSource(SOURCE_ID) as GeoJSONSource;
        src.getClusterExpansionZoom(clusterId).then((zoom) => {
          if (f.geometry.type !== 'Point') return;
          const [lng, lat] = f.geometry.coordinates as [number, number];
          map.easeTo({ center: [lng, lat], zoom });
        });
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Push new data to the source whenever the filter result changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (src) src.setData(data);
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [data]);

  // Highlight + pan to the selected station. Only pan when the station is
  // outside the current viewport so clicking a visible marker doesn't jolt
  // the camera, but landing on a `?station=` permalink does fly to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const station = selectedId != null ? pois.find((p) => p.id === selectedId) : null;
    const apply = () => {
      if (!map.getLayer('unclustered-selected')) return;
      map.setFilter('unclustered-selected', [
        'all',
        ['!', ['has', 'point_count']],
        ['==', ['get', 'id'], selectedId ?? -1],
      ]);
      if (station && !map.getBounds().contains([station.lng, station.lat])) {
        map.easeTo({
          center: [station.lng, station.lat],
          zoom: Math.max(map.getZoom(), 13),
          duration: 800,
        });
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [selectedId, pois]);

  return <div ref={containerRef} className="absolute inset-0" aria-label="map" />;
}
