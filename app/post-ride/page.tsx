import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import DayVideo from '@/components/DayVideo';
import DiaryEntry from '@/components/DiaryEntry';
import PhotoGallery from '@/components/PhotoGallery';
import { MONTREAL_DAY_ID } from '@/lib/tripData';
import { createSafeClient } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Post-ride: Montreal | Empire State Trail 2026',
  description: 'Video, diary and photos from our time in Montreal after finishing the ride.',
};

async function getVideoUrl(): Promise<string | null> {
  const supabase = createSafeClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('days')
      .select('video_url')
      .eq('id', MONTREAL_DAY_ID)
      .single();
    return data?.video_url ?? null;
  } catch {
    return null;
  }
}

export default async function PostRidePage() {
  const [videoUrl, isAdmin] = await Promise.all([
    getVideoUrl(),
    getAdminSession(),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-16">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-2">
              Montreal
            </h1>
            <p className="text-slate-400 text-lg">
              After the ride · Sep 12–14, 2026
            </p>
          </div>
        </div>

        {/* Content — video, diary, photos, stacked on one scrolling page
            like the day pages, since Montreal isn't a riding day with its
            own Strava activity or route to show */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <DayVideo videoUrl={videoUrl} />
          <DiaryEntry dayId={MONTREAL_DAY_ID} />
          <PhotoGallery dayId={MONTREAL_DAY_ID} isAdmin={isAdmin} />
        </div>
      </main>
    </>
  );
}
