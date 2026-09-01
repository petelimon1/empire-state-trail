'use client';

import { useUnits } from './UnitsProvider';
import { formatDistanceKm, formatElevationM, formatDistanceMeters } from '@/lib/units';
import { formatDuration } from '@/lib/strava';

interface DayHeaderStatsProps {
  distanceKm: number;
  elevationM: number;
  stravaStats: { distance: number; moving_time: number; total_elevation_gain: number } | null;
}

// The day header shows either the planned stats (from tripData) or, once the
// ride is done, the real Strava-recorded stats — both need to respect the
// km/mi toggle, so this is a client component rather than plain template text.
export default function DayHeaderStats({ distanceKm, elevationM, stravaStats }: DayHeaderStatsProps) {
  const { unit } = useUnits();

  if (stravaStats) {
    return (
      <>
        {' · '}{formatDistanceMeters(stravaStats.distance, unit)}
        {' · '}{formatDuration(stravaStats.moving_time)}
        {' · '}{formatElevationM(stravaStats.total_elevation_gain, unit)}
      </>
    );
  }

  return (
    <>
      {' · '}{formatDistanceKm(distanceKm, unit)}
      {' · '}{formatElevationM(elevationM, unit)} elev
    </>
  );
}
