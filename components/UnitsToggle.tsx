'use client';

import { useUnits } from './UnitsProvider';
import { cn } from '@/lib/utils';

export default function UnitsToggle() {
  const { unit, toggleUnit } = useUnits();

  return (
    <button
      onClick={toggleUnit}
      title="Switch units"
      className="flex items-center rounded-full border border-slate-700/60 overflow-hidden text-xs font-medium flex-shrink-0"
    >
      <span className={cn('px-2 py-1 transition-colors', unit === 'metric' ? 'bg-highland-purple/25 text-highland-purple' : 'text-slate-500')}>
        km
      </span>
      <span className={cn('px-2 py-1 transition-colors', unit === 'imperial' ? 'bg-highland-purple/25 text-highland-purple' : 'text-slate-500')}>
        mi
      </span>
    </button>
  );
}
