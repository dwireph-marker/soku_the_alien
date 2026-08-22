import React from 'react';
import { Music, Play, Square, Link, Upload } from 'lucide-react';

interface MusicSelectorSectionProps {
  bgMusicType: string;
  setBgMusicType: (type: any) => void;
  bgMusicCustomName: string;
  setBgMusicCustomName: (name: string) => void;
  bgMusicCustomUrl: string;
  setBgMusicCustomUrl: (url: string) => void;
  uploadFileName: string;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPreviewPlaying: boolean;
  handleTogglePreview: () => void;
}

export const MusicSelectorSection: React.FC<MusicSelectorSectionProps> = ({
  bgMusicType,
  setBgMusicType,
  bgMusicCustomName,
  setBgMusicCustomName,
  bgMusicCustomUrl,
  setBgMusicCustomUrl,
  uploadFileName,
  handleFileUpload,
  isPreviewPlaying,
  handleTogglePreview,
}) => {
  return (
    <div className="p-4 bg-white/5 border border-orange-500/30 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-400 font-semibold uppercase tracking-wider text-xs">
          <Music className="w-4 h-4 text-orange-400" />
          <span>Background Music Selection</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!isPreviewPlaying) handleTogglePreview();
            }}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1 transition-all ${
              isPreviewPlaying
                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                : 'bg-white/5 border-white/10 text-stone-300 hover:text-white'
            }`}
          >
            <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Play</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isPreviewPlaying) handleTogglePreview();
            }}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1 transition-all ${
              !isPreviewPlaying
                ? 'bg-white/5 border-white/10 text-stone-400 opacity-60'
                : 'bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30'
            }`}
          >
            <Square className="w-3 h-3 text-red-400 fill-red-400" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            setBgMusicType('birthday');
            setBgMusicCustomName('🎂 Happy Birthday Song');
          }}
          className={`col-span-2 p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
            bgMusicType === 'birthday'
              ? 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-400 text-orange-200 shadow-md shadow-orange-950/40'
              : 'bg-white/5 border-white/10 text-stone-300 hover:border-white/20'
          }`}
        >
          <div>
            <span className="font-bold text-sm block text-amber-200">🎂 Happy Birthday Song</span>
            <span className="text-[11px] text-stone-300/80">Classic cheerful birthday melody</span>
          </div>
          {bgMusicType === 'birthday' && (
            <span className="px-2 py-0.5 rounded-full bg-orange-500/40 border border-orange-400/60 text-[10px] font-semibold text-orange-200 uppercase tracking-wider">
              Selected
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setBgMusicType('synth');
            setBgMusicCustomName('🎹 Romantic Synth');
          }}
          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
            bgMusicType === 'synth'
              ? 'bg-orange-500/20 border-orange-400 text-orange-200'
              : 'bg-white/5 border-white/10 text-stone-300 hover:border-white/20'
          }`}
        >
          <span className="font-semibold">🎹 Romantic Synth</span>
          <span className="text-[10px] text-stone-400">Gentle generated lullaby</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setBgMusicType('preset');
            setBgMusicCustomName('🎼 Piano Romance');
          }}
          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
            bgMusicType === 'preset'
              ? 'bg-orange-500/20 border-orange-400 text-orange-200'
              : 'bg-white/5 border-white/10 text-stone-300 hover:border-white/20'
          }`}
        >
          <span className="font-semibold">🎼 Piano Romance</span>
          <span className="text-[10px] text-stone-400">Sweet piano instrumental</span>
        </button>

        <button
          type="button"
          onClick={() => setBgMusicType('custom')}
          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
            bgMusicType === 'custom'
              ? 'bg-orange-500/20 border-orange-400 text-orange-200'
              : 'bg-white/5 border-white/10 text-stone-300 hover:border-white/20'
          }`}
        >
          <span className="font-semibold flex items-center gap-1">
            <Link className="w-3 h-3" /> Audio Link / URL
          </span>
          <span className="text-[10px] text-stone-400">Paste MP3 or web audio link</span>
        </button>

        <button
          type="button"
          onClick={() => setBgMusicType('file')}
          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
            bgMusicType === 'file'
              ? 'bg-orange-500/20 border-orange-400 text-orange-200'
              : 'bg-white/5 border-white/10 text-stone-300 hover:border-white/20'
          }`}
        >
          <span className="font-semibold flex items-center gap-1">
            <Upload className="w-3 h-3" /> Upload MP3 File
          </span>
          <span className="text-[10px] text-stone-400">Choose file from device</span>
        </button>
      </div>

      {bgMusicType === 'custom' && (
        <div className="space-y-2 pt-1">
          <div>
            <label className="block text-[11px] text-stone-300 mb-1">Song Title / Name</label>
            <input
              type="text"
              value={bgMusicCustomName || ''}
              onChange={e => setBgMusicCustomName(e.target.value)}
              placeholder="e.g. Perfect - Ed Sheeran"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 text-xs font-serif"
            />
          </div>
          <div>
            <label className="block text-[11px] text-stone-300 mb-1">Direct MP3 / Audio Link URL</label>
            <input
              type="url"
              value={bgMusicCustomUrl || ''}
              onChange={e => setBgMusicCustomUrl(e.target.value)}
              placeholder="https://example.com/romantic-song.mp3"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {bgMusicType === 'file' && (
        <div className="space-y-2 pt-1">
          <label className="block text-[11px] text-stone-300 mb-1">Upload Audio File (MP3, WAV, M4A, OGG)</label>
          <label className="flex items-center justify-center gap-2 w-full bg-white/5 border border-dashed border-orange-500/50 hover:border-orange-400 rounded-xl p-3 cursor-pointer transition-colors text-xs text-orange-200">
            <Upload className="w-4 h-4 text-orange-400" />
            <span>{uploadFileName || 'Click to select audio file from your device'}</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {bgMusicCustomUrl && (
            <p className="text-[10px] text-emerald-400 italic">
              ✓ Audio file loaded ({bgMusicCustomName})
            </p>
          )}
        </div>
      )}
    </div>
  );
};
