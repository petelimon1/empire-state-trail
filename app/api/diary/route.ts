import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { createServiceClient, createSafeClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dayId = parseInt(searchParams.get('dayId') || '');

  if (isNaN(dayId)) {
    return NextResponse.json({ error: 'Invalid dayId' }, { status: 400 });
  }

  const supabase = createSafeClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('day_id', dayId)
    .single();

  if (error?.code === 'PGRST116') {
    // No row found - not an error, just no entry yet
    return NextResponse.json(null);
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { dayId, content } = await request.json();

    if (!dayId || content === undefined) {
      return NextResponse.json({ error: 'dayId and content required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('diary_entries')
      .upsert(
        {
          day_id: dayId,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'day_id' }
      )
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
