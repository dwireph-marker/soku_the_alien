export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  token?: string;
  isAdmin: boolean;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  resource?: string;
  description?: string;
  details?: string;
  user?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalMemories: number;
  totalReasons: number;
  totalVouchers: number;
  totalWishes: number;
  totalLikes: number;
  bgMusicEnabled: boolean;
  websiteStatus: 'active' | 'maintenance';
  recentAuditLogs: AuditLog[];
}

export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}
