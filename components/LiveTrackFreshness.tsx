'use client';

import { useState, useEffect } from 'react';

// Small "synced Xm ago" label for the Garmin LiveTrack button/banner, so
// followers can tell a stale link from a fresh one at a glance. Ticks on an
// interval rather than computing once, since the page itself may sit open
// in a background tab for hours during a ride.
export default function LiveTrackFreshness({ updatedAt }: { updatedAt: string | null | undefined }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!updatedAt) {
      setLabel(null);
      return;
    }

    const update = () => {
      const then = new Date(updatedAt).getTime();
      if (isNaN(then)) {
        setLabel(null);
        return;
      }
      const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
      if (diffMin < 1) setLabel('Synced just now');
      else if (diffMin === 1) setLabel('Synced 1 min ago');
      else if (diffMin < 60) setLabel(`Synced ${diffMin} min ago`);
      else {
        const hours = Math.round(diffMin / 60);
        setLabel(`Synced ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`);
      }
    };

    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  if (!label) return null;

  return <span className="text-xs text-slate-500">{label}</span>;
}
