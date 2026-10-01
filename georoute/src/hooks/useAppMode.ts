import { useState } from 'react';

export type AppMode = 'general' | 'delivery' | 'evTrip' | 'planner';

const STORAGE_KEY = 'georoute_app_mode';

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as AppMode | null;
      if (saved && ['general', 'delivery', 'evTrip', 'planner'].includes(saved)) {
        return saved;
      }
    }
    return 'general';
  });

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  };

  return {
    mode,
    setMode,
    isGeneral: mode === 'general',
    isDelivery: mode === 'delivery',
    isEvTrip: mode === 'evTrip',
    isPlanner: mode === 'planner',
  };
}
