'use client';

import { useState } from 'react';
import {
  Activity, Map, BookOpen, Camera, MessageSquare, Info,
  ExternalLink, Bed, UtensilsCrossed, ShoppingBag, CheckCircle2, AlertCircle,
} from 'lucide-react';
import StravaActivity from '@/components/StravaActivity';
import DiaryEntry from '@/components/DiaryEntry';
import PhotoGallery from '@/components/PhotoGallery';
import Comments from '@/components/Comments';
import { DayData } from '@/types';
import { cn } from '@/lib/utils';
import { DistanceValue, ElevationValue } from '@/components/UnitValue';

interface DayTabsProps {
  day: DayData;
  stravaActivityId: string | null;
  isToday: boolean;
  isAdmin?: boolean;
  garminLivetrackUrl: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
}

const TABS = [
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'route',    label: 'Route',    icon: Map },
  { id: 'diary',    label: 'Diary',    icon: BookOpen },
  { id: 'photos',   label: 'Photos',   icon: Camera },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'info',     label: 'Info',     icon: Info },   // mobile-only
] as const;

type TabId = typeof TABS[number]['id'];

export default function DayTabs({ day, stravaActivityId, isToday, isAdmin = false, garminLivetrackUrl, departureTime, arrivalTime }: DayTabsProps) {
  const [active, setActive] = useState<TabId>('activity');

  return (
    <div>
      {/* ── Tab bar ── */}
      <div className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/60 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                // Hide the Info tab on lg+ screens — itinerary is always visible in the sidebar
                id === 'info' ? 'lg:hidden' : '',
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                active === id
                  ? 'bg-highland-purple/20 text-highland-purple border border-highland-purple/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab panels ── */}
      {/* Render all panels; hide inactive ones so components mount once and don't refetch */}

      {/* Activity */}
      <div className={active === 'activity' ? 'block' : 'hidden'}>
        <StravaActivity
          dayId={day.id}
          activityId={stravaActivityId ?? day.strava_activity_id}
          isToday={isToday}
          garminLivetrackUrl={garminLivetrackUrl}
          routeUrl={day.route_url}
        />
      </div>

      {/* Route — Strava routes don't offer a public embeddable widget, so link out instead */}
      <div className={active === 'route' ? 'block' : 'hidden'}>
        {day.route_url ? (
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
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No route available.</p>
        )}
      </div>

      {/* Diary */}
      <div className={active === 'diary' ? 'block' : 'hidden'}>
        <DiaryEntry dayId={day.id} />
      </div>

      {/* Photos */}
      <div className={active === 'photos' ? 'block' : 'hidden'}>
        <PhotoGallery dayId={day.id} isAdmin={isAdmin} />
      </div>

      {/* Comments */}
      <div className={active === 'comments' ? 'block' : 'hidden'}>
        <Comments dayId={day.id} />
      </div>

      {/* Info — mobile only, mirrors the desktop sidebar itinerary */}
      <div className={cn(active === 'info' ? 'block' : 'hidden', 'lg:hidden')}>
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
                  <span className="text-slate-200 font-medium"><DistanceValue km={day.distance_km} /></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elevation</span>
                  <span className="text-slate-200 font-medium"><ElevationValue m={day.elevation_m} /></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">From</span>
                  <span className="text-slate-200">{day.from_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">To</span>
                  <span className="text-slate-200">{day.to_location}</span>
                </div>
                {departureTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Depart</span>
                    <span className="text-slate-200 font-medium">{departureTime}</span>
                  </div>
                )}
                {arrivalTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Est. arrival</span>
                    <span className="text-slate-200 font-medium">{arrivalTime}</span>
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
                    <CheckCircle2 className="w-3 h-3" /> Booked
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {day.dinner_options.map((option, i) => (
                  <div key={i} className="bg-slate-900/60 rounded-lg p-2.5">
                    <div className="text-slate-300 text-sm font-medium">{option.name}</div>
                    {option.notes && <div className="text-slate-500 text-xs mt-0.5">{option.notes}</div>}
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
                    <CheckCircle2 className="w-3 h-3" /> Booked
                  </span>
                )}
              </div>
              <div className="bg-slate-900/60 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-slate-200 text-sm font-medium">{day.accommodation_name}</div>
                  {day.accommodation_url && (
                    <a href={day.accommodation_url} target="_blank" rel="noopener noreferrer" className="text-highland-purple hover:text-purple-400 flex-shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                {day.accommodation_booking_ref && (
                  <div className="text-slate-500 text-xs mt-1">Ref: {day.accommodation_booking_ref}</div>
                )}
                {day.accommodation_notes && (
                  <div className="text-slate-500 text-xs mt-1.5 leading-relaxed">{day.accommodation_notes}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
