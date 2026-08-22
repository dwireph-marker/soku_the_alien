import { useState, useEffect } from 'react';
import { SiteSettingsData } from '../../types/firestore';
import {
  defaultSiteSettings,
  subscribeSiteSettings,
  updateSiteSettings,
} from '../../services/firestore/siteSettings.service';

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettingsData>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeSiteSettings((data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveSettings = async (updated: Partial<SiteSettingsData>) => {
    await updateSiteSettings(updated);
  };

  return { settings, loading, saveSettings };
}
