'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RouteMapProps {
  height?: string;
  currentLat?: number | null;
  currentLng?: number | null;
  currentDayId?: number | null;
  dayStatuses?: Record<number, 'upcoming' | 'active' | 'completed'>;
}

// Approximate waypoints (city centers), [lng, lat]. Not a road-accurate
// polyline — swap in a GPX export from the Strava routes for a precise line.
const ALL_COORDS: [number, number][] = [
  [-73.9210, 41.7004],  // 0: Poughkeepsie (start)
  [-73.7902, 42.2528],  // 1: Hudson
  [-73.7562, 42.6526],  // 2: Albany
  [-73.5843, 43.2634],  // 3: Fort Edward
  [-73.4334, 43.9453],  // 4: Crown Point
  [-73.4529, 44.6995],  // 5: Plattsburgh
  [-73.3945, 45.1319],  // 6: Napierville area, QC
  [-73.5674, 45.5019],  // 7: Montreal (finish)
];

const DAY_SEGMENTS = [
  { day: 1, from: 'Poughkeepsie', to: 'Hudson',        color: '#10b981', coords: ALL_COORDS.slice(0, 2) },
  { day: 2, from: 'Hudson',       to: 'Albany',        color: '#06b6d4', coords: ALL_COORDS.slice(1, 3) },
  { day: 3, from: 'Albany',       to: 'Fort Edward',   color: '#60a5fa', coords: ALL_COORDS.slice(2, 4) },
  { day: 4, from: 'Fort Edward',  to: 'Crown Point',   color: '#a78bfa', coords: ALL_COORDS.slice(3, 5) },
  { day: 5, from: 'Crown Point',  to: 'Plattsburgh',   color: '#e879f9', coords: ALL_COORDS.slice(4, 6) },
  { day: 6, from: 'Plattsburgh',  to: 'Napierville',   color: '#fb923c', coords: ALL_COORDS.slice(5, 7) },
  { day: 7, from: 'Napierville',  to: 'Montreal',      color: '#f472b6', coords: ALL_COORDS.slice(6, 8) },
];

// Overnight stop: end coord of each day 1-6 (day 7 ends at the finish marker)
const OVERNIGHT_STOPS: { day: number; coord: [number, number]; color: string; from: string; to: string }[] = [
  { day: 1, coord: [-73.7902, 42.2528], color: '#10b981', from: 'Poughkeepsie', to: 'Hudson'       },
  { day: 2, coord: [-73.7562, 42.6526], color: '#06b6d4', from: 'Hudson',       to: 'Albany'       },
  { day: 3, coord: [-73.5843, 43.2634], color: '#60a5fa', from: 'Albany',       to: 'Fort Edward'  },
  { day: 4, coord: [-73.4334, 43.9453], color: '#a78bfa', from: 'Fort Edward',  to: 'Crown Point'  },
  { day: 5, coord: [-73.4529, 44.6995], color: '#e879f9', from: 'Crown Point',  to: 'Plattsburgh'  },
  { day: 6, coord: [-73.3945, 45.1319], color: '#fb923c', from: 'Plattsburgh',  to: 'Napierville'  },
];

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

      // --- Route line layers ---
      DAY_SEGMENTS.forEach((seg) => {
        const status = dayStatuses?.[seg.day];
        const opacity = status === 'upcoming' ? 0.35 : 0.9;
        const width = status === 'active' ? 5 : 4;

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
            'line-width': 6,
            'line-opacity': 0.15,
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
      });

      // --- Fit bounds ---
      const bounds = ALL_COORDS.reduce<[[number, number], [number, number]]>(
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
        .setLngLat([-73.9210, 41.7004])
        .addTo(m);

      // --- Finish marker (Montreal) ---
      const finishEl = document.createElement('div');
      finishEl.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#f87171;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.4)">F</div>`;
      new mapboxgl.Marker({ element: finishEl })
        .setLngLat([-73.5674, 45.5019])
        .addTo(m);

      // --- Overnight stop markers (days 1-7) ---
      OVERNIGHT_STOPS.forEach((stop) => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:${stop.color};border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer">${stop.day}</div>`;

        const popup = new mapboxgl.Popup({
          offset: 16,
          closeButton: false,
          maxWidth: '240px',
        }).setHTML(`
          <div style="font-family:system-ui,sans-serif;padding:2px 0">
            <div style="font-weight:700;color:#e2e8f0;font-size:13px;border-left:3px solid ${stop.color};padding-left:8px;margin-bottom:4px">
              Day ${stop.day}
            </div>
            <div style="color:#94a3b8;font-size:12px;padding-left:11px;margin-bottom:10px">
              ${stop.from} → ${stop.to}
            </div>
            <a href="/day/${stop.day}"
               style="display:flex;align-items:center;justify-content:space-between;margin:0 2px;padding:6px 10px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:7px;color:#c4b5fd;font-size:11px;font-weight:600;text-decoration:none;transition:background 0.15s;">
              View Day ${stop.day}
              <span style="margin-left:6px;opacity:0.8">→</span>
            </a>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(stop.coord)
          .setPopup(popup)
          .addTo(m);

        // Keep popup visible when moving between the marker and the popup itself.
        // A 120ms grace period covers the gap between the two elements.
        let hideTimer: ReturnType<typeof setTimeout> | null = null;

        const showPopup = () => {
          if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
          if (!marker.getPopup()?.isOpen()) marker.getPopup()?.addTo(m);
        };

        const scheduleHide = () => {
          hideTimer = setTimeout(() => {
            marker.getPopup()?.remove();
            hideTimer = null;
          }, 120);
        };

        el.addEventListener('mouseenter', showPopup);
        el.addEventListener('mouseleave', scheduleHide);

        // Clicking the circle also navigates directly
        el.addEventListener('click', () => { window.location.href = `/day/${stop.day}`; });

        // Attach hover handlers to popup once it opens
        popup.on('open', () => {
          const popupEl = popup.getElement();
          if (popupEl) {
            popupEl.addEventListener('mouseenter', showPopup);
            popupEl.addEventListener('mouseleave', scheduleHide);
          }
        });
      });

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
          <div key={seg.day} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: seg.day < 8 ? 5 : 0 }}>
            <div style={{ width: 24, height: 3, borderRadius: 2, background: seg.color }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'system-ui' }}>Day {seg.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
