export type UnitSystem = 'metric' | 'imperial';

const KM_TO_MI = 0.621371;
const M_TO_FT = 3.28084;

// Distance stored in km throughout the app (DAYS_DATA, TRIP_STATS, etc.)
export function formatDistanceKm(km: number, unit: UnitSystem): string {
  const value = unit === 'imperial' ? km * KM_TO_MI : km;
  return `${value.toFixed(1)} ${unit === 'imperial' ? 'mi' : 'km'}`;
}

// Elevation stored in meters throughout the app
export function formatElevationM(m: number, unit: UnitSystem): string {
  const value = unit === 'imperial' ? m * M_TO_FT : m;
  return `${Math.round(value).toLocaleString()} ${unit === 'imperial' ? 'ft' : 'm'}`;
}

// Strava activity data comes back in meters — convenience wrapper
export function formatDistanceMeters(meters: number, unit: UnitSystem): string {
  return formatDistanceKm(meters / 1000, unit);
}

// Strava speed comes back in meters/second — converts to a min:sec / km or mi pace
export function formatPaceFromMps(metersPerSecond: number, unit: UnitSystem): string {
  const distanceUnitMeters = unit === 'imperial' ? 1609.34 : 1000;
  const minPerUnit = distanceUnitMeters / (metersPerSecond * 60);
  const minutes = Math.floor(minPerUnit);
  const seconds = Math.round((minPerUnit - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /${unit === 'imperial' ? 'mi' : 'km'}`;
}
