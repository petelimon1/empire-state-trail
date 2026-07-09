'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimeInfo {
  time: string;
  date: string;
  label: string;
  timezone: string;
}

function getTimeInZone(timezone: string): TimeInfo {
  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const date = now.toLocaleDateString('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return { time, date, label: '', timezone };
}

function getTimezoneLabel(tz: string): string {
  // Map common timezones to friendly names
  const map: Record<string, string> = {
    'Europe/London': 'London (BST/GMT)',
    'America/New_York': 'New York (ET)',
    'America/Los_Angeles': 'Los Angeles (PT)',
    'America/Chicago': 'Chicago (CT)',
    'America/Denver': 'Denver (MT)',
    'America/Toronto': 'Toronto (ET)',
    'America/Vancouver': 'Vancouver (PT)',
    'Europe/Paris': 'Paris (CET)',
    'Europe/Berlin': 'Berlin (CET)',
    'Asia/Tokyo': 'Tokyo (JST)',
    'Asia/Sydney': 'Sydney (AEDT)',
    'Australia/Sydney': 'Sydney (AEDT)',
    'Pacific/Auckland': 'Auckland (NZST)',
  };
  return map[tz] || tz.replace('_', ' ').split('/').pop() || tz;
}

export default function TimezoneDisplay() {
  const [tripTime, setTripTime] = useState<TimeInfo | null>(null);
  const [localTime, setLocalTime] = useState<TimeInfo | null>(null);
  const [isTripTz, setIsTripTz] = useState(false);

  useEffect(() => {
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tripTz = 'America/New_York';
    const inTripTz = userTz === tripTz || userTz === 'America/Toronto';
    setIsTripTz(inTripTz);

    const update = () => {
      const trip = getTimeInZone(tripTz);
      trip.label = 'Trip (ET)';
      setTripTime(trip);

      if (!inTripTz) {
        const local = getTimeInZone(userTz);
        local.label = getTimezoneLabel(userTz);
        setLocalTime(local);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!tripTime) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-slate-400">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 text-highland-purple" />
        <div>
          <span className="text-slate-500 mr-1">{tripTime.label}:</span>
          <span className="font-mono text-slate-300 font-medium">{tripTime.time}</span>
        </div>
      </div>
      {!isTripTz && localTime && (
        <>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 mr-1">You:</span>
            <span className="font-mono text-slate-300 font-medium">{localTime.time}</span>
            <span className="text-slate-600 ml-1 hidden sm:inline">({localTime.label})</span>
          </div>
        </>
      )}
    </div>
  );
}
