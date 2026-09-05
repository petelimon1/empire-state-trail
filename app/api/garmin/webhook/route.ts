import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveActiveDayId } from '@/lib/tripData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept secret from header OR body (headers can get stripped by CDN)
    const secret = request.headers.get('x-webhook-secret')
      || request.headers.get('authorization')
      || body.webhook_secret;
    const expectedSecret = process.env.GARMIN_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Accept URL from livetrack_url field, or from Zapier Formatter's Extract Pattern output
    const rawUrl = body.livetrack_url || body.url || body.livetrackUrl || body.output?.['0'] || body.output?.[0];

    if (!rawUrl) {
      return NextResponse.json({ error: 'livetrack_url is required' }, { status: 400 });
    }

    // Clean the URL: trim whitespace, strip trailing junk, and remove any duplicate
    // URL that got concatenated (e.g. "https://...DA6https://..." → "https://...DA6")
    let livetackUrl = String(rawUrl).trim();
    // If a second https:/ appears after the first (single or double slash), truncate there
    const secondHttps = livetackUrl.indexOf('https:/', 10);
    if (secondHttps > 0) livetackUrl = livetackUrl.substring(0, secondHttps);
    // Strip any remaining trailing junk characters
    livetackUrl = livetackUrl.replace(/[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/, '');

    // Validate it looks like a Garmin URL
    if (!livetackUrl.includes('livetrack.garmin.com') && !livetackUrl.includes('connect.garmin.com')) {
      return NextResponse.json({ error: 'Invalid Garmin URL' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // LiveTrack is stored per-day (days.garmin_livetrack_url), not globally,
    // so finishing one day and starting the next never requires a manual
    // clear/re-paste. Attribute this ping to whichever day is "current" —
    // an admin override if the trip is running off the fixed schedule,
    // otherwise whichever day's date matches today — falling back to the
    // test slot (99) if neither resolves.
    const { data: tripStatus } = await supabase
      .from('trip_status')
      .select('current_day')
      .eq('id', 1)
      .single();
    const dayId = resolveActiveDayId(tripStatus?.current_day) ?? 99;

    const { data: updated, error } = await supabase
      .from('days')
      .update({
        garmin_livetrack_url: livetackUrl,
        garmin_livetrack_updated_at: new Date().toISOString(),
      })
      .eq('id', dayId)
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Test slot row may not exist yet — insert it with required fields.
    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase
        .from('days')
        .insert({
          id: dayId,
          date: '2099-01-01',
          title: 'Test Activity',
          from_location: 'Test',
          to_location: 'Test',
          distance_km: 0,
          elevation_m: 0,
          garmin_livetrack_url: livetackUrl,
          garmin_livetrack_updated_at: new Date().toISOString(),
        });
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    console.log(`Garmin LiveTrack URL updated via webhook for day ${dayId}:`, livetackUrl);
    return NextResponse.json({ success: true, dayId, url: livetackUrl });
  } catch (err: any) {
    console.error('Garmin webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook failed' }, { status: 500 });
  }
}
