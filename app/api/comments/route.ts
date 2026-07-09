import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createSafeClient } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

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
    .from('comments')
    .select('id, day_id, user_name, content, created_at')
    .eq('day_id', dayId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  try {
    const { dayId, name, content } = await request.json();

    if (!dayId || !name?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'dayId, name, and content are required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('comments')
      .insert({
        day_id: dayId,
        user_name: name.trim().slice(0, 50),
        content: content.trim().slice(0, 500),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('comments').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
