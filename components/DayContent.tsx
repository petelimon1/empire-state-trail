'use client';

import { Download } from 'lucide-react';
import StravaActivity from '@/components/StravaActivity';
import DiaryEntry from '@/components/DiaryEntry';
import PhotoGallery from '@/components/PhotoGallery';
import Comments from '@/components/Comments';
import { DayData } from '@/types';

interface DayContentProps {
  day: DayData;
  stravaActivityId: string | null;
  isToday: boolean;
  isAdmin?: boolean;
  garminLivetrackUrl: string | null;
  garminLivetrackUpdatedAt?: string | null;
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

      {/* Each day now has its own completed Strava activity above, so the
          planned route card (distance/elevation, elevation chart) is
          redundant — just keep the GPX download it also offered. */}
      {day.route_url && (
        <a
          href={`/api/gpx/${day.id}`}
          download
          className="glass-card rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800/60 border border-slate-700/50 text-slate-300 px-4 py-3.5 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Download GPX for this day
        </a>
      )}

      <DiaryEntry dayId={day.id} />

      <PhotoGallery dayId={day.id} isAdmin={isAdmin} />

      <Comments dayId={day.id} />
    </div>
  );
}
