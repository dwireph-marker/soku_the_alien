import { useState, useEffect } from 'react';
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase/client';
import { logoutAdmin } from '../../lib/firebase';
import { Memory, LoveReason, Voucher, MusicTrack, Wish, AuditLog } from '../../types';

import { subscribeSiteSettings, updateSiteSettings } from '../../services/firestore/siteSettings.service';
import { subscribeCelebrationSettings, updateCelebrationSettings } from '../../services/firestore/celebration.service';
import { subscribeMusicConfig, updateMusicConfig } from '../../services/firestore/music.service';
import { subscribeMemories, saveMemory as firestoreSaveMemory, deleteMemory as firestoreDeleteMemory } from '../../services/firestore/memories.service';
import { subscribeLoveReasons, saveLoveReason as firestoreSaveReason, deleteLoveReason as firestoreDeleteReason } from '../../services/firestore/loveReasons.service';
import { subscribeVouchers, saveVoucher as firestoreSaveVoucher, deleteVoucher as firestoreDeleteVoucher } from '../../services/firestore/vouchers.service';
import { subscribeWishes, deleteWish as firestoreDeleteWish } from '../../services/firestore/wishes.service';
import { subscribeAuditLogs, addAuditLog } from '../../services/firestore/auditLogs.service';

export function useAdminState() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [authInitializing, setAuthInitializing] = useState(true);
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState<any>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reasons, setReasons] = useState<LoveReason[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!auth) {
      setAuthInitializing(false);
      return;
    }
    // Listen to token changes and automatic background refreshing
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          setUserEmail(user.email || 'admin@birthday.site');
        } catch {
          setToken(null);
        }
      } else {
        setToken(null);
        setUserEmail('');
      }
      setAuthInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubSettings = subscribeSiteSettings((data) => {
      setConfig((prev: any) => ({ ...prev, ...data }));
    });
    const unsubCeleb = subscribeCelebrationSettings((data) => {
      setConfig((prev: any) => ({ ...prev, celebration: data }));
    });
    const unsubMusic = subscribeMusicConfig((data) => {
      setConfig((prev: any) => ({ ...prev, ...data }));
    });
    const unsubMem = subscribeMemories((items) => {
      setMemories(items as any);
    });
    const unsubReas = subscribeLoveReasons((items) => {
      setReasons(items as any);
    });
    const unsubVouch = subscribeVouchers((items) => {
      setVouchers(items as any);
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubCeleb();
      unsubMusic();
      unsubMem();
      unsubReas();
      unsubVouch();
    };
  }, []);

  // Only subscribe to protected collections (wishes, audit logs) when an admin user is authenticated
  useEffect(() => {
    if (!token && !auth?.currentUser) {
      setWishes([]);
      setAuditLogs([]);
      return;
    }

    const unsubWish = subscribeWishes((items) => {
      setWishes(items as any);
    });
    const unsubLogs = subscribeAuditLogs((items) => {
      setAuditLogs(items as any);
    });

    return () => {
      unsubWish();
      unsubLogs();
    };
  }, [token]);

  const handleLoginSuccess = (user: { email: string; token?: string }) => {
    setToken(user.token || 'authenticated');
    setUserEmail(user.email);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setToken(null);
  };

  const fetchAllData = async () => {
    // Data is synced in real-time via Firestore subscriptions
    setLoading(false);
  };

  const handleSaveSettings = async (settingsData: any) => {
    await updateSiteSettings(settingsData);
    await addAuditLog('UPDATE', 'SiteSettings', 'Updated site settings configuration');
  };

  const handleSaveNames = async (namesData: {
    herName: string;
    hisName: string;
    navbarName?: string;
    introName?: string;
    heroName?: string;
    cakeName?: string;
    letterSalutationName?: string;
    letterSignOffName?: string;
    footerRecipientName?: string;
    footerSenderName?: string;
  }) => {
    await updateSiteSettings(namesData);
    await addAuditLog(
      'UPDATE',
      'Names',
      `Updated website names (Recipient: "${namesData.herName}", Sender: "${namesData.hisName}")`
    );
  };

  const handleSaveBirthday = async (birthdayData: any) => {
    await updateSiteSettings(birthdayData);
    await addAuditLog(
      'UPDATE',
      'Birthday',
      `Updated birthday settings: ${birthdayData.birthdayDate} at ${birthdayData.birthdayTime} (${birthdayData.timezone})`
    );
  };

  const handleSaveMusic = async (musicData: any) => {
    await updateMusicConfig(musicData);
    await updateSiteSettings(musicData);
    await addAuditLog(
      'UPDATE',
      'Music',
      `Updated music settings: ${musicData.bgMusicCustomName || musicData.bgMusicType || 'Soundtrack'}`
    );
  };

  const handleSaveCelebration = async (celebrationData: any) => {
    await updateCelebrationSettings(celebrationData);
    await addAuditLog('UPDATE', 'Celebration', 'Updated celebration cake settings');
  };

  const handleAddMemory = async (memory: Partial<Memory>) => {
    const id = memory.id || `mem_${Date.now()}`;
    const imgUrl = (memory as any).imageUrl || memory.url || '';
    const payload: any = {
      ...memory,
      id,
      imageUrl: imgUrl,
      url: imgUrl,
      mediaType: memory.mediaType || 'image',
      likes: memory.likes || 0,
      isActive: true,
      order: memories.length + 1,
      createdAt: new Date().toISOString(),
    };
    await firestoreSaveMemory(payload);
    await addAuditLog('CREATE', 'Memories', `Added new memory: "${memory.title || id}"`, id);
  };

  const handleUpdateMemory = async (id: string, memory: Partial<Memory>) => {
    const existing = memories.find((m) => m.id === id) || {};
    const imgUrl = (memory as any).imageUrl || memory.url || (existing as any).imageUrl || (existing as any).url || '';
    const payload: any = {
      ...existing,
      ...memory,
      id,
      imageUrl: imgUrl,
      url: imgUrl,
    };
    await firestoreSaveMemory(payload);
    await addAuditLog('UPDATE', 'Memories', `Updated memory: "${memory.title || id}"`, id);
  };

  const handleDeleteMemory = async (id: string) => {
    await firestoreDeleteMemory(id);
    await addAuditLog('DELETE', 'Memories', `Deleted memory ID: ${id}`, id);
  };

  const handleAddReason = async (reason: Partial<LoveReason>) => {
    const id = reason.id || `reason_${Date.now()}`;
    const payload: any = {
      ...reason,
      id,
      number: reason.number || reasons.length + 1,
      text: reason.text || '',
      icon: reason.icon || 'Sparkles',
      isActive: true,
      order: reasons.length + 1,
      createdAt: new Date().toISOString(),
    };
    await firestoreSaveReason(payload);
    await addAuditLog('CREATE', 'LoveReasons', `Added reason #${payload.number}`, id);
  };

  const handleUpdateReason = async (id: string, reason: Partial<LoveReason>) => {
    const existing = reasons.find((r) => r.id === id) || {};
    const payload: any = {
      ...existing,
      ...reason,
      id,
    };
    await firestoreSaveReason(payload);
    await addAuditLog('UPDATE', 'LoveReasons', `Updated reason ID: ${id}`, id);
  };

  const handleDeleteReason = async (id: string) => {
    await firestoreDeleteReason(id);
    await addAuditLog('DELETE', 'LoveReasons', `Deleted reason ID: ${id}`, id);
  };

  const handleAddVoucher = async (voucher: Partial<Voucher>) => {
    const id = voucher.id || `voucher_${Date.now()}`;
    const payload: any = {
      ...voucher,
      id,
      title: voucher.title || 'Love Voucher',
      code: voucher.code || `LOVE-${Date.now()}`,
      description: voucher.description || '',
      icon: voucher.icon || 'Sparkles',
      category: voucher.category || 'Romantic',
      isRedeemed: false,
      isActive: true,
      order: vouchers.length + 1,
      createdAt: new Date().toISOString(),
    };
    await firestoreSaveVoucher(payload);
    await addAuditLog('CREATE', 'Vouchers', `Added voucher: "${payload.title}"`, id);
  };

  const handleUpdateVoucher = async (id: string, voucher: Partial<Voucher>) => {
    const existing = vouchers.find((v) => v.id === id) || {};
    const payload: any = {
      ...existing,
      ...voucher,
      id,
    };
    await firestoreSaveVoucher(payload);
    await addAuditLog('UPDATE', 'Vouchers', `Updated voucher ID: ${id}`, id);
  };

  const handleDeleteVoucher = async (id: string) => {
    await firestoreDeleteVoucher(id);
    await addAuditLog('DELETE', 'Vouchers', `Deleted voucher ID: ${id}`, id);
  };

  const handleDeleteWish = async (id: string) => {
    await firestoreDeleteWish(id);
    await addAuditLog('DELETE', 'Wishes', `Deleted wish ID: ${id}`, id);
  };

  return {
    token,
    userEmail,
    authInitializing,
    loading,
    config,
    memories,
    reasons,
    vouchers,
    tracks,
    wishes,
    auditLogs,
    handleLoginSuccess,
    handleLogout,
    fetchAllData,
    handleSaveSettings,
    handleSaveNames,
    handleSaveBirthday,
    handleSaveMusic,
    handleSaveCelebration,
    handleAddMemory,
    handleUpdateMemory,
    handleDeleteMemory,
    handleAddReason,
    handleUpdateReason,
    handleDeleteReason,
    handleAddVoucher,
    handleUpdateVoucher,
    handleDeleteVoucher,
    handleDeleteWish,
  };
}
