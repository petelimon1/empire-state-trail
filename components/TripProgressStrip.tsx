import Link from 'next/link';
import { DayData, DayStatus } from '@/types';
import { cn } from '@/lib/utils';

// A day-by-day "shape of the trip" strip: one bar per riding day, height
// proportional to that day's distance, colored by status. Gives an at-a-glance
// read of which days are big/small and how far along the trip is, without
// having to scroll through the full day-card grid below.
export default function TripProgressStrip({
  days,
  dayStatuses,
}: {
  days: DayData[];
  dayStatuses: Record<number, DayStatus>;
}) {
  const maxDistance = Math.max(...days.map((d) => d.distance_km));

  return (
    <div className="mt-5 pt-5 border-t border-slate-800/60">
      <div className="flex items-end gap-1.5 sm:gap-2.5 h-20">
        {days.map((day) => {
          const status = dayStatuses[day.id];
          const heightPct = Math.max(14, Math.round((day.distance_km / maxDistance) * 100));
          return (
            <Link
              key={day.id}
              href={`/day/${day.id}`}
              title={`Day ${day.id}: ${day.from_location} → ${day.to_location} — ${day.distance_km}km, ${day.elevation_m}m elev`}
              className="group flex-1 flex flex-col items-center justify-end h-full min-w-0"
            >
              <div
                className={cn(
                  'w-full rounded-t-md transition-colors',
                  status === 'completed' && 'bg-emerald-500 group-hover:bg-emerald-400',
                  status === 'active' && 'bg-amber-500 animate-pulse',
                  status === 'upcoming' && 'bg-slate-700 group-hover:bg-slate-600'
                )}
                style={{ height: `${heightPct}%` }}
              />
              <div className="mt-1.5 text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors whitespace-nowrap">
                Day {day.id}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Completed
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> Today
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-slate-700 inline-block" /> Upcoming
        </div>
        <span className="ml-auto hidden sm:inline">Bar height = distance</span>
      </div>
    </div>
  );
}
