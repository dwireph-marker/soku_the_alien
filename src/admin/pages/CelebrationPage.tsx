import React, { useState } from 'react';
import { Save, Flame, Sparkles, PartyPopper, Cake, Volume2 } from 'lucide-react';
import { SiteConfig, CelebrationSettings } from '../../types';

interface CelebrationPageProps {
  config: SiteConfig | null;
  onSaveCelebration: (celebrationData: Partial<CelebrationSettings>) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CelebrationPage: React.FC<CelebrationPageProps> = ({
  config,
  onSaveCelebration,
  showToast
}) => {
  const celebration = config?.celebration || {
    candleCount: 5,
    confettiEnabled: true,
    confettiAmount: 100,
    confettiDuration: 4,
    wishModalTitle: 'Make a Magical Birthday Wish ✨',
    wishModalSubtitle: 'Close your eyes, whisper your deepest dream, and make a wish!',
    blowButtonText: 'Blow Out All Candles 🕯️',
    relightButtonText: 'Relight Candles 🔥'
  };

  const [candleCount, setCandleCount] = useState(celebration.candleCount || 5);
  const [confettiEnabled, setConfettiEnabled] = useState(celebration.confettiEnabled ?? true);
  const [confettiAmount, setConfettiAmount] = useState(celebration.confettiAmount || 100);
  const [confettiDuration, setConfettiDuration] = useState(celebration.confettiDuration || 4);
  const [wishModalTitle, setWishModalTitle] = useState(celebration.wishModalTitle || '');
  const [wishModalSubtitle, setWishModalSubtitle] = useState(celebration.wishModalSubtitle || '');
  const [blowButtonText, setBlowButtonText] = useState(celebration.blowButtonText || '');
  const [relightButtonText, setRelightButtonText] = useState(celebration.relightButtonText || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveCelebration({
        candleCount: Number(candleCount),
        confettiEnabled,
        confettiAmount: Number(confettiAmount),
        confettiDuration: Number(confettiDuration),
        wishModalTitle,
        wishModalSubtitle,
        blowButtonText,
        relightButtonText
      });
      showToast('Cake & celebration settings saved!', 'success');
    } catch (err) {
      showToast('Failed to save celebration settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-stone-100">Cake & Candles Celebration Manager</h1>
        <p className="text-xs text-stone-400">Control candle count, confetti explosions, wish popup modal copy, and button text</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Candle Configuration */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            <span>Candle & Cake Controls</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Number of Candles on Cake (1 to 10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={candleCount}
                onChange={e => setCandleCount(Number(e.target.value))}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Blow Button Text
              </label>
              <input
                type="text"
                value={blowButtonText}
                onChange={e => setBlowButtonText(e.target.value)}
                placeholder="Blow Out All Candles 🕯️"
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">
              Relight Candles Button Text
            </label>
            <input
              type="text"
              value={relightButtonText}
              onChange={e => setRelightButtonText(e.target.value)}
              placeholder="Relight Candles 🔥"
              className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100"
            />
          </div>
        </div>

        {/* Confetti Explosion Settings */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
              <PartyPopper className="w-4 h-4" />
              <span>Confetti Celebration Effects</span>
            </div>
            <input
              type="checkbox"
              checked={confettiEnabled}
              onChange={e => setConfettiEnabled(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Confetti Piece Count
              </label>
              <input
                type="number"
                min={20}
                max={300}
                value={confettiAmount}
                onChange={e => setConfettiAmount(Number(e.target.value))}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Confetti Duration (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={confettiDuration}
                onChange={e => setConfettiDuration(Number(e.target.value))}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100"
              />
            </div>
          </div>
        </div>

        {/* Wish Popup Copy */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Wish Maker Modal Messages</span>
          </h2>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">
              Wish Modal Heading Title
            </label>
            <input
              type="text"
              value={wishModalTitle}
              onChange={e => setWishModalTitle(e.target.value)}
              placeholder="Make a Magical Birthday Wish ✨"
              className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">
              Wish Modal Subtitle / Instructions
            </label>
            <input
              type="text"
              value={wishModalSubtitle}
              onChange={e => setWishModalSubtitle(e.target.value)}
              placeholder="Close your eyes, whisper your deepest dream, and make a wish!"
              className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/20"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Celebration Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
