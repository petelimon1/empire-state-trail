import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createSafeClient } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

// Try to extract current coordinates from a Garmin LiveTrack KML feed
async function fetchGarminCoords(livetackUrl: string): Promise<{ lat: number; lng: number; source: 'garmin' } | null> {
  try {
    const kmlUrl = livetackUrl.replace(/\/$/, '') + '/kml';
    const res = await fetch(kmlUrl, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const kml = await res.text();

    // Garmin KML: <coordinates>lng,lat,elevation</coordinates>
    // The last Placemark in the feed is the most recent position
    const matches = [...kml.matchAll(/<coordinates>\s*([-\d.]+),([-\d.]+),[\d.]*\s*<\/coordinates>/g)];
    if (matches.length === 0) return null;

    // Use the last match (most recent position)
    const last = matches[matches.length - 1];
    const lng = parseFloat(last[1]);
    const lat = parseFloat(last[2]);

    if (isNaN(lat) || isNaN(lng)) return null;
    // Sanity check: must be somewhere along the Brooklyn-to-Montreal corridor
    if (lat < 40 || lat > 46 || lng < -75 || lng > -72) return null;

    return { lat, lng, source: 'garmin' };
  } catch {
    return null;
  }
}

// GET /api/location — returns current lat/lng
// Priority: 1) Garmin KML (if LiveTrack URL set)  2) stored coords  3) null
export async function GET() {
  const supabase = createSafeClient();
  if (!supabase) {
    return NextResponse.json({ lat: null, lng: null, source: null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const { data } = await supabase
    .from('trip_status')
    .select('garmin_livetrack_url, current_lat, current_lng, location_updated_at')
    .eq('id', 1)
    .single();

  if (!data) {
    return NextResponse.json({ lat: null, lng: null, source: null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // Try Garmin KML first if we have a live URL
  if (data.garmin_livetrack_url) {
    const garminCoords = await fetchGarminCoords(data.garmin_livetrack_url);
    if (garminCoords) {
      // Also store the fetched coords so other consumers can use them
      const svc = createServiceClient();
      await svc.from('trip_status').update({
        current_lat: garminCoords.lat,
        current_lng: garminCoords.lng,
        location_updated_at: new Date().toISOString(),
      }).eq('id', 1);

      return NextResponse.json({
        lat: garminCoords.lat,
        lng: garminCoords.lng,
        source: 'garmin',
        updated_at: new Date().toISOString(),
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
  }

  // Fall back to stored coords (e.g. from iOS Shortcut)
  if (data.current_lat != null && data.current_lng != null) {
    return NextResponse.json({
      lat: data.current_lat,
      lng: data.current_lng,
      source: 'manual',
      updated_at: data.location_updated_at,
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ lat: null, lng: null, source: null }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/location — iOS Shortcut fallback: { lat, lng, secret }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, secret } = body;

    // Allow both admin session and webhook secret for the iOS Shortcut
    const webhookSecret = process.env.GARMIN_WEBHOOK_SECRET;
    const isAdmin = await getAdminSession();
    const hasSecret = webhookSecret && secret === webhookSecret;

    if (!isAdmin && !hasSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng must be numbers' }, { status: 400 });
    }

    // Sanity check: must be roughly along the Brooklyn-to-Montreal corridor
    if (lat < 40 || lat > 46 || lng < -75 || lng > -72) {
      return NextResponse.json({ error: 'Coordinates out of expected range' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('trip_status')
      .update({
        current_lat: lat,
        current_lng: lng,
        location_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, lat, lng });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE /api/location — clear stored coordinates (admin only)
export async function DELETE() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('trip_status')
    .update({ current_lat: null, current_lng: null, location_updated_at: null })
    .eq('id', 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
