import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getStravaActivity } from '@/lib/strava';
import { createServiceClient } from '@/lib/supabase';
import { DAYS_DATA } from '@/lib/tripData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('activityId');

  if (!activityId) {
    return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
  }

  try {
    const activity = await getStravaActivity(activityId);
    return NextResponse.json(activity);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch activity' }, { status: 500 });
  }
}

// Manually save a Strava activity to the correct day (or test slot)
export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { activityId } = await request.json();
  if (!activityId) {
    return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
  }

  try {
    const activity = await getStravaActivity(String(activityId));
    const activityDate = activity.start_date_local?.split('T')[0];

    const day = activityDate ? DAYS_DATA.find((d) => d.date === activityDate) : null;
    const saveId = day ? day.id : 99;

    const supabase = createServiceClient();

    // Try updating the existing row first (avoids NOT NULL issues on other columns)
    const { data: updated, error: updateError } = await supabase
      .from('days')
      .update({ strava_activity_id: String(activityId) })
      .eq('id', saveId)
      .select('id');

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // If no row existed (test slot not yet created), insert with all required fields
    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase
        .from('days')
        .insert({
          id: saveId,
          date: activityDate || '2099-01-01',
          title: 'Test Activity',
          from_location: 'Test',
          to_location: 'Test',
          distance_km: 0,
          elevation_m: 0,
          strava_activity_id: String(activityId),
        });
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, savedToDay: saveId, activity });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
