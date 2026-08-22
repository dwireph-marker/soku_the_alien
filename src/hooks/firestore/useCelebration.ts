import { useState, useEffect } from 'react';
import { CelebrationSettingsData } from '../../types/firestore';
import {
  defaultCelebrationSettings,
  subscribeCelebrationSettings,
  updateCelebrationSettings,
} from '../../services/firestore/celebration.service';

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationSettingsData>(defaultCelebrationSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeCelebrationSettings((data) => {
      setCelebration(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveCelebration = async (updated: Partial<CelebrationSettingsData>) => {
    await updateCelebrationSettings(updated);
  };

  return { celebration, loading, saveCelebration };
}
