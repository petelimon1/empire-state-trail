import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { createServiceClient, createSafeClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createSafeClient();
  if (!supabase) {
    return NextResponse.json({ current_day: null });
  }

  const { data, error } = await supabase
    .from('trip_status')
    .select('current_day, current_lat, current_lng, location_updated_at, updated_at')
    .eq('id', 1)
    .single();

  if (error) {
    return NextResponse.json({ current_day: null });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = createServiceClient();

    // Handle day-specific strava activity update
    if (body.dayId && body.strava_activity_id !== undefined) {
      // Resolve any Strava URL or deep link to just the numeric/alphanumeric activity ID
      let activityId: string | null = body.strava_activity_id;
      if (activityId) {
        // strava.com/activities/ID or strava.com/activities/ID/anything
        const directMatch = activityId.match(/strava\.com\/activities\/([^/?#]+)/);
        if (directMatch) {
          activityId = directMatch[1];
        } else if (activityId.includes('strava.app.link') || activityId.includes('app.link')) {
          // Follow the redirect server-side to extract the real activity ID.
          // Must send a desktop browser User-Agent — Branch.io returns an app-store
          // page instead of redirecting when it detects a non-browser client.
          try {
            const res = await fetch(activityId, {
              redirect: 'follow',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              },
            });
            const finalUrl = res.url;
            const match = finalUrl.match(/strava\.com\/activities\/([^/?#]+)/);
            if (match) {
              activityId = match[1];
            } else {
              // Fallback: parse the HTML body for a strava.com/activities link
              const html = await res.text();
              const bodyMatch = html.match(/strava\.com\/activities\/([0-9]+)/);
              if (bodyMatch) activityId = bodyMatch[1];
            }
          } catch {
            return NextResponse.json({ error: 'Could not resolve Strava link' }, { status: 400 });
          }
        }
      }

      const { error } = await supabase
        .from('days')
        .update({ strava_activity_id: activityId })
        .eq('id', body.dayId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, resolved_id: activityId });
    }

    // Handle day-specific LiveTrack URL update (manual override/fallback —
    // normally this is set automatically per-day by the Garmin webhook)
    if (body.dayId && body.garmin_livetrack_url !== undefined) {
      const url: string | null = body.garmin_livetrack_url || null;

      const { error } = await supabase
        .from('days')
        .update({
          garmin_livetrack_url: url,
          garmin_livetrack_updated_at: url ? new Date().toISOString() : null,
        })
        .eq('id', body.dayId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Handle trip status update
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if ('current_day' in body) updates.current_day = body.current_day;

    const { data, error } = await supabase
      .from('trip_status')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
