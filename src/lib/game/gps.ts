// GPS verification utilities

// Parse DMS format (33°37'28"N 78°57'26"W) to decimal degrees
export function parseDMS(dms: string): { lat: number; lng: number } | null {
  // Match pattern like: 33°37'28"N 78°57'26"W
  const regex = /(\d+)°(\d+)'(\d+)"([NS])\s*(\d+)°(\d+)'(\d+)"([EW])/;
  const match = dms.match(regex);

  if (!match) return null;

  const latDeg = parseInt(match[1]);
  const latMin = parseInt(match[2]);
  const latSec = parseInt(match[3]);
  const latDir = match[4];

  const lngDeg = parseInt(match[5]);
  const lngMin = parseInt(match[6]);
  const lngSec = parseInt(match[7]);
  const lngDir = match[8];

  let lat = latDeg + latMin / 60 + latSec / 3600;
  let lng = lngDeg + lngMin / 60 + lngSec / 3600;

  if (latDir === 'S') lat = -lat;
  if (lngDir === 'W') lng = -lng;

  return { lat, lng };
}

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
export const GPS_RADIUS_METERS = 15;

// Check if user is within radius of target location
export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetDMS: string,
  radiusMeters: number = GPS_RADIUS_METERS
): { isClose: boolean; distance: number } {
  const target = parseDMS(targetDMS);

  if (!target) {
    return { isClose: false, distance: -1 };
  }

  const distance = calculateDistance(userLat, userLng, target.lat, target.lng);

  return {
    isClose: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}
