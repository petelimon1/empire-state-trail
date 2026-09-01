'use client';

import { useUnits } from './UnitsProvider';
import { formatDistanceKm, formatElevationM } from '@/lib/units';

// Small client components so a Server Component can render a unit-aware
// value without itself needing to be (or become) a client component — pass
// the raw km/m number as a prop and this formats it against the shared
// toggle in the Navbar.

export function DistanceValue({ km, className }: { km: number; className?: string }) {
  const { unit } = useUnits();
  return <span className={className}>{formatDistanceKm(km, unit)}</span>;
}

export function ElevationValue({ m, className }: { m: number; className?: string }) {
  const { unit } = useUnits();
  return <span className={className}>{formatElevationM(m, unit)}</span>;
}
