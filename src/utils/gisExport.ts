import { RouteOption } from '../types/route';
import { LocationPoint } from '../types/location';

function downloadFile(content: string, filename: string, mimeType: string): void {
  // 1. Create a File object so the filename is embedded directly in the data object metadata
  let blob: Blob;
  try {
    blob = new File([content], filename, { type: `${mimeType};charset=utf-8` });
  } catch {
    blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.setAttribute('download', filename);
  a.style.display = 'none';
  document.body.appendChild(a);

  // Dispatch mouse click event
  a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

  // Keep object URL alive for 60 seconds so Windows SmartScreen and Chrome file streams
  // finish writing the file to disk with the proper name before cleanup
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 60000);
}

function sanitizeFilename(name: string): string {
  // Support letters/numbers across languages while stripping illegal path characters
  const clean = name.replace(/[^\p{L}\p{N}_-]/gu, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 25);
  return clean || 'route';
}

/**
 * Exports the route and all points as a standard GeoJSON FeatureCollection.
 */
export function exportRouteAsGeoJSON(
  route: RouteOption,
  start: LocationPoint,
  destination: LocationPoint,
  waypoints: LocationPoint[] = []
): void {
  const features: GeoJSON.Feature[] = [];

  // 1. Start Point
  features.push({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: start.coordinates,
    },
    properties: {
      role: 'start',
      name: start.name,
      address: start.address,
    },
  });

  // 2. Intermediate Waypoints
  waypoints.forEach((wp, idx) => {
    if (wp.coordinates[0] !== 0 || wp.coordinates[1] !== 0) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: wp.coordinates,
        },
        properties: {
          role: 'waypoint',
          order: idx + 1,
          name: wp.name,
          address: wp.address,
        },
      });
    }
  });

  // 3. Destination Point
  features.push({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: destination.coordinates,
    },
    properties: {
      role: 'destination',
      name: destination.name,
      address: destination.address,
    },
  });

  // 4. Route LineString
  if (route.geojson.features.length > 0) {
    const routeGeom = route.geojson.features[0].geometry;
    features.push({
      type: 'Feature',
      geometry: routeGeom,
      properties: {
        role: 'route',
        distanceMeters: route.summary.lengthInMeters,
        travelTimeSeconds: route.summary.travelTimeInSeconds,
        trafficDelaySeconds: route.summary.trafficDelayInSeconds,
        departureTime: route.summary.departureTime,
        arrivalTime: route.summary.arrivalTime,
      },
    });
  }

  const geoJsonData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features,
  };

  const jsonString = JSON.stringify(geoJsonData, null, 2);
  const timestamp = Date.now().toString().slice(-4);
  const filename = `georoute_${sanitizeFilename(start.name)}_to_${sanitizeFilename(destination.name)}_${timestamp}.geojson`;
  downloadFile(jsonString, filename, 'application/json');
}

/**
 * Exports the route as a standard GPX 1.1 XML document compatible with
 * GIS applications (QGIS, Google Earth, Garmin, Strava).
 */
export function exportRouteAsGPX(
  route: RouteOption,
  start: LocationPoint,
  destination: LocationPoint,
  waypoints: LocationPoint[] = []
): void {
  const coords: [number, number][] =
    route.geojson.features.length > 0
      ? (route.geojson.features[0].geometry.coordinates as unknown as [number, number][])
      : [];

  const timeIso = new Date().toISOString();

  let gpxXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  gpxXml += `<gpx version="1.1" creator="GeoRoute TomTom Navigator" xmlns="http://www.topografix.com/GPX/1/1">\n`;
  gpxXml += `  <metadata>\n`;
  gpxXml += `    <name>Route: ${start.name} to ${destination.name}</name>\n`;
  gpxXml += `    <time>${timeIso}</time>\n`;
  gpxXml += `  </metadata>\n`;

  // Start Waypoint
  gpxXml += `  <wpt lat="${start.coordinates[1]}" lon="${start.coordinates[0]}">\n`;
  gpxXml += `    <name><![CDATA[${start.name} (Start)]]></name>\n`;
  gpxXml += `    <desc><![CDATA[${start.address}]]></desc>\n`;
  gpxXml += `  </wpt>\n`;

  // Intermediate Waypoints
  waypoints.forEach((wp, idx) => {
    if (wp.coordinates[0] !== 0 || wp.coordinates[1] !== 0) {
      gpxXml += `  <wpt lat="${wp.coordinates[1]}" lon="${wp.coordinates[0]}">\n`;
      gpxXml += `    <name><![CDATA[Stop ${idx + 1}: ${wp.name}]]></name>\n`;
      gpxXml += `    <desc><![CDATA[${wp.address}]]></desc>\n`;
      gpxXml += `  </wpt>\n`;
    }
  });

  // Destination Waypoint
  gpxXml += `  <wpt lat="${destination.coordinates[1]}" lon="${destination.coordinates[0]}">\n`;
  gpxXml += `    <name><![CDATA[${destination.name} (Destination)]]></name>\n`;
  gpxXml += `    <desc><![CDATA[${destination.address}]]></desc>\n`;
  gpxXml += `  </wpt>\n`;

  // Track Line
  gpxXml += `  <trk>\n`;
  gpxXml += `    <name><![CDATA[${start.name} -> ${destination.name}]]></name>\n`;
  gpxXml += `    <trkseg>\n`;
  coords.forEach(([lng, lat]) => {
    gpxXml += `      <trkpt lat="${lat}" lon="${lng}" />\n`;
  });
  gpxXml += `    </trkseg>\n`;
  gpxXml += `  </trk>\n`;
  gpxXml += `</gpx>\n`;

  const timestamp = Date.now().toString().slice(-4);
  const filename = `georoute_${sanitizeFilename(start.name)}_to_${sanitizeFilename(destination.name)}_${timestamp}.gpx`;
  downloadFile(gpxXml, filename, 'application/xml');
}

/**
 * Builds a shareable URL with encoded route parameters.
 */
export function generateShareableRouteUrl(
  start: LocationPoint,
  destination: LocationPoint,
  waypoints: LocationPoint[] = []
): string {
  const data = {
    s: { n: start.name, a: start.address, c: start.coordinates },
    d: { n: destination.name, a: destination.address, c: destination.coordinates },
    w: waypoints
      .filter((wp) => wp.coordinates[0] !== 0 || wp.coordinates[1] !== 0)
      .map((wp) => ({ n: wp.name, a: wp.address, c: wp.coordinates })),
  };

  const jsonStr = JSON.stringify(data);
  // Safe base64 encoding supporting UTF-8 / Arabic
  const encoded = btoa(encodeURIComponent(jsonStr));

  const url = new URL(window.location.href);
  url.searchParams.set('route', encoded);
  return url.toString();
}

/**
 * Parses shared route parameters from URL query string on load.
 */
export function parseRouteFromUrl(): {
  start: LocationPoint;
  destination: LocationPoint;
  waypoints: LocationPoint[];
} | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('route');
    if (!encoded) return null;

    const jsonStr = decodeURIComponent(atob(encoded));
    const data = JSON.parse(jsonStr);

    if (!data.s || !data.d || !data.s.c || !data.d.c) {
      return null;
    }

    const start: LocationPoint = {
      id: `url-start-${Date.now()}`,
      name: data.s.n || 'Start',
      address: data.s.a || '',
      coordinates: data.s.c,
    };

    const destination: LocationPoint = {
      id: `url-dest-${Date.now()}`,
      name: data.d.n || 'Destination',
      address: data.d.a || '',
      coordinates: data.d.c,
    };

    const waypoints: LocationPoint[] = Array.isArray(data.w)
      ? data.w.map((wp: { n?: string; a?: string; c: [number, number] }, idx: number) => ({
          id: `url-wp-${idx}-${Date.now()}`,
          name: wp.n || `Stop ${idx + 1}`,
          address: wp.a || '',
          coordinates: wp.c,
        }))
      : [];

    return { start, destination, waypoints };
  } catch (err) {
    console.warn('Failed to parse route from URL:', err);
    return null;
  }
}
