import { createSafeClient } from '@/lib/supabase';
import { POST_HIKE_DAYS } from '@/lib/tripData';
import { Plane, Calendar, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';

export const revalidate = 0;

async function getDayContent(dayId: number): Promise<string | null> {
  const supabase = createSafeClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('diary_entries')
    .select('content')
    .eq('day_id', dayId)
    .single();

  return data?.content ?? null;
}

function renderContent(content: string) {
  const lines = content.split('\n').filter((l) => l.trim());
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.replace(/^[\s\-*•]+/, '').trim();
        if (!trimmed) return null;
        // Skip divider lines (________________) and zero-width space lines
        if (/^[_\u200b\u200c\u200d\s]+$/.test(trimmed)) return null;

        // Lines like "10am:", "Morning:", "Evening:" are subheadings
        const isHeading = /^(morning|afternoon|evening|night|\d{1,2}(am|pm)[\s:])/i.test(trimmed);

        if (isHeading) {
          return (
            <li key={i} className="pt-2 first:pt-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {trimmed}
              </span>
            </li>
          );
        }

        return (
          <li key={i} className="flex gap-2 items-start">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-highland-purple/60 flex-shrink-0" />
            <span className="text-slate-300 text-sm">{trimmed}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default async function PostHikePage() {
  const contents = await Promise.all(POST_HIKE_DAYS.map((d) => getDayContent(d.id)));

  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-slate-950 pt-16">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-highland-purple/10 border border-highland-purple/20 text-highland-purple">
              <Plane className="w-3 h-3" />
              After the ride
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-2">
            Post-ride
          </h1>
          <p className="text-slate-400 text-lg">
            Montreal · Sep 12–14 · Flying home Monday
          </p>
        </div>
      </div>

      {/* Days */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {POST_HIKE_DAYS.map((day, i) => {
          const content = contents[i];
          return (
            <div
              key={day.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
            >
              {/* Day header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-highland-purple/10 border border-highland-purple/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-highland-purple">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{day.label}</p>
                    <h2 className="text-slate-200 font-semibold">{day.title}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  Montreal
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                {content ? (
                  renderContent(content)
                ) : (
                  <p className="text-slate-600 text-sm italic">
                    No content yet — sync from Google Doc via the admin dashboard.
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Google Doc sync note */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-4 flex items-start gap-3">
          <Calendar className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <p className="text-slate-500 text-sm">
            Content is synced from the Google Doc. In the admin dashboard, add headings containing{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-300">Saturday</code> +{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-300">12</code>,{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-300">Sunday</code> +{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-300">13</code>, and{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-300">Monday</code> +{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded text-slate-300">14</code>{' '}
            for the three Montreal/travel days, then click Sync Doc.
          </p>
        </div>
      </div>
    </main>
    </>
  );
}
