import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Heart, UserCheck, Mail, Sliders, Sparkles } from 'lucide-react';
import { SiteConfig } from '../../types';
import { NamesPage } from './NamesPage';

interface SiteSettingsPageProps {
  config: SiteConfig | null;
  onSave: (newConfig: Partial<SiteConfig>) => Promise<void>;
  onSaveNames?: (namesData: {
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
  }) => Promise<void>;
  onReset: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialSubTab?: 'names' | 'letter';
}

export const SiteSettingsPage: React.FC<SiteSettingsPageProps> = ({
  config,
  onSave,
  onSaveNames,
  onReset,
  showToast,
  initialSubTab = 'names'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'names' | 'letter'>(initialSubTab);

  // Love Letter Form State
  const [loveLetterTitle, setLoveLetterTitle] = useState(config?.loveLetterTitle || '');
  const [loveLetterBody, setLoveLetterBody] = useState(config?.loveLetterBody || '');
  const [savingLetter, setSavingLetter] = useState(false);

  useEffect(() => {
    if (config) {
      setLoveLetterTitle(config.loveLetterTitle || '');
      setLoveLetterBody(config.loveLetterBody || '');
    }
  }, [config]);

  const handleSaveLoveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLetter(true);
    try {
      await onSave({
        loveLetterTitle,
        loveLetterBody
      });
      showToast('Love letter updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to save love letter.', 'error');
    } finally {
      setSavingLetter(false);
    }
  };

  const handleSaveNamesProxy = async (namesData: any) => {
    if (onSaveNames) {
      await onSaveNames(namesData);
    } else {
      await onSave(namesData);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Bar with Subtab Navigation */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-stone-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Site Settings & Personalization</span>
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Manage recipient & sender names across all sections and customize the birthday love letter.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('names')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'names'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Names & Personalization</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('letter')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'letter'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-rose-400" />
            <span>Love Letter Message</span>
          </button>
        </div>
      </div>

      {/* Subtab Content */}
      {activeSubTab === 'names' ? (
        <NamesPage
          config={config}
          onSaveNames={handleSaveNamesProxy}
          showToast={showToast}
        />
      ) : (
        <div className="space-y-6 max-w-4xl">
          <form onSubmit={handleSaveLoveLetter} className="space-y-6">
            {/* Love Letter Section */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h2 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span>Romantic Birthday Love Letter</span>
                </h2>
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Displays in the Love Letter section
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Love Letter Heading Title
                </label>
                <input
                  type="text"
                  required
                  value={loveLetterTitle}
                  onChange={e => setLoveLetterTitle(e.target.value)}
                  placeholder="Happy Birthday to the Love of My Life ❤️"
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Full Birthday Letter Body
                </label>
                <textarea
                  rows={8}
                  required
                  value={loveLetterBody}
                  onChange={e => setLoveLetterBody(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-xs text-stone-100 leading-relaxed focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to reset all site configuration to defaults?')) {
                    await onReset();
                    showToast('Reset configuration to defaults.', 'info');
                  }
                }}
                className="px-4 py-2.5 rounded-2xl bg-stone-800 hover:bg-rose-950/40 text-rose-400 text-xs font-medium border border-stone-700 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset To Default Config</span>
              </button>

              <button
                type="submit"
                disabled={savingLetter}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs shadow-lg shadow-amber-900/20 flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingLetter ? 'Saving...' : 'Save Love Letter'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

