import { NextRequest, NextResponse } from 'next/server';
import { DAYS_DATA } from '@/lib/tripData';
import { createServiceClient } from '@/lib/supabase';
import { getStravaActivity } from '@/lib/strava';

// GET: Strava calls this to verify the webhook subscription
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST: Strava sends activity events here
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Only handle new activity creation
    if (body.object_type !== 'activity' || body.aspect_type !== 'create') {
      return NextResponse.json({ status: 'ignored' });
    }

    const activityId: string = String(body.object_id);

    // Fetch full activity to get the date
    const activity = await getStravaActivity(activityId);
    const activityDate = activity.start_date_local?.split('T')[0]; // YYYY-MM-DD

    if (!activityDate) {
      return NextResponse.json({ status: 'no_date' });
    }

    // Match to a trip day by date — fall back to test slot (id=99) if none matches
    const day = DAYS_DATA.find((d) => d.date === activityDate);
    const saveId = day ? day.id : 99;

    // Save activity ID to Supabase (upsert so test slot row doesn't need to pre-exist)
    const supabase = createServiceClient();

    // Try updating the existing row first (avoids NOT NULL issues on other columns)
    const { data: updated, error: updateError } = await supabase
      .from('days')
      .update({ strava_activity_id: activityId })
      .eq('id', saveId)
      .select('id');

    if (updateError) {
      console.error('Supabase error saving Strava activity:', updateError);
      return NextResponse.json({ status: 'db_error', message: updateError.message });
    }

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
          strava_activity_id: activityId,
        });
      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return NextResponse.json({ status: 'db_error', message: insertError.message });
      }
    }

    // Activity is done — clear this day's own LiveTrack URL so the button
    // disappears (scoped to this day only, so it doesn't affect any other
    // day's in-progress LiveTrack session).
    await supabase
      .from('days')
      .update({ garmin_livetrack_url: null, garmin_livetrack_updated_at: null })
      .eq('id', saveId);

    if (day) {
      console.log(`✅ Strava webhook: auto-linked activity ${activityId} to Day ${day.id} (${activityDate})`);
      return NextResponse.json({ status: 'linked', dayId: day.id, activityId });
    } else {
      console.log(`🧪 Strava webhook: no trip day for ${activityDate} — saved activity ${activityId} to test slot`);
      return NextResponse.json({ status: 'test_slot', dayId: 99, activityId, date: activityDate });
    }

  } catch (err: any) {
    console.error('Strava webhook error:', err);
    // Always return 200 — if we return an error Strava will retry repeatedly
    return NextResponse.json({ status: 'error', message: err.message });
  }
}
