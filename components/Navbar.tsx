'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Bike, Menu, X, ChevronDown } from 'lucide-react';
import TimezoneDisplay from './TimezoneDisplay';
import { cn } from '@/lib/utils';

const DAYS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [daysOpen, setDaysOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const isAnyDay = DAYS.some((d) => isActive(`/day/${d}`)) || isActive('/post-ride');

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-slate-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-highland-purple/20 border border-highland-purple/30 flex items-center justify-center group-hover:bg-highland-purple/30 transition-colors">
              <Bike className="w-5 h-5 text-highland-purple" />
            </div>
            <div>
              <span className="font-display font-semibold text-slate-200 text-sm leading-tight block">Empire State Trail</span>
              <span className="text-slate-500 text-xs leading-tight block">Sep 4–11, 2026</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/"
              className={cn(
                'text-sm transition-colors',
                pathname === '/' ? 'text-slate-200 font-medium' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Overview
            </Link>

            {/* Days dropdown */}
            <div className="relative" onMouseEnter={() => setDaysOpen(true)} onMouseLeave={() => setDaysOpen(false)}>
              <button
                className={cn(
                  'flex items-center gap-1 text-sm transition-colors',
                  isAnyDay ? 'text-highland-purple font-medium' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Days
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', daysOpen && 'rotate-180')} />
              </button>

              {daysOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                  <div className="bg-slate-900 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                    {DAYS.map((d) => (
                      <Link
                        key={d}
                        href={`/day/${d}`}
                        className={cn(
                          'block px-4 py-2 text-sm transition-colors',
                          isActive(`/day/${d}`)
                            ? 'bg-highland-purple/20 text-highland-purple font-medium'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        Day {d}
                      </Link>
                    ))}
                    <div className="border-t border-slate-800">
                      <Link
                        href="/post-ride"
                        className={cn(
                          'block px-4 py-2 text-sm transition-colors',
                          isActive('/post-ride')
                            ? 'bg-highland-purple/20 text-highland-purple font-medium'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        Post-ride
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <TimezoneDisplay />
            </div>
            {/* Mobile menu button */}
            <button
              className="md:hidden text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'block py-2 text-sm',
                pathname === '/' ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Overview
            </Link>

            {/* Days group */}
            <div className="pt-1">
              <div className="text-xs text-slate-600 font-medium uppercase tracking-wider px-0 pb-1">
                Days
              </div>
              <div className="grid grid-cols-4 gap-1">
                {DAYS.map((d) => (
                  <Link
                    key={d}
                    href={`/day/${d}`}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(`/day/${d}`)
                        ? 'bg-highland-purple/20 text-highland-purple'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    )}
                  >
                    {d}
                  </Link>
                ))}
                <Link
                  href="/post-ride"
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'col-span-4 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-colors mt-1',
                    isActive('/post-ride')
                      ? 'bg-highland-purple/20 text-highland-purple'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  Post-ride
                </Link>
              </div>
            </div>

            <div className="pt-2 pb-1 border-t border-slate-800">
              <TimezoneDisplay />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
