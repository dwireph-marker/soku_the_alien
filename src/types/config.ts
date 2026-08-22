export interface MemoryPhoto {
  id: string;
  url: string;
  title: string;
  mediaType?: 'image' | 'video';
  date?: string;
  location?: string;
  caption?: string;
  likes?: number;
  imageKitFileId?: string;
  isActive?: boolean;
}
export type Memory = MemoryPhoto;

export interface ReasonItem {
  id: string;
  number: number;
  text: string;
  icon: string;
  isActive?: boolean;
}
export type LoveReason = ReasonItem;

export interface EnvelopeItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  bgGradient: string;
}
export type OpenWhenEnvelope = EnvelopeItem;

export interface VoucherItem {
  id: string;
  title: string;
  description: string;
  code: string;
  icon: string;
  category?: string;
  isRedeemed: boolean;
  isActive?: boolean;
}
export type Voucher = VoucherItem;

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  url: string;
  type: 'birthday' | 'custom' | 'piano' | 'acoustic' | 'orchestral' | 'lofi';
  isActive?: boolean;
}

export interface Wish {
  id: string;
  name: string;
  message: string;
  wishText?: string;
  herName?: string;
  createdAt: string;
  isViewed?: boolean;
}

export interface CelebrationSettings {
  candleCount: number;
  confettiEnabled: boolean;
  confettiAmount: number;
  confettiDuration: number;
  wishModalTitle: string;
  wishModalSubtitle: string;
  blowButtonText: string;
  relightButtonText: string;
}

export interface SiteConfig {
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
  bgMusicType: 'birthday' | 'custom' | 'piano' | 'acoustic' | 'orchestral' | 'lofi' | 'preset' | 'file' | 'synth';
  bgMusicPresetUrl: string;
  bgMusicCustomUrl: string;
  bgMusicCustomName: string;
  activeTrackId?: string;
  customAudioTracks?: Array<{
    id: string;
    name: string;
    url: string;
    type?: string;
    mimeType?: string;
    dateAdded?: string;
    createdAt?: string;
    isActive?: boolean;
  }>;
  soundFxEnabled: boolean;
  photos: MemoryPhoto[];
  reasons: ReasonItem[];
  envelopes: EnvelopeItem[];
  vouchers: VoucherItem[];
  celebration?: CelebrationSettings;
}

export interface BirthdayWish extends Wish {}
