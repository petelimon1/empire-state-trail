import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

const CALLBACK_URL = 'https://sensational-otter-7923f5.netlify.app/api/strava/webhook';

// GET: check current subscription status
export async function GET() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions?client_id=${process.env.STRAVA_CLIENT_ID}&client_secret=${process.env.STRAVA_CLIENT_SECRET}`
    );
    const data = await res.json();
    const active = Array.isArray(data) && data.length > 0;
    return NextResponse.json({ active, subscriptions: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create a new subscription
export async function POST() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        callback_url: CALLBACK_URL,
        verify_token: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
    return NextResponse.json({ success: true, subscription: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: remove the subscription
export async function DELETE() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // First find the subscription ID
    const listRes = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions?client_id=${process.env.STRAVA_CLIENT_ID}&client_secret=${process.env.STRAVA_CLIENT_SECRET}`
    );
    const subs = await listRes.json();
    if (!Array.isArray(subs) || subs.length === 0) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    const subId = subs[0].id;
    const delRes = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions/${subId}?client_id=${process.env.STRAVA_CLIENT_ID}&client_secret=${process.env.STRAVA_CLIENT_SECRET}`,
      { method: 'DELETE' }
    );

    if (delRes.status === 204) return NextResponse.json({ success: true });
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
