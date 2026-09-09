import { NextRequest, NextResponse } from 'next/server';
import { getStravaActivity } from '@/lib/strava';
import { DAYS_DATA } from '@/lib/tripData';
import { createSafeClient } from '@/lib/supabase';

// Next.js caches GET Route Handlers by default when nothing marks them as
// dynamic — including error responses. Without this, a single failed
// Strava fetch (e.g. from a since-fixed token issue) could get cached and
// keep being served verbatim on every subsequent request, forever, with
// the handler never actually re-running to pick up the fix.
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { dayId: string } }
) {
  const dayId = parseInt(params.dayId);

  // Allow 1–7 (real days) and 99 (test slot)
  if (isNaN(dayId) || (dayId < 1 || dayId > 7) && dayId !== 99) {
    return NextResponse.json({ error: 'Invalid day ID' }, { status: 400 });
  }

  // Get strava activity ID from static data or database
  let activityId: string | null = null;

  const day = DAYS_DATA.find((d) => d.id === dayId);
  if (day?.strava_activity_id) {
    activityId = String(day.strava_activity_id);
  } else {
    // Try database
    const supabase = createSafeClient();
    if (supabase) {
      const { data } = await supabase
        .from('days')
        .select('strava_activity_id')
        .eq('id', dayId)
        .single();
      activityId = data?.strava_activity_id ? String(data.strava_activity_id) : null;
    }
  }

  if (!activityId) {
    return NextResponse.json({ error: 'No Strava activity linked for this day' }, { status: 404 });
  }

  try {
    const activity = await getStravaActivity(activityId);
    return NextResponse.json(activity);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch activity' }, { status: 500 });
  }
}
