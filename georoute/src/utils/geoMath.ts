export function calculateDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function calculateBearing(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);

  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

// Distance from point P to line segment AB in meters
export function pointToSegmentDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const distAB = calculateDistanceMeters(a, b);
  if (distAB === 0) return calculateDistanceMeters(p, a);

  // Project point onto segment using approximate local flat coordinates
  const latFactor = Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  const px = (p[0] - a[0]) * latFactor;
  const py = p[1] - a[1];
  const bx = (b[0] - a[0]) * latFactor;
  const by = b[1] - a[1];

  const t = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by)));
  const proj: [number, number] = [a[0] + (t * (b[0] - a[0])), a[1] + (t * (b[1] - a[1]))];
  return calculateDistanceMeters(p, proj);
}

// Minimum distance from point P to polyline
export function minDistanceToPolyline(
  p: [number, number],
  lineCoords: [number, number][]
): number {
  if (lineCoords.length === 0) return Infinity;
  if (lineCoords.length === 1) return calculateDistanceMeters(p, lineCoords[0]);

  let minDist = Infinity;
  for (let i = 0; i < lineCoords.length - 1; i++) {
    const d = pointToSegmentDistance(p, lineCoords[i], lineCoords[i + 1]);
    if (d < minDist) {
      minDist = d;
    }
  }
  return minDist;
}
