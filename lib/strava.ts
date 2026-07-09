import { StravaActivity } from '@/types';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export async function getStravaAccessToken(): Promise<string> {
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Missing Strava credentials');
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
  return data.access_token;
}

export async function getStravaActivity(activityId: string): Promise<StravaActivity> {
  const accessToken = await getStravaAccessToken();

  const response = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
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
