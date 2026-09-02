import { Metadata } from 'next';
import { Mountain, MapPin, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import DayCard from '@/components/DayCard';
import RouteMapDynamic from '@/components/RouteMapDynamic';
import { DAYS_DATA, TRIP_START_DATE, TRIP_END_DATE, TRIP_TIMEZONE, TRIP_STATS, PRE_RIDE_DAY } from '@/lib/tripData';
import { DayStatus } from '@/types';
import { createSafeClient } from '@/lib/supabase';
import { DistanceValue, ElevationValue } from '@/components/UnitValue';
import LiveTrackFreshness from '@/components/LiveTrackFreshness';
import TripProgressStrip from '@/components/TripProgressStrip';

export const metadata: Metadata = {
  title: 'Empire State Trail 2026 | Pete & Lena\'s Ride',
  description: 'Follow Pete & Lena\'s 542km bike ride from Poughkeepsie to Montreal along the Empire State Trail, Sept 5–11, 2026 (after training up from Brooklyn on Sept 4).',
};

export const revalidate = 60;

async function getTripStatus() {
  const supabase = createSafeClient();
  if (!supabase) return { current_day: null, garmin_livetrack_url: null, updated_at: null };
  try {
    const { data } = await supabase
      .from('trip_status')
      .select('current_day, garmin_livetrack_url, updated_at')
      .eq('id', 1)
      .single();
    return data || { current_day: null, garmin_livetrack_url: null, updated_at: null };
  } catch {
    return { current_day: null, garmin_livetrack_url: null, updated_at: null };
  }
}

// Post-ride day IDs: 9 = Sat Sep 12, 10 = Sun Sep 13, 11 = Mon Sep 14
async function getPostHikeDiaryEntries(): Promise<Record<number, string>> {
  const supabase = createSafeClient();
  if (!supabase) return {};
  try {
    const { data } = await supabase
      .from('diary_entries')
      .select('day_id, content')
      .in('day_id', [9, 10, 11]);
    if (!data) return {};
    return Object.fromEntries(data.map((r) => [r.day_id, r.content]));
  } catch {
    return {};
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

function getDayStatuses(currentDate: string): Record<number, DayStatus> {
  const statuses: Record<number, DayStatus> = {};
  DAYS_DATA.forEach((day) => {
    if (currentDate < day.date) statuses[day.id] = 'upcoming';
    else if (currentDate === day.date) statuses[day.id] = 'active';
    else statuses[day.id] = 'completed';
  });
  return statuses;
}

export default async function HomePage() {
  const tripInfo = getTripInfo();
  const dayStatuses = getDayStatuses(tripInfo.currentDate);
  const [tripStatus, postHikeDiary] = await Promise.all([
    getTripStatus(),
    getPostHikeDiaryEntries(),
  ]);

  const completedDays = Object.values(dayStatuses).filter((s) => s === 'completed').length;
  const progressPercent = Math.round((completedDays / DAYS_DATA.length) * 100);

  const completedDistance = DAYS_DATA
    .filter(d => dayStatuses[d.id] === 'completed')
    .reduce((sum, d) => sum + (d.distance_km ?? 0), 0);
  const remainingDistance = Math.max(0, TRIP_STATS.totalDistance - completedDistance);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center overflow-hidden">
        {/* Hero background — paved trail through fall foliage, Hudson Valley area */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1695596255645-e609fe4c090c?auto=format&fit=crop&w=1920&q=80')" }}
        />
        {/* Minimal dark overlay — heavier at top for nav, lighter in middle, dark at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pt-40 sm:pt-48">
          <h1 className="font-display font-semibold tracking-tight leading-tight text-white mb-6">
            <span className="block text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl">Empire State Trail</span>
            <span className="block text-2xl sm:text-3xl font-light tracking-widest text-white/50 mt-3">2026</span>
          </h1>

          {/* Status Banner */}
          <div className="mt-10">
            <StatusBanner phase={tripInfo.phase} daysUntil={tripInfo.daysUntil} activeDayId={tripInfo.activeDayId} isPreRideDay={tripInfo.isPreRideDay} garminUrl={tripStatus?.garmin_livetrack_url} garminUpdatedAt={tripStatus?.updated_at} completedDays={completedDays} />
          </div>

          {/* Stats */}
          <div className="mt-12 text-white/60">
            {/* Mobile: 2x2 grid */}
            <div className="grid grid-cols-2 gap-4 sm:hidden">
              <div className="text-center">
                <div className="font-display font-semibold text-white text-lg"><DistanceValue km={TRIP_STATS.totalDistance} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Distance</div>
              </div>
              <div className="text-center">
                <div className="font-display font-semibold text-white text-lg"><ElevationValue m={TRIP_STATS.totalElevation} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Elevation</div>
              </div>
              <div className="text-center">
                <div className="font-display font-semibold text-white text-lg"><DistanceValue km={completedDistance} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-display font-semibold text-white text-lg"><DistanceValue km={remainingDistance} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Remaining</div>
              </div>
            </div>
            {/* Desktop: row with dividers */}
            <div className="hidden sm:flex items-center justify-center gap-10">
              <div className="text-center">
                <div className="font-display font-semibold text-white text-xl"><DistanceValue km={TRIP_STATS.totalDistance} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Distance</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="font-display font-semibold text-white text-xl"><ElevationValue m={TRIP_STATS.totalElevation} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Elevation</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="font-display font-semibold text-white text-xl"><DistanceValue km={completedDistance} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Completed</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="font-display font-semibold text-white text-xl"><DistanceValue km={remainingDistance} /></div>
                <div className="text-xs tracking-wider uppercase mt-0.5">Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Map */}
      <div className="relative bg-slate-950">
        <RouteMapDynamic
          height="560px"
          currentDayId={tripInfo.activeDayId}
          dayStatuses={dayStatuses}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

          {/* Progress Section */}
          <section>
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-slate-200">
                    Journey Progress
                  </h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {tripInfo.phase === 'before'
                      ? `${DAYS_DATA.length} riding days planned`
                      : `${completedDays} of ${DAYS_DATA.length} days completed`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold font-display gradient-text">{progressPercent}%</div>
                  <div className="text-slate-500 text-xs">complete</div>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-highland-purple to-highland-green rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-600">
                <span>Poughkeepsie</span>
                <span>Montreal</span>
              </div>

              <TripProgressStrip days={DAYS_DATA} dayStatuses={dayStatuses} />
            </div>
          </section>

          {/* Pre-ride travel day */}
          <section>
            <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto text-left">
              <h3 className="font-display text-lg font-semibold text-slate-300 mb-3 text-center">Before the Ride</h3>
              <div className="text-sm">
                <div className="text-slate-400 font-medium mb-1">{PRE_RIDE_DAY.label} — {PRE_RIDE_DAY.title}</div>
                <div className="space-y-0.5 pl-3 border-l border-slate-700/60">
                  <div className="text-slate-400">{PRE_RIDE_DAY.accommodation_name}</div>
                  <div className="text-slate-500 text-xs">{PRE_RIDE_DAY.accommodation_notes}</div>
                </div>
              </div>
            </div>
          </section>

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

          {/* Post-trip info */}
          <section className="text-center pb-8">
            <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto text-left">
              <h3 className="font-display text-lg font-semibold text-slate-300 mb-4 text-center">After the Ride</h3>
              <div className="space-y-4">
                <PostHikeDay
                  label="Sat Sep 12"
                  fallback="Montreal - Plans TBD"
                  content={postHikeDiary[9]}
                />
                <PostHikeDay
                  label="Sun Sep 13"
                  fallback="Montreal - Plans TBD"
                  content={postHikeDiary[10]}
                />
                <PostHikeDay
                  label="Mon Sep 14"
                  fallback="Rental car pickup 9am, drive back to Brooklyn"
                  content={postHikeDiary[11]}
                />
              </div>
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
    return (
      <div className="inline-flex items-center gap-3 glass rounded-2xl px-6 py-3 border border-emerald-500/30">
        <div className="text-2xl">🏆</div>
        <div className="text-left">
          <div className="text-emerald-400 font-semibold">Trip Completed!</div>
          <div className="text-slate-500 text-xs">All <DistanceValue km={TRIP_STATS.totalDistance} /> ridden · Montreal reached</div>
        </div>
      </div>
    );
  }

  // During trip
  if (activeDayId) {
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
        {garminUrl && (
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
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 glass rounded-2xl px-5 py-2.5 border border-slate-700/50">
      <span className="text-slate-400 text-sm">{completedDays} days completed · On the trail</span>
    </div>
  );
}


function PostHikeDay({ label, fallback, content }: { label: string; fallback: string; content?: string }) {
  if (!content) {
    return (
      <div className="text-sm text-slate-500">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="mx-2">—</span>
        {fallback}
      </div>
    );
  }

  // Render each non-empty line of the diary content
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <div className="text-sm">
      <div className="text-slate-400 font-medium mb-1">{label}</div>
      <div className="space-y-0.5 pl-3 border-l border-slate-700/60">
        {lines.map((line, i) => (
          <div key={i} className="text-slate-400">{line}</div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg bg-highland-purple/20 border border-highland-purple/20 flex items-center justify-center text-highland-purple mt-0.5 flex-shrink-0">
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

