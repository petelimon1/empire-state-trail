import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function POST() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const errors: string[] = [];

  // Clear strava_activity_id from day 99
  const { error: dayError } = await supabase
    .from('days')
    .update({ strava_activity_id: null })
    .eq('id', 99);
  if (dayError) errors.push(`days: ${dayError.message}`);

  // Clear diary entry for day 99
  const { error: diaryError } = await supabase
    .from('diary_entries')
    .delete()
    .eq('day_id', 99);
  if (diaryError) errors.push(`diary: ${diaryError.message}`);

  // Delete photos for day 99
  const { error: photosError } = await supabase
    .from('photos')
    .delete()
    .eq('day_id', 99);
  if (photosError) errors.push(`photos: ${photosError.message}`);

  // Clear LiveTrack URL from trip_status (leave current_day untouched)
  const { error: statusError } = await supabase
    .from('trip_status')
    .update({ garmin_livetrack_url: null })
    .neq('id', 0); // update all rows
  if (statusError) errors.push(`trip_status: ${statusError.message}`);

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
