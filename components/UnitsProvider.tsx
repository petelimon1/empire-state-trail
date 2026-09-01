'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UnitSystem } from '@/lib/units';

interface UnitsContextValue {
  unit: UnitSystem;
  toggleUnit: () => void;
}

const UnitsContext = createContext<UnitsContextValue>({ unit: 'metric', toggleUnit: () => {} });

const STORAGE_KEY = 'est-units';

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<UnitSystem>('metric');

  // Read the saved preference after mount (not during SSR, so the server-
  // rendered HTML and first client render always agree — avoids a hydration
  // mismatch — then this immediately re-renders with the real saved value).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'imperial' || stored === 'metric') setUnit(stored);
    } catch {
      // localStorage unavailable (private browsing, etc.) — just stay on the default
    }
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit((prev) => {
      const next: UnitSystem = prev === 'metric' ? 'imperial' : 'metric';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore — preference just won't persist across reloads
      }
      return next;
    });
  }, []);

  return (
    <UnitsContext.Provider value={{ unit, toggleUnit }}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitsContext);
}
