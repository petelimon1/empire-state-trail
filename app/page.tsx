import { Metadata } from 'next';
import { Mountain, MapPin, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import DayCard from '@/components/DayCard';
import RouteMapDynamic from '@/components/RouteMapDynamic';
import { DAYS_DATA, TRIP_START_DATE, TRIP_END_DATE, TRIP_TIMEZONE, TRIP_STATS, PRE_RIDE_DAY, resolveActiveDayId } from '@/lib/tripData';
import { DayStatus } from '@/types';
import { createSafeClient } from '@/lib/supabase';
import { DistanceValue, ElevationValue } from '@/components/UnitValue';
import LiveTrackFreshness from '@/components/LiveTrackFreshness';

export const metadata: Metadata = {
  title: 'Empire State Trail 2026 | Pete & Lena\'s Ride',
  description: 'Follow Pete & Lena\'s 542km bike ride from Poughkeepsie to Montreal along the Empire State Trail, Sept 5–11, 2026 (after training up from Brooklyn on Sept 4).',
};

export const revalidate = 60;

async function getTripStatus() {
  const supabase = createSafeClient();
  if (!supabase) return { current_day: null, current_day_set_date: null };
  try {
    const { data } = await supabase
      .from('trip_status')
      .select('current_day, current_day_set_date')
      .eq('id', 1)
      .single();
    return data || { current_day: null, current_day_set_date: null };
  } catch {
    return { current_day: null, current_day_set_date: null };
  }
}

// LiveTrack now lives on the active day's own row, not on trip_status.
async function getActiveDayLiveTrack(dayId: number | null): Promise<{ garmin_livetrack_url: string | null; garmin_livetrack_updated_at: string | null }> {
  if (!dayId) return { garmin_livetrack_url: null, garmin_livetrack_updated_at: null };
  const supabase = createSafeClient();
  if (!supabase) return { garmin_livetrack_url: null, garmin_livetrack_updated_at: null };
  try {
    const { data } = await supabase
      .from('days')
      .select('garmin_livetrack_url, garmin_livetrack_updated_at')
      .eq('id', dayId)
      .single();
    return {
      garmin_livetrack_url: data?.garmin_livetrack_url ?? null,
      garmin_livetrack_updated_at: data?.garmin_livetrack_updated_at ?? null,
    };
  } catch {
    return { garmin_livetrack_url: null, garmin_livetrack_updated_at: null };
  }
}

// Days with a real Strava activity linked count as completed regardless of
// the calendar date — otherwise a day that's genuinely done (activity
// synced, rider back at the hotel) still shows as "active" and excluded
// from progress totals until the date rolls over at midnight.
async function getLinkedDayIds(): Promise<Set<number>> {
  const supabase = createSafeClient();
  if (!supabase) return new Set();
  try {
    const { data } = await supabase
      .from('days')
      .select('id, strava_activity_id')
      .not('strava_activity_id', 'is', null);
    return new Set((data ?? []).map((d) => d.id));
  } catch {
    return new Set();
  }
}

function getTripInfo(): { phase: 'before' | 'during' | 'after'; activeDayId: number | null; isPreRideDay: boolean; daysUntil: number; currentDate: string } {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TRIP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

  let phase: 'before' | 'during' | 'after';
  let activeDayId: number | null = null;
  let isPreRideDay = false;

  if (today < TRIP_START_DATE) {
    phase = 'before';
  } else if (today > TRIP_END_DATE) {
    phase = 'after';
  } else {
    phase = 'during';
    const activeDay = DAYS_DATA.find((d) => d.date === today);
    activeDayId = activeDay?.id ?? null;
    isPreRideDay = today === PRE_RIDE_DAY.date;
  }

  const tripStart = new Date(TRIP_START_DATE + 'T00:00:00Z');
  const todayUTC = new Date(today + 'T00:00:00Z');
  const daysUntil = Math.round((tripStart.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24));

  return { phase, activeDayId, isPreRideDay, daysUntil, currentDate: today };
}

function getDayStatuses(currentDate: string, linkedDayIds: Set<number>): Record<number, DayStatus> {
  const statuses: Record<number, DayStatus> = {};
  DAYS_DATA.forEach((day) => {
    if (linkedDayIds.has(day.id)) statuses[day.id] = 'completed';
    else if (currentDate < day.date) statuses[day.id] = 'upcoming';
    else if (currentDate === day.date) statuses[day.id] = 'active';
    else statuses[day.id] = 'completed';
  });
  return statuses;
}

export default async function HomePage() {
  const tripInfo = getTripInfo();
  const [tripStatus, linkedDayIds] = await Promise.all([
    getTripStatus(),
    getLinkedDayIds(),
  ]);
  const dayStatuses = getDayStatuses(tripInfo.currentDate, linkedDayIds);

  // An admin current_day override (trip running off the fixed schedule) can
  // point "currently riding" at a different day than the date match above.
  const resolvedActiveDayId = tripInfo.phase === 'during'
    ? resolveActiveDayId(tripStatus.current_day, tripStatus.current_day_set_date)
    : null;
  const activeDayLiveTrack = await getActiveDayLiveTrack(resolvedActiveDayId);

  const completedDays = Object.values(dayStatuses).filter((s) => s === 'completed').length;

  const completedDistance = DAYS_DATA
    .filter(d => dayStatuses[d.id] === 'completed')
    .reduce((sum, d) => sum + (d.distance_km ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center overflow-hidden">
        {/* Hero background — Lena riding the trail through the Hudson Valley */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-trail.jpg')" }}
        />
        {/* Minimal dark overlay — heavier at top for nav, lighter in middle, dark at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pt-40 sm:pt-48">
          <h1 className="font-display font-semibold tracking-tight leading-tight text-white mb-6">
            <span className="block text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl">Empire State Trail</span>
            <span className="block text-2xl sm:text-3xl font-light tracking-widest text-white/50 mt-3">2026</span>
          </h1>

          <p className="text-white/60 text-sm sm:text-base tracking-wide">
            Saturday, September 5 – Friday, September 11, 2026
          </p>

          {/* Status Banner — renders nothing once the trip is over, so no
              gap is reserved for it in that phase */}
          {tripInfo.phase !== 'after' && (
            <div className="mt-10">
              <StatusBanner phase={tripInfo.phase} daysUntil={tripInfo.daysUntil} activeDayId={resolvedActiveDayId} isPreRideDay={tripInfo.isPreRideDay} garminUrl={activeDayLiveTrack.garmin_livetrack_url} garminUpdatedAt={activeDayLiveTrack.garmin_livetrack_updated_at} completedDays={completedDays} />
            </div>
          )}

          {/* Stats */}
          <div className="mt-12 text-white/60">
            <div className="flex items-center justify-center gap-10">
              <div className="text-center">
                <div className="font-display font-semibold text-white text-lg sm:text-xl"><DistanceValue km={completedDistance} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Total Distance Completed</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="font-display font-semibold text-white text-lg sm:text-xl"><ElevationValue m={TRIP_STATS.totalElevation} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Total Elevation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Map */}
      <div className="relative bg-slate-950">
        <RouteMapDynamic
          height="560px"
          currentDayId={resolvedActiveDayId}
          dayStatuses={dayStatuses}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

          {/* Day Cards */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DAYS_DATA.map((day, index) => (
                <DayCard
                  key={day.id}
                  day={day}
                  status={dayStatuses[day.id]}
                  index={index}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="font-display italic text-slate-500">Empire State Trail 2026 · Pete &amp; Lena</div>
          <div>
            Built with Next.js
          </div>
        </div>
      </footer>
    </div>
  );
}

// Status Banner Component
function StatusBanner({ phase, daysUntil, activeDayId, isPreRideDay, garminUrl, garminUpdatedAt, completedDays }: {
  phase: 'before' | 'during' | 'after';
  daysUntil: number;
  activeDayId: number | null;
  isPreRideDay: boolean;
  garminUrl?: string | null;
  garminUpdatedAt?: string | null;
  completedDays: number;
}) {
  if (phase === 'before') {
    return (
      <div className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-3 border border-slate-700/50">
        <div className="text-2xl">🗓️</div>
        <div className="text-left">
          <div className="text-slate-200 font-semibold">
            Trip starts in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
          </div>
          <div className="text-slate-500 text-xs">Sep 4, 2026 · Train to Poughkeepsie</div>
        </div>
      </div>
    );
  }

  // Fri Sep 4 — travel day, not a riding day
  if (phase === 'during' && isPreRideDay && !activeDayId) {
    return (
      <div className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-3 border border-slate-700/50">
        <div className="text-2xl">🚆</div>
        <div className="text-left">
          <div className="text-slate-200 font-semibold">Travel day</div>
          <div className="text-slate-500 text-xs">Training up to Poughkeepsie — riding starts tomorrow</div>
        </div>
      </div>
    );
  }

  if (phase === 'after') {
    return null;
  }

  // During trip, with an active LiveTrack session — the only case that
  // actually justifies "Currently Riding!"
  if (activeDayId && garminUrl) {
    const activeDay = DAYS_DATA.find((d) => d.id === activeDayId);
    return (
      <div className="space-y-3">
        <div className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-3 border border-amber-500/40 shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-400 font-semibold">Currently Riding!</span>
          </div>
          <div className="text-slate-400 text-sm">
            Day {activeDayId}: {activeDay?.from_location} → {activeDay?.to_location}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={garminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Zap className="w-4 h-4" />
            Watch Them Live — Garmin LiveTrack
          </a>
          <LiveTrackFreshness updatedAt={garminUpdatedAt} />
        </div>
      </div>
    );
  }

  // Today is a riding day, but no LiveTrack session is active right now
  // (not started yet, or already finished) — say which day it is without
  // implying anyone's actually on the bike this moment.
  if (activeDayId) {
    const activeDay = DAYS_DATA.find((d) => d.id === activeDayId);
    return (
      <div className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-3 border border-slate-700/50">
        <span className="text-slate-200 font-semibold">Today:</span>
        <span className="text-slate-400 text-sm">
          Day {activeDayId}: {activeDay?.from_location} → {activeDay?.to_location}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 glass rounded-2xl px-5 py-2.5 border border-slate-700/50">
      <span className="text-slate-400 text-sm">{completedDays} days completed · On the trail</span>
    </div>
  );
}


function SectionHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg bg-highland-rust/20 border border-highland-rust/20 flex items-center justify-center text-highland-rust mt-0.5 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-200">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatPill({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="glass rounded-xl px-3 py-4 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="font-display font-bold text-slate-200 text-sm sm:text-base">{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}

