'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, TrendingUp, Zap, Heart, ExternalLink } from 'lucide-react';
import { StravaActivity as StravaActivityType } from '@/types';
import { formatDuration, getStravaActivityUrl } from '@/lib/strava';
import { useUnits } from './UnitsProvider';
import { formatDistanceMeters, formatElevationM, formatPaceFromMps } from '@/lib/units';
import LiveTrackFreshness from './LiveTrackFreshness';

interface StravaActivityProps {
  dayId: number;
  activityId?: string | null;
  isToday: boolean;
  garminLivetrackUrl?: string | null;
  garminLivetrackUpdatedAt?: string | null;
  routeUrl: string;
}

export default function StravaActivity({
  dayId,
  activityId,
  isToday,
  garminLivetrackUrl,
  garminLivetrackUpdatedAt,
  routeUrl,
}: StravaActivityProps) {
  const { unit } = useUnits();
  const [activity, setActivity] = useState<StravaActivityType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityId) return;
    setLoading(true);
    fetch(`/api/strava/${dayId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setActivity(data);
      })
      .catch(() => setError('Failed to load activity'))
      .finally(() => setLoading(false));
  }, [dayId, activityId]);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="skeleton h-5 w-48 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Completed with Strava activity — show this first, regardless of isToday
  if (activity) {
    const pace = formatPaceFromMps(activity.average_speed, unit);
    const movingTime = formatDuration(activity.moving_time);
    const distance = formatDistanceMeters(activity.distance, unit);
    const elevation = formatElevationM(activity.total_elevation_gain, unit);

    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Strava Activity</h3>
              <p className="text-slate-500 text-xs">{activity.name}</p>
            </div>
          </div>
          <a
            href={getStravaActivityUrl(activity.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-xs transition-colors"
          >
            View on Strava
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatBox icon={<Activity className="w-4 h-4" />} label="Distance" value={distance} color="text-highland-green" />
          <StatBox icon={<Clock className="w-4 h-4" />} label="Moving Time" value={movingTime} color="text-highland-purple" />
          <StatBox icon={<TrendingUp className="w-4 h-4" />} label="Elevation" value={elevation} color="text-amber-400" />
          <StatBox icon={<Zap className="w-4 h-4" />} label="Avg Speed" value={pace} color="text-blue-400" />
          {activity.average_heartrate && (
            <StatBox icon={<Heart className="w-4 h-4" />} label="Avg HR" value={`${Math.round(activity.average_heartrate)} bpm`} color="text-red-400" />
          )}
          {activity.max_heartrate && (
            <StatBox icon={<Heart className="w-4 h-4" />} label="Max HR" value={`${Math.round(activity.max_heartrate)} bpm`} color="text-red-500" />
          )}
        </div>

        {/* Strava branding */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-orange-500">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          <span className="text-slate-600 text-xs">Powered by Strava</span>
        </div>
      </div>
    );
  }

  // Strava API error
  if (error) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold text-slate-200">Strava</h3>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  // Today and live tracking active
  if (isToday && garminLivetrackUrl) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-semibold text-slate-200">Activity In Progress</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Pete &amp; Lena are riding right now! Watch the live track to follow along.
        </p>
        <a
          href={garminLivetrackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
        >
          <Zap className="w-4 h-4" />
          Watch Them Live — Garmin LiveTrack
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <div className="flex justify-center mt-2">
          <LiveTrackFreshness updatedAt={garminLivetrackUpdatedAt} />
        </div>
      </div>
    );
  }

  // Today but no livetrack and no completed activity yet
  if (isToday && !activityId) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <h3 className="font-semibold text-slate-200">Activity In Progress</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Pete &amp; Lena are out riding today! Strava activity will appear when complete.
        </p>
        {routeUrl && (
          <a
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-highland-purple hover:text-purple-400 text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View planned route on Strava
          </a>
        )}
      </div>
    );
  }

  // No activity yet (upcoming or no ID set)
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-slate-500" />
        <h3 className="font-semibold text-slate-300">Planned Route</h3>
      </div>
      <p className="text-slate-500 text-sm mb-4">
        Strava activity will appear here after this day is completed.
      </p>
      {routeUrl ? (
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/30 text-orange-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          View Route on Strava
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : (
        <p className="text-slate-600 text-xs">No route link set yet.</p>
      )}
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-slate-900/60 rounded-lg p-3">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        <span className="w-4 h-4">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-slate-200 font-semibold text-base">{value}</div>
    </div>
  );
}
