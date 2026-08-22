import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RefreshCw, Heart, Wind, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../utils/audio';
import { SiteConfig } from '../types';
import { PartyPoppersOverlay } from './cake/PartyPoppersOverlay';
import { WishModal } from './cake/WishModal';
import { CakeTiersModel } from './cake/CakeTiersModel';
import { useBlowDetection } from './birthday/cake/microphone/useBlowDetection';
import { MicrophoneButton } from './birthday/cake/microphone/MicrophoneButton';
import { RevealSection } from './common/RevealSection';

import { addWish } from '../services/firestore/wishes.service';

interface InteractiveCakeProps {
  herName: string;
  cakeName?: string;
  soundFxEnabled?: boolean;
  config?: SiteConfig;
  onStartMusic?: () => void;
  isMidnightTheme?: boolean;
}

export const InteractiveCake: React.FC<InteractiveCakeProps> = ({
  herName,
  cakeName,
  soundFxEnabled = true,
  config,
  onStartMusic,
  isMidnightTheme = false,
}) => {
  const displayCakeName = (cakeName || '').trim() || (herName || 'My Love');
  // 6 Candles matching the uploaded birthday cake design
  const [candlesLit, setCandlesLit] = useState<boolean[]>([true, true, true, true, true, true]);
  const [wishText, setWishText] = useState<string>('');
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [showPartyPoppers, setShowPartyPoppers] = useState(false);
  const cannonIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const poppersTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearCelebrationTimers = useCallback(() => {
    if (cannonIntervalRef.current) {
      clearInterval(cannonIntervalRef.current);
      cannonIntervalRef.current = null;
    }
    if (poppersTimeoutRef.current) {
      clearTimeout(poppersTimeoutRef.current);
      poppersTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCelebrationTimers();
    };
  }, [clearCelebrationTimers]);

  const litCount = candlesLit.filter(Boolean).length;
  const allCandlesBlown = candlesLit.every((lit) => !lit);

  // Multi-burst celebration confetti
  const triggerPartyCelebration = useCallback(() => {
    clearCelebrationTimers();
    setShowPartyPoppers(true);
    if (soundFxEnabled) romanticAudio.playFanfare();

    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#f43f5e', '#ec4899', '#fbbf24', '#a855f7', '#38bdf8', '#34d399', '#ffffff'],
      startVelocity: 45,
      gravity: 0.8,
      scalar: 1.2,
    });

    const duration = 3800;
    const end = Date.now() + duration;

    cannonIntervalRef.current = setInterval(() => {
      if (Date.now() > end) {
        if (cannonIntervalRef.current) {
          clearInterval(cannonIntervalRef.current);
          cannonIntervalRef.current = null;
        }
        return;
      }

      confetti({
        particleCount: 40,
        angle: 60,
        spread: 65,
        origin: { x: 0.05, y: 0.75 },
        colors: ['#f43f5e', '#fbbf24', '#e879f9', '#38bdf8', '#ffffff'],
        scalar: 1.1,
      });

      confetti({
        particleCount: 40,
        angle: 120,
        spread: 65,
        origin: { x: 0.95, y: 0.75 },
        colors: ['#f43f5e', '#fbbf24', '#e879f9', '#38bdf8', '#ffffff'],
        scalar: 1.1,
      });

      confetti({
        particleCount: 25,
        spread: 120,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#ffffff', '#fbbf24', '#f43f5e', '#a855f7'],
        scalar: 0.9,
      });
    }, 280);

    poppersTimeoutRef.current = setTimeout(() => {
      setShowPartyPoppers(false);
      poppersTimeoutRef.current = null;
    }, 5200);
  }, [soundFxEnabled, clearCelebrationTimers]);

  const triggerMusicOnBlow = useCallback(() => {
    if (onStartMusic) {
      onStartMusic();
    } else if (config) {
      const activeUrl = config.bgMusicCustomUrl || config.bgMusicPresetUrl || '';
      romanticAudio.startMusic({
        type: config.bgMusicType || 'birthday',
        url: activeUrl,
        name: config.bgMusicCustomName,
      });
    } else {
      romanticAudio.startMusic();
    }
  }, [onStartMusic, config]);

  const candlesLitRef = useRef(candlesLit);
  useEffect(() => {
    candlesLitRef.current = candlesLit;
  }, [candlesLit]);

  const blowOutAllCandles = useCallback(() => {
    if (!candlesLitRef.current.some((lit) => lit)) return;

    setCandlesLit([false, false, false, false, false, false]);
    if (soundFxEnabled) romanticAudio.playBlowCandleSound();
    triggerMusicOnBlow();
    triggerPartyCelebration();

    if (micDetectionRef.current) {
      micDetectionRef.current();
    }

    setTimeout(() => setIsWishModalOpen(true), 1200);
  }, [soundFxEnabled, triggerMusicOnBlow, triggerPartyCelebration]);

  const handleMicBlow = useCallback(() => {
    blowOutAllCandles();
  }, [blowOutAllCandles]);

  const micDetection = useBlowDetection({
    onBlowDetected: handleMicBlow,
  });

  const micDetectionRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    micDetectionRef.current = () => {
      if (micDetection.isListening) {
        micDetection.stopListening();
      }
    };
  }, [micDetection.isListening, micDetection.stopListening]);

  const relightCandles = () => {
    setCandlesLit([true, true, true, true, true, true]);
    setShowPartyPoppers(false);
    if (soundFxEnabled) romanticAudio.playPopSound();
  };

  const toggleCandle = (index: number) => {
    const currentState = candlesLit[index];
    const next = [...candlesLit];

    if (currentState) {
      next[index] = false;
      setCandlesLit(next);
      if (soundFxEnabled) romanticAudio.playBlowCandleSound();
      triggerMusicOnBlow();
      if (next.every((l) => !l)) {
        triggerPartyCelebration();
        if (micDetectionRef.current) {
          micDetectionRef.current();
        }
        setTimeout(() => setIsWishModalOpen(true), 1200);
      }
    } else {
      next[index] = true;
      setCandlesLit(next);
      setShowPartyPoppers(false);
      if (soundFxEnabled) romanticAudio.playPopSound();
    }
  };

  const handleSaveWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim()) return;

    const submittedWish = wishText.trim();
    setWishText('');
    setIsWishModalOpen(false);

    try {
      await addWish(submittedWish, herName || 'Sonali');
    } catch (err) {
      console.error('Failed to save wish to Firestore:', err);
    }

    if (soundFxEnabled) romanticAudio.playFanfare();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
  };

  return (
    <RevealSection id="cake-section">
      <section
        className={`py-16 sm:py-24 relative overflow-hidden transition-colors duration-700 ${
          isMidnightTheme ? 'bg-[#030213] text-indigo-50' : 'bg-[#0e0709] text-rose-50'
        }`}
      >
        {/* Background Radial Glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] pointer-events-none ${
            isMidnightTheme
              ? 'bg-gradient-to-tr from-indigo-900/30 via-purple-600/20 to-pink-500/20'
              : 'bg-gradient-to-tr from-rose-900/40 via-pink-600/25 to-amber-500/20'
          }`}
        />

        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
          {/* HEADER TOP BAR */}
          <div className="reveal-stagger-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold uppercase tracking-[0.3em] mb-3">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
            <span>Happy Birthday, {displayCakeName}</span>
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
          </div>

          <h2 className="reveal-stagger-2 text-4xl sm:text-6xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-100 to-rose-200 tracking-tight">
            Make a Wish
          </h2>

          <p className="reveal-stagger-3 text-stone-300/80 text-xs sm:text-sm max-w-lg mx-auto mt-2 mb-2 font-serif italic leading-relaxed">
            Blow into your microphone or tap the button to blow out the candles and make your wish come true!
          </p>

          <div className="reveal-stagger-3 flex items-center justify-center gap-2 mb-8 text-pink-400">
            <Heart className="w-4 h-4 fill-pink-500/80 text-pink-400 animate-pulse" />
          </div>

          {/* CENTER REDESIGNED CAKE MODEL */}
          <div className="reveal-stagger-4 flex justify-center my-4">
            <CakeTiersModel
              candlesLit={candlesLit}
              toggleCandle={toggleCandle}
              herName={displayCakeName}
              blowIntensity={micDetection.intensity}
              isMidnightTheme={isMidnightTheme}
            />
          </div>

          {/* BOTTOM ACTION BUTTONS */}
          <div className="reveal-stagger-4 flex flex-wrap items-center justify-center gap-4 mt-6 mb-2 max-w-xl mx-auto">
            {!allCandlesBlown && (
              <button
                onClick={blowOutAllCandles}
                id="btn-blow-candles"
                className="bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-7 py-3 rounded-full font-semibold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/60 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border border-pink-400/40 min-w-[200px]"
              >
                <Wind className="w-4 h-4 text-pink-200" />
                <span>Blow Out Candles</span>
              </button>
            )}

            <button
              onClick={() => setIsWishModalOpen(true)}
              id="btn-make-wish"
              className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white px-7 py-3 rounded-full font-semibold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/60 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border border-amber-400/40 min-w-[200px]"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Make a Wish</span>
            </button>

            <MicrophoneButton
              isListening={micDetection.isListening}
              isCalibrating={micDetection.isCalibrating}
              isRequestingPermission={micDetection.isRequestingPermission}
              permissionState={micDetection.permissionState}
              isSupported={micDetection.isSupported}
              intensity={micDetection.intensity}
              sensitivity={micDetection.sensitivity}
              onToggle={micDetection.toggleListening}
              onSetSensitivity={micDetection.setSensitivity}
              disabled={allCandlesBlown}
              className="w-auto min-w-[200px]"
            />

            {candlesLit.some((l) => !l) && (
              <button
                onClick={relightCandles}
                id="btn-relight-candles"
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold px-6 py-3 rounded-full text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border border-pink-300/50 min-w-[200px]"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Relight Candles 🕯️</span>
              </button>
            )}
          </div>

          {/* BOTTOM TIP CAPTION */}
          <p className="reveal-stagger-4 text-[11px] text-pink-300/70 font-serif italic mt-3">
            ❤ Tip: You can also click the button or tap individual candles to blow out the candles!
          </p>
        </div>

        <WishModal
          isOpen={isWishModalOpen}
          onClose={() => setIsWishModalOpen(false)}
          wishText={wishText}
          setWishText={setWishText}
          onSaveWish={handleSaveWish}
        />

        <PartyPoppersOverlay show={showPartyPoppers} herName={displayCakeName} />
      </section>
    </RevealSection>
  );
};
