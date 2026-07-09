'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, ArrowRight, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { DayData, DayStatus } from '@/types';
import { formatShortDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DayCardProps {
  day: DayData;
  status: DayStatus;
  index: number;
}

const STATUS_CONFIG = {
  completed: {
    badge: 'Completed',
    badgeClass: 'badge-completed',
    borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
  active: {
    badge: 'Today',
    badgeClass: 'badge-active',
    borderClass: 'border-amber-500/50 hover:border-amber-500/80',
    icon: Clock,
    iconColor: 'text-amber-500',
  },
  upcoming: {
    badge: 'Upcoming',
    badgeClass: 'badge-upcoming',
    borderClass: 'border-slate-700/50 hover:border-slate-600/80',
    icon: Calendar,
    iconColor: 'text-slate-500',
  },
};

export default function DayCard({ day, status, index }: DayCardProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const progressPercent = ((day.id - 1) / 7) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link href={`/day/${day.id}`}>
        <div
          className={cn(
            'glass-card rounded-xl p-5 border transition-all duration-300 group cursor-pointer',
            config.borderClass,
            status === 'active' && 'shadow-lg shadow-amber-500/10'
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-display',
                  status === 'completed' && 'bg-emerald-500/20 text-emerald-400',
                  status === 'active' && 'bg-amber-500/20 text-amber-400',
                  status === 'upcoming' && 'bg-slate-700/50 text-slate-400'
                )}
              >
                {day.id}
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  {formatShortDate(day.date)}
                </div>
              </div>
            </div>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', config.badgeClass)}>
              {config.badge}
            </span>
          </div>

          {/* Route name */}
          <h3 className="font-display font-semibold text-slate-200 text-base mb-1 leading-tight group-hover:text-white transition-colors">
            {day.from_location}
            <span className="text-slate-500 mx-1.5 font-normal font-body">→</span>
            {day.to_location}
          </h3>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 mb-3">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="w-3 h-3" />
              <span>{day.distance_km} km</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <TrendingUp className="w-3 h-3" />
              <span>{day.elevation_m}m</span>
            </div>
            {day.id === 6 && (
              <span className="text-xs text-red-400 font-medium">Longest day</span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: status === 'completed' ? '100%' : status === 'active' ? '50%' : '0%' }}
              transition={{ duration: 1, delay: index * 0.08 + 0.3 }}
              className={cn(
                'h-full rounded-full',
                status === 'completed' ? 'bg-emerald-500' :
                status === 'active' ? 'bg-amber-500' : 'bg-slate-700'
              )}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon className={cn('w-3.5 h-3.5', config.iconColor)} />
              <span>{day.accommodation_name}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
