'use client';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '560px', background: '#0f172a', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#475569', fontSize: 14 }}>Loading map…</span>
    </div>
  ),
});

export default RouteMap;
