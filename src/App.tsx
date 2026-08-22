import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { FloatingHearts } from './components/FloatingHearts';
import { HeroCountdown } from './components/HeroCountdown';
import { ContinuousPhotoMarquee } from './components/ContinuousPhotoMarquee';
import { InteractiveCake } from './components/InteractiveCake';
import { LoveLetterSection } from './components/LoveLetterSection';
import { ReasonsDeck } from './components/ReasonsDeck';
import { InteractiveGamesSection } from './components/games/InteractiveGamesSection';
import { RomanticLoadingIntro } from './components/RomanticLoadingIntro';

const AdminApp = lazy(() => import('./admin/AdminApp').then(m => ({ default: m.AdminApp })));

import { useSiteSettings } from './hooks/firestore/useSiteSettings';
import { useMemories } from './hooks/firestore/useMemories';
import { useLoveReasons } from './hooks/firestore/useLoveReasons';
import { useMusic } from './hooks/firestore/useMusic';
import { MemoryPhoto } from './types';
import { MemoryItem } from './types/firestore';
import { romanticAudio } from './utils/audio';
import { Heart } from 'lucide-react';

export default function App() {
  const [isAdminView, setIsAdminView] = useState(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setIsAdminView(hash === '#admin' || window.location.pathname === '/admin');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const { settings, loading: settingsLoading } = useSiteSettings();
  const { memories, saveMemory, saveMemoriesBatch, deleteMemory } = useMemories();
  const { reasons } = useLoveReasons();
  const { music } = useMusic();

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMidnightTheme, setIsMidnightTheme] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  // Synchronize music playing state with audio engine
  useEffect(() => {
    const unsubscribe = romanticAudio.subscribe((playing) => {
      setIsMusicPlaying(playing);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleMidnightTheme = () => {
    setIsMidnightTheme((prev) => !prev);
  };

  const handleReplayIntro = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowIntro(true);
  };

  const resolveActiveTrack = () => {
    // 1. Check if activeTrackId matches a saved custom uploaded track
    if (music.activeTrackId && Array.isArray(music.customAudioTracks) && music.customAudioTracks.length > 0) {
      const found = music.customAudioTracks.find((t) => t.id === music.activeTrackId);
      if (found && found.url) {
        return {
          type: 'custom',
          url: found.url,
          name: found.name || music.bgMusicCustomName || 'Celebration Music',
        };
      }
    }

    const trackType = music.bgMusicType || 'birthday';

    // 2. Check if type is custom/file/uploaded and has customUrl
    if (trackType === 'custom' || trackType === 'file' || trackType === 'uploaded') {
      const customUrl = music.bgMusicCustomUrl || music.bgMusicPresetUrl || '';
      return {
        type: 'custom',
        url: customUrl,
        name: music.bgMusicCustomName || 'Custom Soundtrack',
      };
    }

    // 3. Preset Builtins
    if (trackType === 'birthday') {
      return {
        type: 'birthday',
        url: '',
        name: '🎂 Romantic Piano Birthday',
      };
    } else if (trackType === 'piano' || trackType === 'acoustic') {
      return {
        type: 'piano',
        url: '',
        name: '🎹 Soft Acoustic Love Song',
      };
    } else if (trackType === 'elise') {
      return {
        type: 'elise',
        url: '',
        name: '🎼 Classical Piano - Für Elise',
      };
    } else if (trackType === 'lofi' || trackType === 'synth') {
      return {
        type: 'lofi',
        url: '',
        name: '✨ Built-in Web Audio Synthesizer',
      };
    }

    return {
      type: trackType,
      url: music.bgMusicPresetUrl || music.bgMusicCustomUrl || '',
      name: music.bgMusicCustomName || 'Celebration Music',
    };
  };

  const handleStartMusic = () => {
    const track = resolveActiveTrack();
    romanticAudio.startMusic({
      type: track.type as any,
      url: track.url,
      name: track.name,
    });
    setIsMusicPlaying(true);
  };

  const handleStopMusic = () => {
    romanticAudio.stopMusic();
    setIsMusicPlaying(false);
  };

  const handleAddPhoto = async (newPhoto: MemoryPhoto) => {
    const memoryItem: MemoryItem = {
      id: newPhoto.id || `mem_${Date.now()}`,
      title: newPhoto.title || 'Romantic Memory',
      date: newPhoto.date || new Date().toISOString().split('T')[0],
      location: newPhoto.location || 'Memory Lane',
      caption: newPhoto.caption || '',
      imageUrl: newPhoto.url,
      mediaType: 'image',
      likes: newPhoto.likes || 0,
      isActive: true,
      order: memories.length + 1,
      createdAt: new Date().toISOString(),
    };
    await saveMemory(memoryItem);
  };

  const handleAddPhotosBatch = async (newPhotos: MemoryPhoto[]) => {
    const memoryItems: MemoryItem[] = newPhotos.map((photo, index) => ({
      id: photo.id || `mem_${Date.now()}_${index}`,
      title: photo.title || 'Romantic Memory',
      date: photo.date || new Date().toISOString().split('T')[0],
      location: photo.location || 'Memory Lane',
      caption: photo.caption || '',
      imageUrl: photo.url,
      mediaType: 'image',
      likes: photo.likes || 0,
      isActive: true,
      order: memories.length + index + 1,
      createdAt: new Date().toISOString(),
    }));
    await saveMemoriesBatch(memoryItems);
  };

  const handleDeletePhoto = async (photoId: string) => {
    await deleteMemory(photoId);
  };

  const handleEditPhoto = async (updatedPhoto: MemoryPhoto) => {
    const memoryItem: MemoryItem = {
      id: updatedPhoto.id,
      title: updatedPhoto.title || 'Romantic Memory',
      date: updatedPhoto.date || new Date().toISOString().split('T')[0],
      location: updatedPhoto.location || 'Memory Lane',
      caption: updatedPhoto.caption || '',
      imageUrl: updatedPhoto.url,
      mediaType: 'image',
      likes: updatedPhoto.likes || 0,
      isActive: true,
      order: 1,
      createdAt: new Date().toISOString(),
    };
    await saveMemory(memoryItem);
  };

  const photosList: MemoryPhoto[] = memories.map((m: any) => ({
    id: m.id,
    url: m.imageUrl || m.url || '',
    title: m.title || 'Romantic Memory',
    date: m.date || 'Special Day',
    location: m.location || 'Together',
    caption: m.caption || '',
    likes: m.likes || 0,
    mediaType: m.mediaType || 'image',
  }));

  if (isAdminView) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#07060f] flex flex-col items-center justify-center text-rose-300 font-mono text-sm gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            <span>Loading Admin Management Dashboard...</span>
          </div>
        }
      >
        <AdminApp
          onNavigateHome={() => {
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
            } else {
              window.location.hash = '';
            }
            setIsAdminView(false);
          }}
        />
      </Suspense>
    );
  }

  if (settingsLoading && !showIntro) {
    return (
      <div className="min-h-screen bg-[#03020c] flex items-center justify-center text-amber-200 font-serif italic text-lg">
        Loading Romantic Birthday Experience... ❤️
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <RomanticLoadingIntro
            onComplete={() => setShowIntro(false)}
            herName={settings.herName}
            introName={settings.introName}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: showIntro ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`min-h-screen font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden transition-colors duration-700 ${
          isMidnightTheme ? 'bg-[#03020c] text-indigo-50' : 'bg-[#0a0502] text-amber-50'
        }`}
      >
        <FloatingHearts />

        <Navbar
          herName={settings.herName}
          navbarName={settings.navbarName}
          isMusicPlaying={isMusicPlaying}
          onStartMusic={handleStartMusic}
          onStopMusic={handleStopMusic}
          onOpenAdmin={() => {
            window.location.hash = 'admin';
            setIsAdminView(true);
          }}
          musicTrackName={music.bgMusicCustomName || music.bgMusicType}
          isMidnightTheme={isMidnightTheme}
          onToggleMidnightTheme={handleToggleMidnightTheme}
        />

        <HeroCountdown
          herName={settings.herName}
          heroName={settings.heroName}
          targetDateIso={settings.targetDate}
          birthdayDate={settings.birthdayDate}
          birthdayTime={settings.birthdayTime}
          timezone={settings.timezone}
          countdownEnabled={settings.countdownEnabled}
          birthdayMonth={settings.birthdayMonth}
          birthdayDay={settings.birthdayDay}
          birthdayYear={settings.birthdayYear}
          soundFxEnabled={music.soundFxEnabled}
          isMidnightTheme={isMidnightTheme}
        />

        <ContinuousPhotoMarquee
          photos={photosList}
          onAddPhoto={handleAddPhoto}
          onAddPhotosBatch={handleAddPhotosBatch}
          onDeletePhoto={handleDeletePhoto}
          onEditPhoto={handleEditPhoto}
          soundFxEnabled={music.soundFxEnabled}
          isMidnightTheme={isMidnightTheme}
        />

        <InteractiveCake
          herName={settings.herName}
          cakeName={settings.cakeName}
          soundFxEnabled={music.soundFxEnabled}
          onStartMusic={handleStartMusic}
          isMidnightTheme={isMidnightTheme}
        />

        <LoveLetterSection
          herName={settings.herName}
          hisName={settings.hisName}
          letterSalutationName={settings.letterSalutationName}
          letterSignOffName={settings.letterSignOffName}
          title={settings.loveLetterTitle}
          body={settings.loveLetterBody}
          soundFxEnabled={music.soundFxEnabled}
          isMidnightTheme={isMidnightTheme}
        />

        <ReasonsDeck
          reasons={reasons as any}
          soundFxEnabled={music.soundFxEnabled}
          isMidnightTheme={isMidnightTheme}
        />

        <InteractiveGamesSection
          herName={settings.herName}
          soundFxEnabled={music.soundFxEnabled}
          isMidnightTheme={isMidnightTheme}
        />

        <footer className="py-8 sm:py-10 px-4 border-t border-rose-900/30 bg-[#05020a] text-center relative z-0 mt-8 sm:mt-12">
          <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 mb-0.5">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
            </div>
            <p className="font-serif text-sm sm:text-base text-pink-200">
              Crafted with endless love for {settings.footerRecipientName || settings.herName} ❤️
            </p>
            <p className="text-xs text-rose-300/70 font-mono">
              Happy Birthday • Forever & Always • {settings.footerSenderName || settings.hisName}
            </p>

            <button
              onClick={handleReplayIntro}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/40 hover:border-rose-400 text-xs font-mono text-rose-200 hover:text-white transition-all cursor-pointer shadow-md active:scale-95"
            >
              <span>✨ Replay Heart Intro</span>
            </button>
          </div>
        </footer>
      </motion.div>
    </>
  );
}
