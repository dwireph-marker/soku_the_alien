import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Play, Square, Sparkles, Image, Mail, Moon, Sun, Menu, X, Music, Volume2, Shield } from 'lucide-react';

interface NavbarProps {
  herName: string;
  navbarName?: string;
  isMusicPlaying: boolean;
  onToggleMusic?: () => void;
  onStartMusic?: () => void;
  onStopMusic?: () => void;
  soundFxEnabled?: boolean;
  onToggleSoundFx?: () => void;
  onOpenCustomize?: () => void;
  onOpenAdmin?: () => void;
  musicTrackName?: string;
  isMidnightTheme?: boolean;
  onToggleMidnightTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  herName,
  navbarName,
  isMusicPlaying,
  onStartMusic,
  onStopMusic,
  onOpenAdmin,
  musicTrackName,
  isMidnightTheme = true,
  onToggleMidnightTheme,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = (navbarName || '').trim() || (herName ? `For ${herName}` : 'For You');
  const brandTitle = displayName.startsWith('For ') || displayName.startsWith('for ') ? displayName : `For ${displayName}`;

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  const handlePlay = () => {
    if (onStartMusic) onStartMusic();
  };

  const handleStop = () => {
    if (onStopMusic) onStopMusic();
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const activeSongLabel = musicTrackName || 'Romantic Celebration Melodies';

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/75 backdrop-blur-lg border-b border-orange-500/20 px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0">
        {/* Brand Logo & Name */}
        <a
          href="#"
          onClick={handleNavClick}
          className="flex items-center gap-2 group min-w-0 flex-shrink"
          aria-label={`${brandTitle} Home`}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
            <Heart className="w-4 h-4 fill-white animate-pulse" />
          </div>
          <span className="font-serif italic font-bold text-sm xs:text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-amber-100 to-white truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[260px] md:max-w-none">
            {brandTitle}
          </span>
        </a>

        {/* Section Links (Desktop lg+) */}
        <nav className="hidden lg:flex items-center gap-5 text-xs uppercase tracking-[0.15em] text-stone-300 font-medium flex-shrink-0">
          <a href="#photos" className="hover:text-rose-400 transition-colors flex items-center gap-1.5 py-1">
            <Image className="w-3.5 h-3.5 text-rose-400" /> Memories
          </a>
          <a href="#cake-section" className="hover:text-rose-400 transition-colors flex items-center gap-1.5 py-1">
            <span>🎂</span> Cake
          </a>
          <a href="#letter" className="hover:text-rose-400 transition-colors flex items-center gap-1.5 py-1">
            <Mail className="w-3.5 h-3.5 text-rose-400" /> Letter
          </a>
          <a href="#reasons" className="hover:text-rose-400 transition-colors flex items-center gap-1.5 py-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" /> Reasons
          </a>
          <a href="#games" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 font-bold py-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Games
          </a>
        </nav>

        {/* Action Controls (Desktop lg+ & Tablet sm+) */}
        <div className="hidden sm:flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          {/* Theme Switcher Toggle (Midnight / Warm) */}
          {onToggleMidnightTheme && (
            <button
              onClick={onToggleMidnightTheme}
              id="btn-toggle-theme"
              className={`px-2.5 py-1.5 rounded-full border text-xs font-medium tracking-wide flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
                isMidnightTheme
                  ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200 shadow-md shadow-indigo-950/50 hover:bg-indigo-900'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-200 hover:bg-amber-900/60'
              }`}
              title={isMidnightTheme ? 'Switch to Warm mode' : 'Switch to Midnight Starry theme'}
              aria-label={isMidnightTheme ? 'Switch to Warm mode' : 'Switch to Midnight Starry theme'}
            >
              {isMidnightTheme ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-300 fill-indigo-300 flex-shrink-0" />
                  <span className="hidden md:inline">Midnight</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300 fill-amber-300 flex-shrink-0" />
                  <span className="hidden md:inline">Warm</span>
                </>
              )}
            </button>
          )}

          {/* Play Music Button */}
          <button
            onClick={handlePlay}
            id="btn-play-music"
            className={`px-2.5 py-1.5 rounded-full border text-xs font-medium tracking-wide flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
              isMusicPlaying
                ? 'bg-amber-500/25 border-amber-400/80 text-amber-200 shadow-sm'
                : 'bg-white/5 border-white/10 text-stone-300 hover:text-white hover:bg-white/10'
            }`}
            title="Play background music"
            aria-label="Play background music"
          >
            <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="hidden md:inline">Play</span>
          </button>

          {/* Stop Music Button */}
          <button
            onClick={handleStop}
            id="btn-stop-music"
            className={`px-2.5 py-1.5 rounded-full border text-xs font-medium tracking-wide flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer ${
              !isMusicPlaying
                ? 'bg-white/5 border-white/10 text-stone-400 opacity-60'
                : 'bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30'
            }`}
            title="Stop background music"
            aria-label="Stop background music"
          >
            <Square className="w-3.5 h-3.5 text-red-400 fill-red-400 flex-shrink-0" />
            <span className="hidden md:inline">Stop</span>
          </button>

          {/* Admin Portal Link */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-stone-900 to-amber-950/80 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold tracking-wide shadow-md shadow-amber-950/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 min-h-[38px] cursor-pointer"
              title="Admin Dashboard Portal & Site Settings"
              aria-label="Admin Dashboard Portal"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Admin</span>
            </button>
          )}

          {/* Tablet Nav Toggle (sm to lg screens) */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-full bg-white/10 border border-white/20 text-stone-200 hover:text-white hover:bg-white/15 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer ml-1"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="tablet-nav-menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile Hamburger Button (<640px) */}
        <div className="flex sm:hidden items-center gap-1.5 flex-shrink-0">
          {/* Quick status music indicator on mobile if playing */}
          {isMusicPlaying && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono animate-pulse">
              <Volume2 className="w-3 h-3" />
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-95 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            id="mobile-menu-trigger"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5 text-amber-300" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile / Tablet Dropdown Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-[57px] sm:top-[61px] bg-black/70 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.div
              ref={menuRef}
              id="mobile-nav-menu"
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute top-full left-0 right-0 z-50 bg-[#0c0714]/95 border-b border-orange-500/30 shadow-2xl p-4 sm:p-6 backdrop-blur-2xl max-h-[calc(100dvh-4.2rem)] overflow-y-auto custom-scrollbar lg:hidden"
            >
              <div className="max-w-md mx-auto flex flex-col gap-4">
                {/* Audio Status Card & Quick Controls */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isMusicPlaying ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">
                          Soundtrack
                        </span>
                        <span className="text-xs font-semibold text-rose-200 truncate block max-w-[200px] xs:max-w-[240px]">
                          {activeSongLabel}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                        isMusicPlaying
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                          : 'bg-stone-900 border-stone-700 text-stone-400'
                      }`}
                    >
                      {isMusicPlaying ? 'Playing' : 'Stopped'}
                    </span>
                  </div>

                  {/* Play / Stop Primary Buttons on Mobile */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePlay}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] cursor-pointer transition-all ${
                        isMusicPlaying
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-md shadow-amber-950/40'
                          : 'bg-white/10 hover:bg-white/15 border-white/20 text-stone-200'
                      }`}
                    >
                      <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Play Music</span>
                    </button>

                    <button
                      onClick={handleStop}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] cursor-pointer transition-all ${
                        !isMusicPlaying
                          ? 'bg-white/5 border-white/10 text-stone-500 opacity-60'
                          : 'bg-red-500/25 hover:bg-red-500/35 border-red-500/50 text-red-300'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                      <span>Stop Music</span>
                    </button>
                  </div>
                </div>

                {/* Theme & Admin Controls */}
                <div className="grid grid-cols-2 gap-2">
                  {onToggleMidnightTheme && (
                    <button
                      onClick={onToggleMidnightTheme}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] cursor-pointer transition-all ${
                        isMidnightTheme
                          ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200'
                          : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      {isMidnightTheme ? (
                        <>
                          <Moon className="w-4 h-4 text-indigo-300 fill-indigo-300" />
                          <span>Midnight Theme</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-4 h-4 text-amber-300 fill-amber-300" />
                          <span>Warm Theme</span>
                        </>
                      )}
                    </button>
                  )}

                  {onOpenAdmin && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAdmin();
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-950/80 to-stone-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-lg transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Admin Portal</span>
                    </button>
                  )}
                </div>

                {/* Navigation Section Links */}
                <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 px-2 py-1">
                    Jump to Section
                  </span>

                  <a
                    href="#photos"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-200 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors min-h-[44px]"
                  >
                    <Image className="w-4 h-4 text-rose-400" />
                    <span>Memories Reel</span>
                  </a>

                  <a
                    href="#cake-section"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-200 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors min-h-[44px]"
                  >
                    <span className="text-base">🎂</span>
                    <span>Birthday Cake & Candles</span>
                  </a>

                  <a
                    href="#letter"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-200 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors min-h-[44px]"
                  >
                    <Mail className="w-4 h-4 text-orange-400" />
                    <span>Love Letter</span>
                  </a>

                  <a
                    href="#reasons"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-200 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors min-h-[44px]"
                  >
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>100 Love Reasons Deck</span>
                  </a>

                  <a
                    href="#games"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 text-sm font-semibold transition-colors min-h-[44px]"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Games & Exam Arena</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

