import React from 'react';
import { Upload, Link as LinkIcon, Folder, Loader2, AlertCircle, Check, Volume2, Play } from 'lucide-react';

interface AudioUploaderBoxProps {
  manualUrlMode: boolean;
  setManualUrlMode: (val: boolean) => void;
  dragActive: boolean;
  setDragActive: (val: boolean) => void;
  uploading: boolean;
  progress: number;
  uploadError: string | null;
  customUrl: string;
  setCustomUrl: (url: string) => void;
  customName: string;
  setCustomName: (name: string) => void;
  musicType: string;
  previewTrackId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAudioFileSelect: (file: File) => void;
  handleAddManualUrl: () => void;
  handleDrop: (e: React.DragEvent) => void;
  onTogglePreview: (id: string, type: string, url: string, name: string, e?: React.MouseEvent) => void;
}

export const AudioUploaderBox: React.FC<AudioUploaderBoxProps> = ({
  manualUrlMode,
  setManualUrlMode,
  dragActive,
  setDragActive,
  uploading,
  progress,
  uploadError,
  customUrl,
  setCustomUrl,
  customName,
  setCustomName,
  musicType,
  previewTrackId,
  fileInputRef,
  handleAudioFileSelect,
  handleAddManualUrl,
  handleDrop,
  onTogglePreview,
}) => {
  return (
    <div className="space-y-4 pt-3 border-t border-stone-800">
      <div className="flex items-center justify-between text-xs text-stone-300 font-medium">
        <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
          <Upload className="w-4 h-4 text-amber-400" />
          Upload New Music File from Device Folder
        </span>
        <button
          type="button"
          onClick={() => setManualUrlMode(!manualUrlMode)}
          className="text-amber-400 hover:text-amber-300 underline text-[11px] flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {manualUrlMode ? 'Browse Device Folder' : 'Paste Audio Web URL'}
        </button>
      </div>

      {!manualUrlMode ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-stone-800 hover:border-amber-500/50 bg-stone-950/80 hover:bg-stone-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleAudioFileSelect(e.target.files[0])}
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
              <p className="text-xs text-stone-200 font-medium">Processing & Saving Audio File...</p>
              <div className="w-48 bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 mb-2 border border-amber-500/20">
                <Folder className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-stone-100">Click to Open Device Folder & Select MP3</p>
              <p className="text-[11px] text-stone-400 mt-1">
                Supports MP3, M4A, WAV, OGG, or AAC audio files from your phone or PC
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Open Device Folder</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-300">Custom Audio Web URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/soundtrack.mp3"
              className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold"
            >
              Add Track
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {customUrl && musicType === 'custom' && (
        <div className="bg-stone-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Selected Music Track Ready
            </span>
            <span className="text-[10px] text-stone-500 truncate max-w-[180px]">
              {customUrl.startsWith('data:') ? 'Local Device Audio' : customUrl}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-500/20">
            <span className="text-[11px] text-stone-300 font-medium truncate max-w-[200px]">
              {customName || 'Custom Audio Track'}
            </span>
            <button
              type="button"
              onClick={(e) => onTogglePreview('custom_active', 'custom', customUrl, customName || 'Selected Song', e)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                previewTrackId === 'custom_active'
                  ? 'bg-emerald-400 text-stone-950 font-bold animate-pulse'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {previewTrackId === 'custom_active' ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Playing Track</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Audio Track</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {musicType === 'custom' && (
        <div>
          <label className="block text-xs font-medium text-stone-300 mb-1">Song Display Name</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Our Special Song"
            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-amber-500"
          />
        </div>
      )}
    </div>
  );
};
