export interface VoucherItem {
  id: string;
  title: string;
  description: string;
  code: string;
  icon: string;
  category: string;
  isRedeemed: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
  redeemedAt?: string;
}
