import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Save, RefreshCw, Calendar } from 'lucide-react';
import { SiteConfig } from '../types';
import { romanticAudio } from '../utils/audio';
import { MusicSelectorSection } from './customization/MusicSelectorSection';
import { PersonalFieldsSection } from './customization/PersonalFieldsSection';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onSave: (newConfig: SiteConfig) => void;
  onReset: () => void;
  soundFxEnabled?: boolean;
}

const getYearFromIso = (isoStr?: string) => {
  if (!isoStr) return 2026;
  const d = new Date(isoStr);
  const yr = d.getFullYear();
  return isNaN(yr) ? 2026 : yr;
};

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
  soundFxEnabled = true,
}) => {
  const [herName, setHerName] = useState(config.herName || '');
  const [hisName, setHisName] = useState(config.hisName || '');
  const [targetYear, setTargetYear] = useState<number>(() => getYearFromIso(config.targetDate));
  const [letterTitle, setLetterTitle] = useState(config.loveLetterTitle || '');
  const [letterBody, setLetterBody] = useState(config.loveLetterBody || '');

  const [bgMusicType, setBgMusicType] = useState<
    'birthday' | 'synth' | 'preset' | 'custom' | 'file' | 'piano' | 'acoustic' | 'orchestral' | 'lofi'
  >(config.bgMusicType || 'birthday');
  const [bgMusicCustomUrl, setBgMusicCustomUrl] = useState(config.bgMusicCustomUrl || '');
  const [bgMusicCustomName, setBgMusicCustomName] = useState(
    config.bgMusicCustomName || (config.bgMusicType === 'birthday' ? '🎂 Happy Birthday Song' : 'My Custom Song')
  );
  const [bgMusicPresetUrl, setBgMusicPresetUrl] = useState(
    config.bgMusicPresetUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-112199.mp3'
  );

  useEffect(() => {
    setHerName(config.herName || '');
    setHisName(config.hisName || '');
    setTargetYear(getYearFromIso(config.targetDate));
    setLetterTitle(config.loveLetterTitle || '');
    setLetterBody(config.loveLetterBody || '');
    setBgMusicType(config.bgMusicType || 'birthday');
    setBgMusicCustomUrl(config.bgMusicCustomUrl || '');
    setBgMusicCustomName(
      config.bgMusicCustomName || (config.bgMusicType === 'birthday' ? '🎂 Happy Birthday Song' : 'My Custom Song')
    );
    setBgMusicPresetUrl(
      config.bgMusicPresetUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-112199.mp3'
    );
  }, [config, isOpen]);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      setBgMusicCustomName(file.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setBgMusicCustomUrl(dataUrl);
          setBgMusicType('file');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePreview = () => {
    if (isPreviewPlaying) {
      romanticAudio.stopMusic();
      setIsPreviewPlaying(false);
    } else {
      let activeUrl = '';
      if (bgMusicType === 'preset') activeUrl = bgMusicPresetUrl;
      if (bgMusicType === 'custom' || bgMusicType === 'file') activeUrl = bgMusicCustomUrl;

      romanticAudio.startMusic({
        type: bgMusicType,
        url: activeUrl,
        name: bgMusicCustomName,
      });
      setIsPreviewPlaying(true);
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (soundFxEnabled) romanticAudio.playFanfare();
    if (isPreviewPlaying) {
      romanticAudio.stopMusic();
      setIsPreviewPlaying(false);
    }

    let finalUrl = '';
    if (bgMusicType === 'preset') finalUrl = bgMusicPresetUrl;
    if (bgMusicType === 'custom' || bgMusicType === 'file') finalUrl = bgMusicCustomUrl;

    const formattedTargetDate = `${targetYear}-11-01T00:00:00`;

    const newConfig: SiteConfig = {
      ...config,
      herName,
      hisName,
      targetDate: formattedTargetDate,
      loveLetterTitle: letterTitle,
      loveLetterBody: letterBody,
      bgMusicEnabled: true,
      bgMusicType,
      bgMusicPresetUrl,
      bgMusicCustomUrl,
      bgMusicCustomName,
    };

    romanticAudio.setMusicConfig({
      type: bgMusicType,
      url: finalUrl,
      name: bgMusicCustomName,
    });

    onSave(newConfig);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (isPreviewPlaying) romanticAudio.stopMusic();
            onClose();
          }}
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#0a0502] border border-orange-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative text-amber-50 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                if (isPreviewPlaying) romanticAudio.stopMusic();
                onClose();
              }}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-orange-400 font-serif italic font-bold text-xl mb-1">
              <Settings className="w-5 h-5 text-orange-400" />
              <span>Personalize Website</span>
            </div>
            <p className="text-xs text-stone-400 mb-6 font-serif italic">
              Customize her name, birthday date, background music, and love letter!
            </p>

            <form onSubmit={handleSaveSubmit} className="space-y-5 text-xs sm:text-sm">
              <PersonalFieldsSection
                herName={herName}
                setHerName={setHerName}
                hisName={hisName}
                setHisName={setHisName}
                targetYear={targetYear}
                setTargetYear={setTargetYear}
              />

              <MusicSelectorSection
                bgMusicType={bgMusicType}
                setBgMusicType={setBgMusicType}
                bgMusicCustomName={bgMusicCustomName}
                setBgMusicCustomName={setBgMusicCustomName}
                bgMusicCustomUrl={bgMusicCustomUrl}
                setBgMusicCustomUrl={setBgMusicCustomUrl}
                uploadFileName={uploadFileName}
                handleFileUpload={handleFileUpload}
                isPreviewPlaying={isPreviewPlaying}
                handleTogglePreview={handleTogglePreview}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">Love Letter Title</label>
                <input
                  type="text"
                  required
                  value={letterTitle || ''}
                  onChange={e => setLetterTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-orange-500 font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">Love Letter Message Body</label>
                <textarea
                  rows={4}
                  required
                  value={letterBody || ''}
                  onChange={e => setLetterBody(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-orange-500 font-serif text-xs sm:text-sm"
                />
              </div>

              {/* Photo Reel Backend Link */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-amber-200 block">Photo Reel Management (Backend)</span>
                  <span className="text-[11px] text-stone-400 block font-serif">Add, Edit title/captions, and Remove photos from the backend admin panel</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.hash = 'admin';
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-300 font-medium text-[11px] whitespace-nowrap transition-all"
                >
                  Manage in Backend →
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 text-stone-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-orange-400" /> Reset Defaults
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium text-xs uppercase tracking-[0.2em] py-2.5 rounded-xl shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" /> Save Personalizations
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
