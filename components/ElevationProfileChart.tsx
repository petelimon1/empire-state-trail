'use client';

import { useUnits } from './UnitsProvider';
import { formatDistanceKm, formatElevationM } from '@/lib/units';

interface Point {
  d: number; // cumulative distance in km
  e: number; // elevation in meters
}

// Lightweight inline SVG area chart — no charting library needed for a
// simple elevation-vs-distance profile. Renders the same downsampled
// {d, e} points used to power the GPX export, so the shape always matches
// the actual Strava route.
export default function ElevationProfileChart({ profile }: { profile: Point[] }) {
  const { unit } = useUnits();

  if (!profile || profile.length < 2) return null;

  const width = 600;
  const height = 160;
  const padTop = 12;
  const padBottom = 22;
  const padLeft = 4;
  const padRight = 4;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxD = profile[profile.length - 1].d || 1;
  const minE = Math.min(...profile.map((p) => p.e));
  const maxE = Math.max(...profile.map((p) => p.e));
  const eRange = Math.max(maxE - minE, 10); // avoid divide-by-zero on flat routes

  const x = (d: number) => padLeft + (d / maxD) * chartW;
  const y = (e: number) => padTop + chartH - ((e - minE) / eRange) * chartH;

  const linePath = profile
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.d).toFixed(1)} ${y(p.e).toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${x(profile[profile.length - 1].d).toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${x(0).toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
        <span>Elevation profile</span>
        <span>
          {formatElevationM(minE, unit)} – {formatElevationM(maxE, unit)}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--elev-line, #f59e0b)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--elev-line, #f59e0b)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#elevFill)" />
        <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Baseline */}
        <line x1={padLeft} y1={padTop + chartH} x2={width - padRight} y2={padTop + chartH} stroke="#334155" strokeWidth="1" />
      </svg>
      <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
        <span>0 {unit === 'imperial' ? 'mi' : 'km'}</span>
        <span>{formatDistanceKm(maxD, unit)}</span>
      </div>
    </div>
  );
}
