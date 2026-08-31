import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Bed,
  UtensilsCrossed,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DayTabs from '@/components/DayTabs';
import PageTransition from '@/components/PageTransition';
import { DAYS_DATA, TRIP_TIMEZONE } from '@/lib/tripData';
import { DayData, DayStatus } from '@/types';
import { createSafeClient } from '@/lib/supabase';
import { getStravaActivity, formatDuration, formatDistance } from '@/lib/strava';
import { cn } from '@/lib/utils';
import TimezoneDisplay from '@/components/TimezoneDisplay';

interface PageProps {
  params: { dayId: string };
}

export async function generateStaticParams() {
  return DAYS_DATA.map((d) => ({ dayId: String(d.id) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dayId = parseInt(params.dayId);
  const day = DAYS_DATA.find((d) => d.id === dayId);
  if (!day) return { title: 'Day Not Found' };

  return {
    title: `Day ${day.id}: ${day.from_location} to ${day.to_location}`,
    description: `Day ${day.id} of the Empire State Trail ride — ${day.from_location} to ${day.to_location}, ${day.distance_km}km, ${day.elevation_m}m elevation.`,
  };
}

async function getTripStatus() {
  const supabase = createSafeClient();
  if (!supabase) return { current_day: null, garmin_livetrack_url: null };
  try {
    const { data } = await supabase
      .from('trip_status')
      .select('current_day, garmin_livetrack_url')
      .eq('id', 1)
      .single();
    return data || { current_day: null, garmin_livetrack_url: null };
  } catch {
    return { current_day: null, garmin_livetrack_url: null };
  }
}

async function getStravaActivityId(dayId: number): Promise<string | null> {
  const supabase = createSafeClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('days')
      .select('strava_activity_id')
      .eq('id', dayId)
      .single();
    return data?.strava_activity_id ? String(data.strava_activity_id) : null;
  } catch {
    return null;
  }
}

function getDayStatus(day: DayData): DayStatus {
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TRIP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  if (today < day.date) return 'upcoming';
  if (today === day.date) return 'active';
  return 'completed';
}

async function getDayTimes(dayId: number): Promise<{ departure_time: string | null; arrival_time: string | null }> {
  const supabase = createSafeClient();
  if (!supabase) return { departure_time: null, arrival_time: null };
  try {
    const { data } = await supabase
      .from('days')
      .select('departure_time, arrival_time')
      .eq('id', dayId)
      .single();
    return {
      departure_time: data?.departure_time ?? null,
      arrival_time: data?.arrival_time ?? null,
    };
  } catch {
    return { departure_time: null, arrival_time: null };
  }
}

async function getFirstPhoto(dayId: number): Promise<string | null> {
  const supabase = createSafeClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('photos')
      .select('public_url')
      .eq('day_id', dayId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    return data?.public_url || null;
  } catch {
    return null;
  }
}

async function getStravaStats(activityId: string) {
  try {
    const activity = await getStravaActivity(activityId);
    return {
      distance: activity.distance,
      moving_time: activity.moving_time,
      total_elevation_gain: activity.total_elevation_gain,
    };
  } catch {
    return null;
  }
}

export const revalidate = 60;


export default async function DayPage({ params }: PageProps) {
  const dayId = parseInt(params.dayId);
  if (isNaN(dayId) || dayId < 1 || dayId > 7) notFound();

  const day = DAYS_DATA.find((d) => d.id === dayId);
  if (!day) notFound();

  const prevDay = DAYS_DATA.find((d) => d.id === dayId - 1);
  const nextDay = DAYS_DATA.find((d) => d.id === dayId + 1);
  const status = getDayStatus(day);

  const [tripStatus, stravaActivityId, heroPhoto, dayTimes] = await Promise.all([
    getTripStatus(),
    getStravaActivityId(dayId),
    getFirstPhoto(dayId),
    getDayTimes(dayId),
  ]);

  // isToday: either the calendar date matches, OR admin has manually set current_day to this day
  const isToday = status === 'active' || tripStatus?.current_day === dayId;
  const isCompleted = status === 'completed' && tripStatus?.current_day !== dayId;

  // Only fetch real Strava stats for completed days (cached for 5 min by Next.js fetch)
  const stravaStats = (isCompleted && stravaActivityId)
    ? await getStravaStats(stravaActivityId)
    : null;

  const STATUS_LABEL: Record<DayStatus, string> = {
    upcoming: 'Upcoming',
    active: 'Today',
    completed: 'Completed',
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <PageTransition>

      {/* Day Header Hero */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background: blurred hero photo if available, gradient fallback */}
        {heroPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPhoto}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/70 to-slate-950/95" />
          </>
        ) : (
          <div className="absolute inset-0 bg-highland-gradient opacity-50" />
        )}

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4">

            {/* ← Prev day */}
            {prevDay ? (
              <Link
                href={`/day/${prevDay.id}`}
                title={`Day ${prevDay.id}: ${prevDay.from_location} → ${prevDay.to_location}`}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-slate-700/60 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
            ) : (
              <div className="flex-shrink-0 w-9" />
            )}

            {/* Centre: meta + title */}
            <div className="flex-1 min-w-0">

              {/* Meta row — badge is the only accent colour; everything else is muted */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                  isToday ? 'badge-active' : isCompleted ? 'badge-completed' : 'badge-upcoming'
                )}>
                  {STATUS_LABEL[status]}
                </span>
                <span className="text-slate-500 text-xs">
                  {new Date(day.date + 'T12:00:00Z').toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                  {stravaStats
                    ? ` · ${formatDistance(stravaStats.distance)} · ${formatDuration(stravaStats.moving_time)} · ${stravaStats.total_elevation_gain.toFixed(0)}m`
                    : ` · ${day.distance_km} km · ${day.elevation_m}m elev`}
                  {day.id === 5 ? ' · Longest day' : day.id === 7 ? ' · Final day 🏁' : ''}
                </span>
              </div>

              {/* Title + LiveTrack button */}
              <div className="flex items-end justify-between gap-3">
                <h1 className="font-display font-bold text-white leading-tight min-w-0">
                  <span className="text-slate-500 text-xs font-normal block mb-1 tracking-wide uppercase">
                    Day {day.id} of {DAYS_DATA.length}
                  </span>
                  <span className="text-2xl sm:text-3xl block truncate">
                    {day.from_location}
                    <span className="text-slate-500 mx-2 font-light">→</span>
                    {day.to_location}
                  </span>
                </h1>

                {isToday && tripStatus?.garmin_livetrack_url && (
                  <a
                    href={tripStatus.garmin_livetrack_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-xl transition-colors text-sm shadow-lg shadow-amber-500/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                    <span className="hidden sm:inline">Watch Them Live</span>
                    <span className="sm:hidden">Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

            </div>

            {/* → Next day */}
            {nextDay ? (
              <Link
                href={`/day/${nextDay.id}`}
                title={`Day ${nextDay.id}: ${nextDay.from_location} → ${nextDay.to_location}`}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-slate-700/60 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="flex-shrink-0 w-9" />
            )}

          </div>
        </div>
      </section>

      {/* Progress bar across top */}
      <div className="h-1 bg-slate-800">
        <div
          className={cn(
            'h-full transition-all duration-1000',
            isCompleted ? 'bg-highland-green' : isToday ? 'bg-amber-500' : 'bg-slate-700'
          )}
          style={{ width: isCompleted ? '100%' : isToday ? '50%' : '0%' }}
        />
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Two-column layout for md+ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column - Tabbed content */}
          <div className="lg:col-span-2">
            <DayTabs
              day={day}
              stravaActivityId={stravaActivityId}
              isToday={isToday}
              garminLivetrackUrl={tripStatus?.garmin_livetrack_url ?? null}
              departureTime={dayTimes.departure_time}
              arrivalTime={dayTimes.arrival_time}
            />
          </div>

          {/* Right column - Itinerary details */}
          <div className="space-y-5">

            {/* Day itinerary card */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="bg-highland-purple/10 border-b border-highland-purple/20 px-5 py-3">
                <h3 className="font-display font-semibold text-slate-200">Day Itinerary</h3>
              </div>

              <div className="p-5 space-y-5">
                {/* Ride details */}
                <div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Ride</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Distance</span>
                      <span className="text-slate-200 font-medium">{day.distance_km} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Elevation</span>
                      <span className="text-slate-200 font-medium">{day.elevation_m} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">From</span>
                      <span className="text-slate-200">{day.from_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">To</span>
                      <span className="text-slate-200">{day.to_location}</span>
                    </div>
                    {dayTimes.departure_time && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Depart</span>
                        <span className="text-slate-200 font-medium">{dayTimes.departure_time}</span>
                      </div>
                    )}
                    {dayTimes.arrival_time && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Est. arrival</span>
                        <span className="text-slate-200 font-medium">{dayTimes.arrival_time}</span>
                      </div>
                    )}
                  </div>
                  {day.route_url && (
                    <a
                      href={day.route_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-xs mt-3 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Strava
                    </a>
                  )}
                </div>

                {/* Resupply */}
                {day.resupply_notes && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Resupply
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{day.resupply_notes}</p>
                  </div>
                )}

                {/* Food stops */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    Food Stops
                    {day.dinner_booked && (
                      <span className="ml-auto badge-completed px-1.5 py-0.5 rounded text-xs flex items-center gap-1 normal-case">
                        <CheckCircle2 className="w-3 h-3" />
                        Booked
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {day.dinner_options.map((option, i) => (
                      <div key={i} className="bg-slate-900/60 rounded-lg p-2.5">
                        <div className="text-slate-300 text-sm font-medium">{option.name}</div>
                        {option.notes && (
                          <div className="text-slate-500 text-xs mt-0.5">{option.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {day.dinner_booking_notes && (
                    <div className="mt-2 flex items-start gap-1.5 text-amber-400/80 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{day.dinner_booking_notes}</span>
                    </div>
                  )}
                </div>

                {/* Accommodation */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                    <Bed className="w-3.5 h-3.5" />
                    Sleep
                    {day.accommodation_booking_ref && (
                      <span className="ml-auto badge-completed px-1.5 py-0.5 rounded text-xs flex items-center gap-1 normal-case">
                        <CheckCircle2 className="w-3 h-3" />
                        Booked
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-slate-200 text-sm font-medium">{day.accommodation_name}</div>
                      {day.accommodation_url && (
                        <a
                          href={day.accommodation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-highland-purple hover:text-purple-400 flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {day.accommodation_booking_ref && (
                      <div className="text-slate-500 text-xs mt-1">
                        Ref: {day.accommodation_booking_ref}
                      </div>
                    )}
                    {day.accommodation_notes && (
                      <div className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                        {day.accommodation_notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall route progress */}
            <div className="glass-card rounded-xl p-4">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Route Progress</div>
              <div className="space-y-1">
                {DAYS_DATA.map((d) => {
                  const dStatus = getDayStatus(d);
                  return (
                    <Link
                      key={d.id}
                      href={`/day/${d.id}`}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
                        d.id === dayId ? 'bg-highland-purple/20 text-highland-purple' : 'hover:bg-slate-800/50 text-slate-500 hover:text-slate-300'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        dStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        dStatus === 'active' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-500'
                      )}>
                        {d.id}
                      </div>
                      <span className="truncate">{d.to_location}</span>
                      <span className="ml-auto text-slate-600">{d.distance_km}km</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Day navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {prevDay ? (
            <Link
              href={`/day/${prevDay.id}`}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <div>
                <div className="text-xs text-slate-600">Previous</div>
                <div className="text-sm">Day {prevDay.id}: {prevDay.to_location}</div>
              </div>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm">Back to overview</span>
            </Link>
          )}

          {nextDay ? (
            <Link
              href={`/day/${nextDay.id}`}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors group text-right"
            >
              <div>
                <div className="text-xs text-slate-600">Next</div>
                <div className="text-sm">Day {nextDay.id}: {nextDay.to_location}</div>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors group">
              <span className="text-sm">Back to overview</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </main>
      </PageTransition>
    </div>
  );
}
