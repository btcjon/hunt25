// GPS verification utilities

// Parse GPS coordinates - supports both formats:
// - DMS: "33°37'28"N 78°57'26"W"
// - Decimal: "33.6246728, -78.9573327"
export function parseGPS(gps: string): { lat: number; lng: number } | null {
  // Try decimal format first: "33.6246728, -78.9573327"
  const decimalMatch = gps.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (decimalMatch) {
    return {
      lat: parseFloat(decimalMatch[1]),
      lng: parseFloat(decimalMatch[2]),
    };
  }

  // Try DMS format: 33°37'28"N 78°57'26"W
  const dmsRegex = /(\d+)°(\d+)'(\d+)"([NS])\s*(\d+)°(\d+)'(\d+)"([EW])/;
  const dmsMatch = gps.match(dmsRegex);

  if (!dmsMatch) return null;

  const latDeg = parseInt(dmsMatch[1]);
  const latMin = parseInt(dmsMatch[2]);
  const latSec = parseInt(dmsMatch[3]);
  const latDir = dmsMatch[4];

  const lngDeg = parseInt(dmsMatch[5]);
  const lngMin = parseInt(dmsMatch[6]);
  const lngSec = parseInt(dmsMatch[7]);
  const lngDir = dmsMatch[8];

  let lat = latDeg + latMin / 60 + latSec / 3600;
  let lng = lngDeg + lngMin / 60 + lngSec / 3600;

  if (latDir === 'S') lat = -lat;
  if (lngDir === 'W') lng = -lng;

  return { lat, lng };
}

// Alias for backwards compatibility
export const parseDMS = parseGPS;

// Calculate distance between two points using Haversine formula
// Returns distance in meters
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Verification radius in meters
export const GPS_RADIUS_METERS = 25;

// Check if user is within radius of target location
export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetGPS: string,
  radiusMeters: number = GPS_RADIUS_METERS
): { isClose: boolean; distance: number } {
  const target = parseGPS(targetGPS);

  if (!target) {
    return { isClose: false, distance: -1 };
  }

  const distance = calculateDistance(userLat, userLng, target.lat, target.lng);

  return {
    isClose: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}
