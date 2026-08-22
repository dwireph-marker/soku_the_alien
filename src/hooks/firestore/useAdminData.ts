import { useState, useEffect } from 'react';
import { BirthdayWishItem, AuditLogItem } from '../../types/firestore';
import { subscribeWishes, deleteWish } from '../../services/firestore/wishes.service';
import { subscribeAuditLogs, addAuditLog } from '../../services/firestore/auditLogs.service';
import { auth } from '../../lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

export function useAdminData() {
  const [wishes, setWishes] = useState<BirthdayWishItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubWishes = () => {};
    let unsubLogs = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubWishes();
      unsubLogs();

      if (user) {
        unsubWishes = subscribeWishes((items) => setWishes(items));
        unsubLogs = subscribeAuditLogs((items) => setAuditLogs(items));
      } else {
        setWishes([]);
        setAuditLogs([]);
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubWishes();
      unsubLogs();
    };
  }, []);

  return {
    wishes,
    auditLogs,
    loading,
    deleteWish,
    addAuditLog,
  };
}
