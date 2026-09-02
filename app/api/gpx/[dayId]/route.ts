import { NextRequest, NextResponse } from 'next/server';
import { DAYS_DATA } from '@/lib/tripData';
import { ROUTE_ELEVATION_POINTS } from '@/lib/routeElevation';

// Re-exports the day's route (as fetched from Strava) as a standalone GPX
// file, so anyone following along can load the actual planned route into
// their own GPS device or app — no Strava account needed.
export async function GET(request: NextRequest, { params }: { params: { dayId: string } }) {
  const dayId = parseInt(params.dayId);
  const day = DAYS_DATA.find((d) => d.id === dayId);
  const points = ROUTE_ELEVATION_POINTS[dayId];

  if (!day || !points || points.length === 0) {
    return NextResponse.json({ error: 'No route found for this day' }, { status: 404 });
  }

  const name = `Day ${day.id}: ${day.from_location} to ${day.to_location}`;
  const trkpts = points
    .map((p) => `      <trkpt lat="${p.lat}" lon="${p.lon}"><ele>${p.ele}</ele></trkpt>`)
    .join('\n');

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Empire State Trail 2026" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(`${day.distance_km}km, ${day.elevation_m}m elevation — ${day.date}`)}</desc>
  </metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;

  return new NextResponse(gpx, {
    headers: {
      'Content-Type': 'application/gpx+xml',
      'Content-Disposition': `attachment; filename="day-${day.id}-${day.date}.gpx"`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
