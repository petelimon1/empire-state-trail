import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { createSafeClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dayId = parseInt(searchParams.get('dayId') || '');
  if (isNaN(dayId)) return NextResponse.json({ error: 'Invalid dayId' }, { status: 400 });

  const supabase = createSafeClient();
  if (!supabase) return NextResponse.json({ strava_activity_id: null, garmin_livetrack_url: null, garmin_livetrack_updated_at: null });

  const { data } = await supabase
    .from('days')
    .select('strava_activity_id, garmin_livetrack_url, garmin_livetrack_updated_at')
    .eq('id', dayId)
    .single();

  return NextResponse.json({
    strava_activity_id: data?.strava_activity_id ?? null,
    garmin_livetrack_url: data?.garmin_livetrack_url ?? null,
    garmin_livetrack_updated_at: data?.garmin_livetrack_updated_at ?? null,
  });
}
