import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { createServiceClient, createSafeClient } from '@/lib/supabase';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dayId = parseInt(searchParams.get('dayId') || '');

  if (isNaN(dayId)) {
    return NextResponse.json({ error: 'Invalid dayId' }, { status: 400 });
  }

  const supabase = createSafeClient();
  if (!supabase) {
    return NextResponse.json([], { status: 200 });
  }

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('day_id', dayId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dayId = parseInt(formData.get('dayId') as string);
    const caption = formData.get('caption') as string | null;

    if (!file || isNaN(dayId)) {
      return NextResponse.json({ error: 'file and dayId required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Convert any image (including HEIC) to JPEG using sharp
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const jpegBuffer = await sharp(inputBuffer)
      .rotate() // auto-rotate based on EXIF orientation
      .jpeg({ quality: 85 })
      .toBuffer();

    // Always store as .jpg
    const filename = `day-${dayId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filename, jpegBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filename);

    // Save to database
    const { data, error } = await supabase
      .from('photos')
      .insert({
        day_id: dayId,
        storage_path: filename,
        public_url: publicUrl,
        caption: caption || null,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) {
      // Cleanup uploaded file on DB error
      await supabase.storage.from('photos').remove([filename]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ photo: data }, { status: 201 });
  } catch (err) {
    console.error('Photo upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('id');

  if (!photoId) {
    return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get the photo first to get storage path
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('id', photoId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  // Delete from storage
  await supabase.storage.from('photos').remove([photo.storage_path]);

  // Delete from database
  const { error } = await supabase.from('photos').delete().eq('id', photoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
