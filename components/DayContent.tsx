'use client';

import { Map, ExternalLink, Download } from 'lucide-react';
import StravaActivity from '@/components/StravaActivity';
import DiaryEntry from '@/components/DiaryEntry';
import PhotoGallery from '@/components/PhotoGallery';
import Comments from '@/components/Comments';
import ElevationProfileChart from '@/components/ElevationProfileChart';
import { DayData } from '@/types';
import { DistanceValue, ElevationValue } from '@/components/UnitValue';

interface DayContentProps {
  day: DayData;
  stravaActivityId: string | null;
  isToday: boolean;
  isAdmin?: boolean;
  garminLivetrackUrl: string | null;
  garminLivetrackUpdatedAt?: string | null;
  elevationProfile?: { d: number; e: number }[];
}

// Everything for a day, stacked on one scrolling page — no tabs, so nothing
// is hidden behind a click. Each section below already renders its own
// title internally, which doubles as the visual divider between sections.
export default function DayContent({
  day,
  stravaActivityId,
  isToday,
  isAdmin = false,
  garminLivetrackUrl,
  garminLivetrackUpdatedAt,
  elevationProfile,
}: DayContentProps) {
  return (
    <div className="space-y-6">
      <StravaActivity
        dayId={day.id}
        activityId={stravaActivityId ?? day.strava_activity_id}
        isToday={isToday}
        garminLivetrackUrl={garminLivetrackUrl}
        garminLivetrackUpdatedAt={garminLivetrackUpdatedAt}
        routeUrl={day.route_url}
      />

      {/* Route — Strava routes don't offer a public embeddable widget, so link out instead */}
      {day.route_url && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-highland-green" />
              <h3 className="font-display text-sm font-semibold text-slate-200">Planned Route</h3>
            </div>
            <a
              href={day.route_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-xs transition-colors"
            >
              Open on Strava <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 rounded-lg p-3">
              <div className="text-slate-500 text-xs uppercase tracking-wider">Distance</div>
              <div className="text-slate-200 font-semibold text-lg"><DistanceValue km={day.distance_km} /></div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3">
              <div className="text-slate-500 text-xs uppercase tracking-wider">Elevation</div>
              <div className="text-slate-200 font-semibold text-lg"><ElevationValue m={day.elevation_m} /></div>
            </div>
          </div>

          {elevationProfile && elevationProfile.length > 1 && (
            <div className="px-5 pb-5">
              <ElevationProfileChart profile={elevationProfile} />
            </div>
          )}

          <div className="px-5 pb-5">
            <a
              href={`/api/gpx/${day.id}`}
              download
              className="flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full"
            >
              <Download className="w-4 h-4" />
              Download GPX for this day
            </a>
          </div>
        </div>
      )}

      <DiaryEntry dayId={day.id} />

      <PhotoGallery dayId={day.id} isAdmin={isAdmin} />

      <Comments dayId={day.id} />
    </div>
  );
}
