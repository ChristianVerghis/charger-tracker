// Static prototype. Reads ./snapshot.json (placed by scripts/prepare-prototype.ts)
// and renders the GTA chargers as a clustered MapLibre layer.
//
// Color rule per station = max PowerKW across its connectors:
//   green  ≥150 kW  (true fast DCFC)
//   amber  ≥50 kW   (slow DCFC)
//   blue   <50 kW   (L2 only)

const CONNECTION_TYPE_NAMES = {
  1: 'J1772 (L2)',
  2: 'CHAdeMO',
  25: 'Type 2',
  27: 'NACS / Supercharger',
  30: 'Tesla S/X',
  32: 'CCS Type 1',
};

const DC_CONNECTION_TYPES = new Set([2, 27, 30, 32]);

function classify(maxKw) {
  if (maxKw >= 150) return 'fast';
  if (maxKw >= 50) return 'slow-dc';
  return 'l2';
}

function classifyColor(maxKw) {
  return { fast: '#10b981', 'slow-dc': '#f59e0b', l2: '#3b82f6' }[classify(maxKw)];
}

function poiToFeature(poi) {
  const conns = poi.Connections ?? [];
  const maxKw = conns.reduce((m, c) => Math.max(m, c.PowerKW ?? 0), 0);
  const hasDcfc = conns.some((c) => DC_CONNECTION_TYPES.has(c.ConnectionTypeID));
  return {
    type: 'Feature',
    properties: {
      id: poi.ID,
      name: poi.AddressInfo.Title ?? '(no name)',
      town: poi.AddressInfo.Town ?? '',
      address: poi.AddressInfo.AddressLine1 ?? '',
      operator: poi.OperatorID ?? null,
      maxKw,
      hasDcfc,
      tier: classify(maxKw),
      color: classifyColor(maxKw),
      connections: JSON.stringify(conns),
    },
    geometry: {
      type: 'Point',
      coordinates: [poi.AddressInfo.Longitude, poi.AddressInfo.Latitude],
    },
  };
}

function applyFilter(features, filter) {
  switch (filter) {
    case 'dcfc':
      return features.filter((f) => f.properties.hasDcfc);
    case 'fast':
      return features.filter((f) => f.properties.maxKw >= 150);
    case 'hamilton':
      return features.filter((f) => f.properties.town === 'Hamilton');
    case 'all':
    default:
      return features;
  }
}

function renderDetail(props) {
  const conns = JSON.parse(props.connections);
  const rows = conns
    .map((c) => {
      const type = CONNECTION_TYPE_NAMES[c.ConnectionTypeID] ?? `Type ${c.ConnectionTypeID}`;
      const kw = c.PowerKW ?? '—';
      const qty = c.Quantity ?? 1;
      const cls = c.PowerKW >= 150 ? 'badge-fast' : c.PowerKW >= 50 ? 'badge-slow-dc' : 'badge-l2';
      return `<tr><td>${type}</td><td class="${cls}">${kw} kW</td><td>×${qty}</td></tr>`;
    })
    .join('');
  document.getElementById('detail').innerHTML = `
    <h2>${props.name}</h2>
    <p class="meta">${props.address ? props.address + ' · ' : ''}${props.town}</p>
    <p class="meta">Max station rate: <strong>${props.maxKw} kW</strong></p>
    <table>
      <thead><tr><th>Connector</th><th>Power</th><th>Qty</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="muted">No connectors listed.</td></tr>'}</tbody>
    </table>
  `;
}

async function main() {
  const res = await fetch('./snapshot.json');
  if (!res.ok) {
    document.getElementById('stats').textContent =
      'Could not load snapshot.json — run `pnpm dev:prototype` from the project root.';
    return;
  }
  const pois = await res.json();
  const allFeatures = pois.map(poiToFeature);

  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    },
    center: [-79.55, 43.65],
    zoom: 9,
  });

  map.on('load', () => {
    const sourceId = 'stations';
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: allFeatures },
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 40,
    });

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#94a3b8', 25, '#64748b', 100, '#475569',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 14, 25, 18, 100, 24],
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1.5,
      },
    });

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12,
      },
      paint: { 'text-color': '#fff' },
    });

    map.addLayer({
      id: 'unclustered',
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3, 14, 7],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
      },
    });

    map.on('click', 'unclustered', (e) => {
      const f = e.features[0];
      if (!f) return;
      renderDetail(f.properties);
    });
    map.on('mouseenter', 'unclustered', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'unclustered', () => (map.getCanvas().style.cursor = ''));

    map.on('click', 'clusters', (e) => {
      const f = e.features[0];
      if (!f) return;
      const clusterId = f.properties.cluster_id;
      map.getSource(sourceId).getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({ center: f.geometry.coordinates, zoom });
      });
    });

    function updateData(filter) {
      const filtered = applyFilter(allFeatures, filter);
      map.getSource(sourceId).setData({ type: 'FeatureCollection', features: filtered });
      const dcfc = filtered.filter((f) => f.properties.hasDcfc).length;
      document.getElementById('stats').textContent =
        `${filtered.length.toLocaleString()} stations · ${dcfc.toLocaleString()} with DCFC`;
    }

    document.querySelectorAll('.filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        updateData(btn.dataset.filter);
      });
    });

    updateData('all');
  });
}

main();
