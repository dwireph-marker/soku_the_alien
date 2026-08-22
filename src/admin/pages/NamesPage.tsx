import React, { useState, useEffect } from 'react';
import {
  User,
  Heart,
  Save,
  RefreshCw,
  Sparkles,
  Shield,
  CheckCircle,
  Eye,
  Type,
  Mail,
  PartyPopper,
  Compass,
  Sliders,
  RotateCcw,
  Clock,
  Send,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { SiteConfig } from '../../types';

interface NamesPageProps {
  config: SiteConfig | null;
  onSaveNames: (namesData: {
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
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const NamesPage: React.FC<NamesPageProps> = ({
  config,
  onSaveNames,
  showToast,
}) => {
  // Global / Default names
  const [herName, setHerName] = useState(config?.herName || 'Sonali');
  const [hisName, setHisName] = useState(config?.hisName || 'Gunjan');

  // Specific section custom names
  const [navbarName, setNavbarName] = useState(config?.navbarName || '');
  const [introName, setIntroName] = useState(config?.introName || '');
  const [heroName, setHeroName] = useState(config?.heroName || '');
  const [cakeName, setCakeName] = useState(config?.cakeName || '');
  const [letterSalutationName, setLetterSalutationName] = useState(config?.letterSalutationName || '');
  const [letterSignOffName, setLetterSignOffName] = useState(config?.letterSignOffName || '');
  const [footerRecipientName, setFooterRecipientName] = useState(config?.footerRecipientName || '');
  const [footerSenderName, setFooterSenderName] = useState(config?.footerSenderName || '');

  // UI state
  const [activeTab, setActiveTab] = useState<'separate' | 'global'>('separate');
  const [activePreviewSection, setActivePreviewSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setHerName(config.herName || 'Sonali');
      setHisName(config.hisName || 'Gunjan');
      setNavbarName(config.navbarName || '');
      setIntroName(config.introName || '');
      setHeroName(config.heroName || '');
      setCakeName(config.cakeName || '');
      setLetterSalutationName(config.letterSalutationName || '');
      setLetterSignOffName(config.letterSignOffName || '');
      setFooterRecipientName(config.footerRecipientName || '');
      setFooterSenderName(config.footerSenderName || '');
    }
  }, [config]);

  useEffect(() => {
    const isDifferent =
      herName !== (config?.herName || 'Sonali') ||
      hisName !== (config?.hisName || 'Gunjan') ||
      navbarName !== (config?.navbarName || '') ||
      introName !== (config?.introName || '') ||
      heroName !== (config?.heroName || '') ||
      cakeName !== (config?.cakeName || '') ||
      letterSalutationName !== (config?.letterSalutationName || '') ||
      letterSignOffName !== (config?.letterSignOffName || '') ||
      footerRecipientName !== (config?.footerRecipientName || '') ||
      footerSenderName !== (config?.footerSenderName || '');
    setHasChanges(isDifferent);
  }, [
    herName,
    hisName,
    navbarName,
    introName,
    heroName,
    cakeName,
    letterSalutationName,
    letterSignOffName,
    footerRecipientName,
    footerSenderName,
    config,
  ]);

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  const handleResetAll = () => {
    if (config) {
      setHerName(config.herName || 'Sonali');
      setHisName(config.hisName || 'Gunjan');
      setNavbarName(config.navbarName || '');
      setIntroName(config.introName || '');
      setHeroName(config.heroName || '');
      setCakeName(config.cakeName || '');
      setLetterSalutationName(config.letterSalutationName || '');
      setLetterSignOffName(config.letterSignOffName || '');
      setFooterRecipientName(config.footerRecipientName || '');
      setFooterSenderName(config.footerSenderName || '');
      showToast('Reset all names to saved configuration', 'info');
    }
  };

  const handleSyncDefaultsToAll = () => {
    setNavbarName(`For ${herName}`);
    setIntroName(herName);
    setHeroName(herName);
    setCakeName(herName);
    setLetterSalutationName(herName);
    setLetterSignOffName(hisName);
    setFooterRecipientName(herName);
    setFooterSenderName(hisName);
    showToast('Applied global recipient & sender names to all individual sections!', 'success');
  };

  const handleClearOverrides = () => {
    setNavbarName('');
    setIntroName('');
    setHeroName('');
    setCakeName('');
    setLetterSalutationName('');
    setLetterSignOffName('');
    setFooterRecipientName('');
    setFooterSenderName('');
    showToast('Cleared custom overrides — all sections will now inherit the global names.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!herName.trim()) {
      showToast("Please provide the Birthday Person's name", 'error');
      return;
    }
    if (!hisName.trim()) {
      showToast("Please provide the Sender's name", 'error');
      return;
    }

    setSaving(true);
    try {
      await onSaveNames({
        herName: herName.trim(),
        hisName: hisName.trim(),
        navbarName: navbarName.trim(),
        introName: introName.trim(),
        heroName: heroName.trim(),
        cakeName: cakeName.trim(),
        letterSalutationName: letterSalutationName.trim(),
        letterSignOffName: letterSignOffName.trim(),
        footerRecipientName: footerRecipientName.trim(),
        footerSenderName: footerSenderName.trim(),
      });
      showToast('Names updated successfully across all sections!', 'success');
      setHasChanges(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save names', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper values for dynamic live previews
  const liveNavbarDisplay = navbarName.trim()
    ? navbarName.trim().startsWith('For ') || navbarName.trim().startsWith('for ')
      ? navbarName.trim()
      : `For ${navbarName.trim()}`
    : `For ${herName || '...'}`;

  const liveIntroDisplay = introName.trim()
    ? introName.trim().startsWith('For ') || introName.trim().startsWith('for ')
      ? introName.trim()
      : `For ${introName.trim()}`
    : `For ${herName || '...'}`;

  const liveHeroDisplay = heroName.trim() || herName || '...';
  const liveCakeDisplay = cakeName.trim() || herName || '...';
  const liveLetterSalutation = letterSalutationName.trim() || herName || '...';
  const liveLetterSignOff = letterSignOffName.trim() || hisName || '...';
  const liveFooterRecipient = footerRecipientName.trim() || herName || '...';
  const liveFooterSender = footerSenderName.trim() || hisName || '...';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-rose-950/20 to-stone-900 border border-stone-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
              <span>Names & Personalization</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Admin Only
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
            Customize names everywhere on the website — either using global defaults or setting distinct, personalized names for every single section (Navbar, Intro Animation, Interactive Cake, Love Letter, Hero, and Footer).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetAll}
            disabled={saving || !hasChanges}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 bg-stone-800/60 hover:bg-stone-800 border border-stone-700/60 disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-3 border-b border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('separate')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'separate'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/40'
              : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-rose-400" />
          <span>Change Names Separately Everywhere</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
            Granular
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('global')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'global'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/40'
              : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Quick Global Defaults (Sync All)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Global Primary Defaults Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-400" />
                <span>Primary Global Names (Defaults)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncDefaultsToAll}
                  className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Apply to All Sections</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Birthday Person Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span>Birthday Person (Her Name)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setHerName(toTitleCase(herName.trim()))}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Capitalize
                  </button>
                </div>
                <input
                  type="text"
                  value={herName}
                  onChange={(e) => setHerName(e.target.value)}
                  placeholder="e.g. Sonali or Soku"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 focus:border-rose-500 rounded-xl text-sm text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-stone-500">
                  Default recipient name used when a section doesn't have a custom override.
                </p>
              </div>

              {/* Primary Sender Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sender / Partner (Your Name)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setHisName(toTitleCase(hisName.trim()))}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Capitalize
                  </button>
                </div>
                <input
                  type="text"
                  value={hisName}
                  onChange={(e) => setHisName(e.target.value)}
                  placeholder="e.g. Gunjan"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl text-sm text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-stone-500">
                  Default sender / author name for signatures and romantic dedications.
                </p>
              </div>
            </div>
          </div>

          {/* Granular Section Controls */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-rose-400" />
                  <span>Section-by-Section Name Customization</span>
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Leave any field blank to automatically inherit the global default name.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearOverrides}
                className="text-[11px] text-stone-400 hover:text-stone-200 bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700/60 transition-colors"
              >
                Clear Overrides
              </button>
            </div>

            <div className="space-y-5 divide-y divide-stone-800/60">
              {/* 1. Navbar Brand Name */}
              <div
                className="space-y-2 pt-2 first:pt-0"
                onMouseEnter={() => setActivePreviewSection('navbar')}
                onMouseLeave={() => setActivePreviewSection(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. Navbar Brand Title</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    Default: "For {herName}"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={navbarName}
                    onChange={(e) => setNavbarName(e.target.value)}
                    placeholder={`e.g. For ${herName} or ${herName}`}
                    className="flex-1 px-3.5 py-2.5 bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                  />
                  {navbarName && (
                    <button
                      type="button"
                      onClick={() => setNavbarName('')}
                      className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-2 rounded-lg bg-stone-800/60 border border-stone-700/50"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Controls the top-left navigation bar brand logo text.
                </p>
              </div>

              {/* 2. Glowing Intro Animation Name */}
              <div
                className="space-y-2 pt-4"
                onMouseEnter={() => setActivePreviewSection('intro')}
                onMouseLeave={() => setActivePreviewSection(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>2. Glowing Heart Intro Animation Name</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    Default: "For {herName}"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={introName}
                    onChange={(e) => setIntroName(e.target.value)}
                    placeholder={`e.g. ${herName} or My Princess`}
                    className="flex-1 px-3.5 py-2.5 bg-stone-950 border border-stone-800 focus:border-rose-400 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                  />
                  {introName && (
                    <button
                      type="button"
                      onClick={() => setIntroName('')}
                      className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-2 rounded-lg bg-stone-800/60 border border-stone-700/50"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Displayed underneath the cinematic glowing heart particle animation before the website reveals.
                </p>
              </div>

              {/* 3. Hero & Countdown Headline */}
              <div
                className="space-y-2 pt-4"
                onMouseEnter={() => setActivePreviewSection('hero')}
                onMouseLeave={() => setActivePreviewSection(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>3. Hero Countdown Banner Headline Name</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    Default: "Happy Birthday, {herName}"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={heroName}
                    onChange={(e) => setHeroName(e.target.value)}
                    placeholder={`e.g. ${herName} or My Love`}
                    className="flex-1 px-3.5 py-2.5 bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                  />
                  {heroName && (
                    <button
                      type="button"
                      onClick={() => setHeroName('')}
                      className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-2 rounded-lg bg-stone-800/60 border border-stone-700/50"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Displayed in the main grand headline: "Happy Birthday, {'{Name}'}".
                </p>
              </div>

              {/* 4. Interactive Cake Plaque & Party Poppers */}
              <div
                className="space-y-2 pt-4"
                onMouseEnter={() => setActivePreviewSection('cake')}
                onMouseLeave={() => setActivePreviewSection(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <PartyPopper className="w-3.5 h-3.5 text-rose-400" />
                    <span>4. Interactive Cake Gold Heart Inscription</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    Default: "✨ Happy Birthday {herName} ✨"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cakeName}
                    onChange={(e) => setCakeName(e.target.value)}
                    placeholder={`e.g. ${herName} or Happy Birthday ${herName}`}
                    className="flex-1 px-3.5 py-2.5 bg-stone-950 border border-stone-800 focus:border-rose-400 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                  />
                  {cakeName && (
                    <button
                      type="button"
                      onClick={() => setCakeName('')}
                      className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-2 rounded-lg bg-stone-800/60 border border-stone-700/50"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Engraved in the glowing neon heart plaque on the 3D birthday cake & party poppers burst celebration!
                </p>
              </div>

              {/* 5. Love Letter Salutation / Dearest */}
              <div
                className="space-y-2 pt-4"
                onMouseEnter={() => setActivePreviewSection('letter')}
                onMouseLeave={() => setActivePreviewSection(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>5. Love Letter Recipient Salutation</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    Default: "Dearest {herName}"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={letterSalutationName}
                    onChange={(e) => setLetterSalutationName(e.target.value)}
                    placeholder={`e.g. ${herName} or My Whole Universe`}
                    className="flex-1 px-3.5 py-2.5 bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                  />
                  {letterSalutationName && (
                    <button
                      type="button"
                      onClick={() => setLetterSalutationName('')}
                      className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-2 rounded-lg bg-stone-800/60 border border-stone-700/50"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Written on the wax sealed envelope stamp and opening salutation ("To My Dearest {'{Name}'}").
                </p>
              </div>

              {/* 6. Love Letter Sign-off / Signature */}
              <div
                className="space-y-2 pt-4"
                onMouseEnter={() => setActivePreviewSection('letter')}
                onMouseLeave={() => setActivePreviewSection(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-rose-400" />
                    <span>6. Love Letter Sign-off Signature</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    Default: "{hisName} ❤️"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={letterSignOffName}
                    onChange={(e) => setLetterSignOffName(e.target.value)}
                    placeholder={`e.g. ${hisName} or Forever Yours Gunjan`}
                    className="flex-1 px-3.5 py-2.5 bg-stone-950 border border-stone-800 focus:border-rose-400 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                  />
                  {letterSignOffName && (
                    <button
                      type="button"
                      onClick={() => setLetterSignOffName('')}
                      className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-2 rounded-lg bg-stone-800/60 border border-stone-700/50"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  Signed at the bottom of the opened love letter ("With all my love forever, — {'{Name}'} ❤️").
                </p>
              </div>

              {/* 7. Footer Dedication Recipient & Sender */}
              <div
                className="space-y-3 pt-4"
                onMouseEnter={() => setActivePreviewSection('footer')}
                onMouseLeave={() => setActivePreviewSection(null)}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>7. Footer Dedication Lines</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    Recipient & Author
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 block font-mono">
                      Footer Recipient Name:
                    </span>
                    <input
                      type="text"
                      value={footerRecipientName}
                      onChange={(e) => setFooterRecipientName(e.target.value)}
                      placeholder={`e.g. ${herName}`}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-rose-400 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 block font-mono">
                      Footer Sender / Author:
                    </span>
                    <input
                      type="text"
                      value={footerSenderName}
                      onChange={(e) => setFooterSenderName(e.target.value)}
                      placeholder={`e.g. ${hisName}`}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 focus:border-amber-400 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-stone-400">
                  Customizes the bottom footer credits and copyright dedication bar.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant live sync across database</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-stone-950 font-bold text-xs shadow-lg shadow-rose-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Names...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Custom Names</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Contextual Previews */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-xs font-semibold text-stone-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Live Website Preview</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Real-time preview
              </span>
            </div>

            {/* Preview 1: Header Brand Logo */}
            <div
              className={`bg-stone-950 border rounded-xl p-3.5 space-y-1.5 transition-all duration-300 ${
                activePreviewSection === 'navbar'
                  ? 'border-amber-400/80 shadow-md shadow-amber-950/40 bg-stone-900/90'
                  : 'border-stone-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-mono text-stone-500">
                <div className="flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span>Navbar Brand</span>
                </div>
                {navbarName && (
                  <span className="text-amber-400/90 text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Customized
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white shadow-sm">
                  <Heart className="w-3.5 h-3.5 fill-white" />
                </div>
                <span className="font-serif italic font-bold text-base text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-amber-100 to-white">
                  {liveNavbarDisplay}
                </span>
              </div>
            </div>

            {/* Preview 2: Stardust Intro Animation Badge */}
            <div
              className={`bg-stone-950 border rounded-xl p-3.5 space-y-1.5 transition-all duration-300 ${
                activePreviewSection === 'intro'
                  ? 'border-rose-400/80 shadow-md shadow-rose-950/40 bg-stone-900/90'
                  : 'border-stone-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-mono text-stone-500">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>Glowing Intro Animation</span>
                </div>
                {introName && (
                  <span className="text-rose-400/90 text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    Customized
                  </span>
                )}
              </div>
              <div className="p-3 bg-gradient-to-b from-[#02010c] to-[#08051e] rounded-lg border border-purple-900/40 text-center">
                <p className="font-serif italic text-xs text-pink-100/90 mb-1">
                  “Something special is waiting for you…”
                </p>
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-pink-300 font-mono">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>{liveIntroDisplay}</span>
                  <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                </div>
              </div>
            </div>

            {/* Preview 3: Hero & Countdown Banner */}
            <div
              className={`bg-stone-950 border rounded-xl p-3.5 space-y-1.5 transition-all duration-300 ${
                activePreviewSection === 'hero'
                  ? 'border-amber-400/80 shadow-md shadow-amber-950/40 bg-stone-900/90'
                  : 'border-stone-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-mono text-stone-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Hero Countdown Headline</span>
                </div>
                {heroName && (
                  <span className="text-amber-400/90 text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Customized
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-gradient-to-b from-stone-900 to-black rounded-lg border border-stone-800 text-center">
                <h4 className="font-serif italic text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-amber-200">
                  Happy Birthday, {liveHeroDisplay}
                </h4>
              </div>
            </div>

            {/* Preview 4: Interactive Cake Inscription */}
            <div
              className={`bg-stone-950 border rounded-xl p-3.5 space-y-1.5 transition-all duration-300 ${
                activePreviewSection === 'cake'
                  ? 'border-rose-400/80 shadow-md shadow-rose-950/40 bg-stone-900/90'
                  : 'border-stone-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-mono text-stone-500">
                <div className="flex items-center gap-1">
                  <PartyPopper className="w-3 h-3 text-amber-400" />
                  <span>Cake Gold Plaque</span>
                </div>
                {cakeName && (
                  <span className="text-rose-400/90 text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    Customized
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-gradient-to-r from-amber-950/40 to-stone-900 border border-amber-500/30 rounded-lg text-center">
                <span className="font-serif italic font-bold text-xs text-amber-200">
                  ✨ {liveCakeDisplay.toLowerCase().includes('birthday') ? liveCakeDisplay : `Happy Birthday ${liveCakeDisplay}`} ✨
                </span>
              </div>
            </div>

            {/* Preview 5: Love Letter Sign-off & Salutation */}
            <div
              className={`bg-stone-950 border rounded-xl p-3.5 space-y-1.5 transition-all duration-300 ${
                activePreviewSection === 'letter'
                  ? 'border-rose-400/80 shadow-md shadow-rose-950/40 bg-stone-900/90'
                  : 'border-stone-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-mono text-stone-500">
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  <span>Love Letter Salutation & Signature</span>
                </div>
                {(letterSalutationName || letterSignOffName) && (
                  <span className="text-rose-400/90 text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    Customized
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-lg text-xs space-y-1 font-serif text-stone-300">
                <p className="italic text-stone-400">“My dearest {liveLetterSalutation}, you are my whole universe...”</p>
                <p className="text-right text-rose-300 font-bold italic pt-1">
                  Forever & always yours, <br />
                  <span className="text-amber-300 text-sm">— {liveLetterSignOff}</span>
                </p>
              </div>
            </div>

            {/* Preview 6: Footer Dedication */}
            <div
              className={`bg-stone-950 border rounded-xl p-3.5 space-y-1.5 transition-all duration-300 ${
                activePreviewSection === 'footer'
                  ? 'border-rose-400/80 shadow-md shadow-rose-950/40 bg-stone-900/90'
                  : 'border-stone-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-mono text-stone-500">
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500" />
                  <span>Footer Dedication</span>
                </div>
                {(footerRecipientName || footerSenderName) && (
                  <span className="text-rose-400/90 text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    Customized
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-black/60 border border-rose-900/30 rounded-lg text-center space-y-0.5">
                <p className="font-serif text-[11px] text-pink-200">
                  Crafted with endless love for {liveFooterRecipient} ❤️
                </p>
                <p className="text-[10px] text-rose-300/60 font-mono">
                  Happy Birthday • Forever & Always • {liveFooterSender}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
