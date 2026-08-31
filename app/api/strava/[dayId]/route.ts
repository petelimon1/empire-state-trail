import { NextRequest, NextResponse } from 'next/server';
import { getStravaActivity } from '@/lib/strava';
import { DAYS_DATA } from '@/lib/tripData';
import { createSafeClient } from '@/lib/supabase';

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
    return NextResponse.json(activity, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch activity' }, { status: 500 });
  }
}
