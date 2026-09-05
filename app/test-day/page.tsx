import { FlaskConical, MapPin, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import StravaActivity from '@/components/StravaActivity';
import PhotoGallery from '@/components/PhotoGallery';
import Comments from '@/components/Comments';
import TestDiaryEditor from './TestDiaryEditor';
import { createSafeClient } from '@/lib/supabase';

export const revalidate = 0;

async function getData() {
  const supabase = createSafeClient();
  if (!supabase) return { livetrackUrl: null, livetrackUpdatedAt: null, stravaActivityId: null };

  const { data } = await supabase
    .from('days')
    .select('strava_activity_id, garmin_livetrack_url, garmin_livetrack_updated_at')
    .eq('id', 99)
    .single();

  return {
    livetrackUrl: data?.garmin_livetrack_url ?? null,
    livetrackUpdatedAt: data?.garmin_livetrack_updated_at ?? null,
    stravaActivityId: data?.strava_activity_id ?? null,
  };
}

export default async function TestDayPage() {
  const { livetrackUrl, livetrackUpdatedAt, stravaActivityId } = await getData();

  const checklist = [
    {
      label: 'LiveTrack appears when you start a Garmin activity',
      hint: 'Via Zapier → /api/garmin/webhook',
    },
    {
      label: 'Strava stats appear after finishing the activity',
      hint: 'Via Strava webhook → auto-matched to today\'s date → saved to slot 99',
    },
    {
      label: 'Photos upload and display correctly',
      hint: 'Use the upload zone in the Photos section below',
    },
    {
      label: 'Diary entry saves and displays',
      hint: 'Use the diary editor below (must be logged in as admin)',
    },
    {
      label: 'Comments work (sign in with Google)',
      hint: 'Leave a test comment below',
    },
  ];

  const activeCount = [
    livetrackUrl !== null,
    stravaActivityId !== null,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-highland-gradient opacity-40" />
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-highland-purple/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
              <FlaskConical className="w-3 h-3" />
              Test Day
            </span>
            <span className="text-slate-500 text-sm">Not part of the real trip</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            <span className="text-slate-400 font-normal text-2xl sm:text-3xl block mb-1">Integration Test</span>
            Garmin · Strava · Photos · Diary
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 text-slate-400 px-3 py-1 rounded-full text-sm">
              <MapPin className="w-3.5 h-3.5" />
              Any location
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 text-slate-400 px-3 py-1 rounded-full text-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              Any distance
            </div>
          </div>
        </div>
      </section>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div className="h-full bg-yellow-500/60" style={{ width: `${(activeCount / 2) * 100}%` }} />
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Strava / LiveTrack */}
            <StravaActivity
              dayId={99}
              activityId={stravaActivityId}
              isToday={true}
              garminLivetrackUrl={livetrackUrl}
              garminLivetrackUpdatedAt={livetrackUpdatedAt}
              routeUrl="https://www.strava.com/routes"
            />

            {/* Diary editor */}
            <TestDiaryEditor />

            {/* Photos — isAdmin enables upload zone */}
            <PhotoGallery dayId={99} isAdmin={true} />

            {/* Comments */}
            <Comments dayId={99} />
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Test checklist */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-5 py-3">
                <h3 className="font-display font-semibold text-slate-200 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-yellow-400" />
                  Test Checklist
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {checklist.map((item, i) => {
                  const done = i === 0 ? livetrackUrl !== null : i === 1 ? stravaActivityId !== null : false;
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-xs font-medium ${done ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {item.label}
                        </p>
                        <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{item.hint}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How it works */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">How This Works</p>
              <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
                <p><span className="text-slate-300">LiveTrack:</span> Start a Garmin activity → Garmin emails you → Zapier grabs the URL → appears here within ~2 min</p>
                <p><span className="text-slate-300">Strava:</span> Finish activity → Garmin syncs to Strava → webhook fires → stats appear here within ~5 min</p>
                <p><span className="text-slate-300">Real trip:</span> Activities recorded on Sep 5–11 will auto-link to Day 1–7 instead of this test page</p>
              </div>
            </div>

            {/* Admin link */}
            <div className="text-center">
              <a
                href="/admin/dashboard"
                className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
              >
                Admin dashboard →
              </a>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
