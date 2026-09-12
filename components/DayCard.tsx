'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { DayData, DayStatus } from '@/types';
import { formatShortDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { DistanceValue, ElevationValue } from '@/components/UnitValue';

interface DayCardProps {
  day: DayData;
  status: DayStatus;
  index: number;
}

const STATUS_CONFIG = {
  completed: {
    label: 'Completed',
    dotClass: 'bg-highland-green',
    textClass: 'text-[#7FAE8B]',
    borderClass: 'border-[#3F6B4A]/25 hover:border-[#3F6B4A]/50',
  },
  active: {
    label: 'Today',
    dotClass: 'bg-[#C99A3E]',
    textClass: 'text-[#D9AC4F]',
    borderClass: 'border-[#C99A3E]/40 hover:border-[#C99A3E]/70',
  },
  upcoming: {
    label: 'Upcoming',
    dotClass: 'bg-slate-600',
    textClass: 'text-slate-500',
    borderClass: 'border-slate-700/50 hover:border-slate-600/80',
  },
};

// A day number set large in the display serif, a small-caps status label
// instead of a filled pill, and a rule instead of a progress bar (which
// never meant anything for a single day anyway) — less "dashboard widget,"
// more "page from a trip journal."
export default function DayCard({ day, status, index }: DayCardProps) {
  const config = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link href={`/day/${day.id}`}>
        <div
          className={cn(
            'glass-card rounded-lg p-5 border transition-all duration-300 group cursor-pointer',
            config.borderClass
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-3xl text-slate-300 leading-none">
                {day.id}
              </span>
              <span className="text-xs text-slate-500">
                {formatShortDate(day.date)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
              <span className={cn('text-[11px] uppercase tracking-wider font-medium', config.textClass)}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Route name */}
          <h3 className="font-display text-slate-200 text-lg mb-2 leading-tight group-hover:text-white transition-colors">
            {day.from_location}
            <span className="text-slate-600 mx-1.5 font-body text-sm">to</span>
            {day.to_location}
          </h3>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-slate-500 pb-3 mb-3 border-b border-slate-800/60">
            <span><DistanceValue km={day.distance_km} /></span>
            <span aria-hidden="true">·</span>
            <span><ElevationValue m={day.elevation_m} /> gain</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{day.accommodation_name}</span>
            <span className="flex items-center gap-1 font-medium text-highland-rust group-hover:text-orange-300 transition-colors">
              Diary &amp; photos
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-all" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
