// Approximate squared distance from a point in degrees, weighted by
// cos(lat) so longitude differences shrink at higher latitudes. Good enough
// for sorting stations by "how close is this to me" — about 0.1% off real
// haversine distance over the GTA, and ~10× faster.

export type LatLng = { lat: number; lng: number };

export function approxDistanceSq(a: LatLng, b: LatLng): number {
  const dLat = a.lat - b.lat;
  const dLng = (a.lng - b.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return dLat * dLat + dLng * dLng;
}

// Cheap km estimate for display. ~111 km per degree of latitude; the lng term
// already accounts for cos(lat) above.
export function approxKm(a: LatLng, b: LatLng): number {
  return Math.sqrt(approxDistanceSq(a, b)) * 111;
}
