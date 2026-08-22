import { useState, useEffect } from 'react';
import { MusicConfigData } from '../../types/firestore';
import {
  defaultMusicConfig,
  subscribeMusicConfig,
  updateMusicConfig,
} from '../../services/firestore/music.service';

export function useMusic() {
  const [music, setMusic] = useState<MusicConfigData>(defaultMusicConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeMusicConfig((data) => {
      setMusic(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveMusic = async (updated: Partial<MusicConfigData>) => {
    await updateMusicConfig(updated);
  };

  return { music, loading, saveMusic };
}
