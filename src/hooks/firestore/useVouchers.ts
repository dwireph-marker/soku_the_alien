import { useState, useEffect } from 'react';
import { VoucherItem } from '../../types/firestore';
import {
  defaultVouchers,
  subscribeVouchers,
  saveVoucher,
  deleteVoucher,
  redeemVoucher,
} from '../../services/firestore/vouchers.service';

export function useVouchers() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeVouchers((items) => {
      setVouchers(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return {
    vouchers,
    loading,
    saveVoucher,
    deleteVoucher,
    redeemVoucher,
  };
}
