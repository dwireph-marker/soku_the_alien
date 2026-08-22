import { SavedAudioTrack } from './music';

export interface SiteSettingsData {
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
  targetDate: string;
  birthdayDate?: string;
  birthdayTime?: string;
  timezone?: string;
  countdownEnabled?: boolean;
  birthdayMonth?: number;
  birthdayDay?: number;
  birthdayYear?: number;
  loveLetterTitle: string;
  loveLetterBody: string;
  bgMusicEnabled: boolean;
  bgMusicType: string;
  bgMusicPresetUrl: string;
  bgMusicCustomUrl: string;
  bgMusicCustomName: string;
  activeTrackId?: string;
  customAudioTracks?: SavedAudioTrack[];
  soundFxEnabled: boolean;
  updatedAt?: string;
}
