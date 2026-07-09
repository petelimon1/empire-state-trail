import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

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

    const { error } = await supabase
      .from('trip_status')
      .update({
        garmin_livetrack_url: livetackUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Garmin LiveTrack URL updated via webhook:', livetackUrl);
    return NextResponse.json({ success: true, url: livetackUrl });
  } catch (err: any) {
    console.error('Garmin webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook failed' }, { status: 500 });
  }
}
