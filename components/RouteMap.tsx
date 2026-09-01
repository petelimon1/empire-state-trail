'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ROUTE_GEOMETRY } from '@/lib/routeGeometry';
import { DAYS_DATA } from '@/lib/tripData';
import { UnitSystem, formatDistanceKm, formatElevationM } from '@/lib/units';

// The popup is built as a plain HTML string for Mapbox (not React), so it
// can't use the UnitsProvider context — read the same localStorage key
// directly instead. Cheap enough to re-read on every hover.
function currentUnit(): UnitSystem {
  try {
    const stored = localStorage.getItem('est-units');
    return stored === 'imperial' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

interface RouteMapProps {
  height?: string;
  currentLat?: number | null;
  currentLng?: number | null;
  currentDayId?: number | null;
  dayStatuses?: Record<number, 'upcoming' | 'active' | 'completed'>;
}

// Deep, saturated colors (Tailwind's 700-weight shades) so each day reads as
// clearly distinct even at the dimmed "upcoming" opacity — the lighter 400/500
// shades used before all washed out to look nearly identical at low opacity.
const DAY_COLORS: Record<number, string> = {
  1: '#15803d', // green-700
  2: '#0e7490', // cyan-700
  3: '#1d4ed8', // blue-700
  4: '#6d28d9', // violet-700
  5: '#a21caf', // fuchsia-700
  6: '#c2410c', // orange-700
  7: '#be123c', // rose-700
};

// Pulls from the real trip data + decoded Strava geometry, so distance/
// elevation/route link shown on hover always match the day pages — no
// separate copy to keep in sync.
const DAY_SEGMENTS = DAYS_DATA.map((day) => ({
  day: day.id,
  from: day.from_location,
  to: day.to_location,
  color: DAY_COLORS[day.id],
  coords: ROUTE_GEOMETRY[day.id],
  distanceKm: day.distance_km,
  elevationM: day.elevation_m,
  routeUrl: day.route_url,
}));

const START_COORD = DAY_SEGMENTS[0].coords[0];
const FINISH_COORD = DAY_SEGMENTS[DAY_SEGMENTS.length - 1].coords[DAY_SEGMENTS[DAY_SEGMENTS.length - 1].coords.length - 1];

export default function RouteMap({
  height = '560px',
  currentLat,
  currentLng,
  currentDayId,
  dayStatuses,
}: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const liveMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [livePos, setLivePos] = useState<{ lat: number; lng: number; source: string } | null>(
    currentLat != null && currentLng != null ? { lat: currentLat, lng: currentLng, source: 'init' } : null
  );

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Poll /api/location every 60 seconds for live position
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/location', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.lat != null && data.lng != null) {
          setLivePos({ lat: data.lat, lng: data.lng, source: data.source ?? 'unknown' });
        }
      } catch { /* silent */ }
    }

    poll(); // immediate first poll
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, []);

  // Move/create the live marker whenever livePos or mapLoaded changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const m = mapRef.current;

    if (livePos) {
      if (liveMarkerRef.current) {
        // Just move the existing marker
        liveMarkerRef.current.setLngLat([livePos.lng, livePos.lat]);
      } else {
        // Create pulse marker for the first time
        if (!document.getElementById('est-pulse-style')) {
          const style = document.createElement('style');
          style.id = 'est-pulse-style';
          style.textContent = `
            @keyframes est-pulse {
              0%,100%{transform:scale(1);opacity:0.4}
              50%{transform:scale(2.6);opacity:0}
            }
          `;
          document.head.appendChild(style);
        }

        const pulseEl = document.createElement('div');
        pulseEl.style.cssText = 'position:relative;width:22px;height:22px;';
        pulseEl.innerHTML = `
          <div style="
            position:absolute;inset:0;border-radius:50%;background:#3b82f6;
            animation:est-pulse 1.8s ease-in-out infinite;
          "></div>
          <div style="
            position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2.5px solid white;
            box-shadow:0 0 8px rgba(59,130,246,0.7);
          "></div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 16,
          closeButton: false,
          maxWidth: '180px',
        }).setHTML(`
          <div style="font-family:system-ui,sans-serif;padding:2px 0">
            <div style="font-weight:700;color:#e2e8f0;font-size:13px;border-left:3px solid #3b82f6;padding-left:8px;margin-bottom:3px">
              Pete &amp; Lena's location
            </div>
            <div style="color:#94a3b8;font-size:11px;padding-left:11px">Live · updates every 60s</div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: pulseEl })
          .setLngLat([livePos.lng, livePos.lat])
          .setPopup(popup)
          .addTo(m);

        pulseEl.addEventListener('mouseenter', () => marker.getPopup()?.addTo(m));
        pulseEl.addEventListener('mouseleave', () => marker.getPopup()?.remove());

        liveMarkerRef.current = marker;
      }
    } else if (liveMarkerRef.current) {
      // No position — remove the marker
      liveMarkerRef.current.remove();
      liveMarkerRef.current = null;
    }
  }, [livePos, mapLoaded]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !token) return;

    mapboxgl.accessToken = token;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-73.6, 43.0],
      zoom: 6,
      scrollZoom: false,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current.on('load', () => {
      const m = mapRef.current!;

      // --- Route line layers (road-accurate, from each day's Strava route) ---
      DAY_SEGMENTS.forEach((seg) => {
        const status = dayStatuses?.[seg.day];
        // Upcoming days used to sit at 0.35 opacity, which washed every color
        // out to look nearly identical. Bumped up so the distinct per-day
        // colors actually read at a glance.
        const opacity = status === 'upcoming' ? 0.75 : status === 'completed' ? 0.9 : 1;
        const width = status === 'active' ? 6 : 4.5;

        m.addSource(`route-day-${seg.day}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: seg.coords },
          },
        });

        // Shadow layer (underneath)
        m.addLayer({
          id: `line-day-${seg.day}-shadow`,
          type: 'line',
          source: `route-day-${seg.day}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#000000',
            'line-width': width + 2,
            'line-opacity': 0.2,
          },
        });

        // Colored line on top
        m.addLayer({
          id: `line-day-${seg.day}`,
          type: 'line',
          source: `route-day-${seg.day}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': seg.color,
            'line-width': width,
            'line-opacity': opacity,
          },
        });

        // Wide invisible hit-area on top — a 4-4.5px line is a hard target to
        // hover precisely, so widen just the interactive layer to ~20px.
        m.addLayer({
          id: `line-day-${seg.day}-hit`,
          type: 'line',
          source: `route-day-${seg.day}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#000000', 'line-width': 20, 'line-opacity': 0 },
        });
      });

      // --- Hover popup for route lines: distance, elevation, Strava link ---
      const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        maxWidth: '220px',
      });

      DAY_SEGMENTS.forEach((seg) => {
        const layerId = `line-day-${seg.day}-hit`;

        m.on('mouseenter', layerId, () => {
          m.getCanvas().style.cursor = 'pointer';
        });

        m.on('mousemove', layerId, (e) => {
          const unit = currentUnit();
          hoverPopup.setLngLat(e.lngLat).setHTML(`
            <div style="font-family:system-ui,sans-serif;padding:2px 0">
              <div style="font-weight:700;color:#e2e8f0;font-size:13px;border-left:3px solid ${seg.color};padding-left:8px;margin-bottom:6px">
                Day ${seg.day}: ${seg.from} → ${seg.to}
              </div>
              <div style="display:flex;gap:14px;padding-left:11px;margin-bottom:6px">
                <div>
                  <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.03em">Distance</div>
                  <div style="color:#cbd5e1;font-size:13px;font-weight:600">${formatDistanceKm(seg.distanceKm, unit)}</div>
                </div>
                <div>
                  <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:0.03em">Elevation</div>
                  <div style="color:#cbd5e1;font-size:13px;font-weight:600">${formatElevationM(seg.elevationM, unit)}</div>
                </div>
              </div>
              <div style="padding-left:11px;color:#475569;font-size:10px">Click for day details →</div>
            </div>
          `).addTo(m);
        });

        m.on('mouseleave', layerId, () => {
          m.getCanvas().style.cursor = '';
          hoverPopup.remove();
        });

        // Tapping a line on mobile (no hover) jumps straight to the day page.
        m.on('click', layerId, () => { window.location.href = `/day/${seg.day}`; });
      });

      // --- Fit bounds to the actual route geometry ---
      const allCoords = DAY_SEGMENTS.flatMap((seg) => seg.coords);
      const bounds = allCoords.reduce<[[number, number], [number, number]]>(
        (b, c) => [
          [Math.min(b[0][0], c[0]), Math.min(b[0][1], c[1])],
          [Math.max(b[1][0], c[0]), Math.max(b[1][1], c[1])],
        ],
        [[Infinity, Infinity], [-Infinity, -Infinity]]
      );
      m.fitBounds(
        [bounds[0], bounds[1]],
        { padding: { top: 60, bottom: 60, left: 60, right: 60 }, maxZoom: 9 }
      );

      // --- Start marker (Poughkeepsie) ---
      const startEl = document.createElement('div');
      startEl.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#10b981;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.4)">S</div>`;
      new mapboxgl.Marker({ element: startEl })
        .setLngLat(START_COORD)
        .addTo(m);

      // --- Finish marker (Montreal) ---
      const finishEl = document.createElement('div');
      finishEl.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#f87171;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.4)">F</div>`;
      new mapboxgl.Marker({ element: finishEl })
        .setLngLat(FINISH_COORD)
        .addTo(m);

      // Numbered day-boundary markers used to live here, each with its own
      // "Day N, from → to, View Day N" popup. Removed: the line-hover popup
      // now shows richer info (distance/elevation) for the whole segment, and
      // clicking anywhere on the line already navigates to the day page —
      // the markers were pure duplication once that shipped.

      setMapLoaded(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) {
    return (
      <div
        style={{ height, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ color: '#475569', fontSize: 14, fontFamily: 'system-ui' }}>Map loading...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 32, left: 12, zIndex: 10,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
        borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {DAY_SEGMENTS.map(seg => (
          <div key={seg.day} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: seg.day < 7 ? 5 : 0 }}>
            <div style={{ width: 24, height: 3, borderRadius: 2, background: seg.color }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'system-ui' }}>Day {seg.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
