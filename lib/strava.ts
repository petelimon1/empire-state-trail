import { StravaActivity } from '@/types';
import { createServiceClient } from './supabase';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// Strava rotates the refresh token on every use — the response to a refresh
// call includes a NEW refresh_token, and the old one stops working. Each
// serverless invocation is a fresh process, so a refresh token cached only
// in an env var (never updated after deploy) goes stale after exactly one
// use anywhere. Caching the access token + persisting the rotated refresh
// token in the database (shared across invocations) fixes both: most calls
// reuse the still-valid cached access token with no refresh at all, and
// when a refresh is needed, the next one picks up the current token.
export async function getStravaAccessToken(): Promise<string> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing Strava credentials');
  }

  const supabase = createServiceClient();
  const { data: cached } = await supabase
    .from('strava_tokens')
    .select('access_token, access_token_expires_at, refresh_token')
    .eq('id', 1)
    .single();

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (
    cached?.access_token &&
    cached?.access_token_expires_at &&
    cached.access_token_expires_at - 300 > nowSeconds
  ) {
    return cached.access_token;
  }

  // Fall back to the env var only for the very first call ever made — after
  // that, the database always holds the current (rotated) refresh token.
  const refreshToken = cached?.refresh_token || process.env.STRAVA_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('Missing Strava refresh token');
  }

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to refresh Strava token: ${err}`);
  }

  const data = await response.json();

  await supabase
    .from('strava_tokens')
    .update({
      access_token: data.access_token,
      access_token_expires_at: data.expires_at,
      refresh_token: data.refresh_token,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  return data.access_token;
}

export async function getStravaActivity(activityId: string): Promise<StravaActivity> {
  const accessToken = await getStravaAccessToken();

  // No caching here: Next.js's fetch Data Cache keys on URL, not on the
  // Authorization header, so a cached response (including an error from an
  // expired token) would keep being served after a token refresh until the
  // 300s window passed — a second, independent staleness bug on top of the
  // Route Handler caching fixed alongside this. The route above already
  // sets its own Cache-Control-free, force-dynamic response, and the client
  // polls on its own interval, so no caching is needed at this layer.
  const response = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to fetch Strava activity: ${err}`);
  }

  return response.json();
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatPace(metersPerSecond: number): string {
  // Convert m/s to min/km
  const minPerKm = 1000 / (metersPerSecond * 60);
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

export function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(1) + ' km';
}

export function getStravaActivityUrl(activityId: string | number): string {
  return `https://www.strava.com/activities/${activityId}`;
}
