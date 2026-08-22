import { useState, useEffect } from 'react';
import { LoveReasonItem } from '../../types/firestore';
import {
  defaultLoveReasons,
  subscribeLoveReasons,
  saveLoveReason,
  deleteLoveReason,
} from '../../services/firestore/loveReasons.service';

export function useLoveReasons() {
  const [reasons, setReasons] = useState<LoveReasonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeLoveReasons((items) => {
      setReasons(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return {
    reasons,
    loading,
    saveLoveReason,
    deleteLoveReason,
  };
}
