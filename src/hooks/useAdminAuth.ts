import { useState, useEffect, useCallback } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase/client';
import { loginAdmin, logoutAdmin } from '../lib/firebase';

export interface AdminAuthState {
  user: User | null;
  uid: string | null;
  email: string | null;
  token: string | null;
  isAuthenticated: boolean;
  authInitializing: boolean;
}

export function useAdminAuth() {
  const [authState, setAuthState] = useState<AdminAuthState>(() => {
    const currentUser = auth?.currentUser || null;
    return {
      user: currentUser,
      uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      token: null,
      isAuthenticated: !!currentUser,
      authInitializing: true,
    };
  });

  useEffect(() => {
    if (!auth) {
      setAuthState({
        user: null,
        uid: null,
        email: null,
        token: null,
        isAuthenticated: false,
        authInitializing: false,
      });
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setAuthState({
            user: firebaseUser,
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'admin@birthday.site',
            token: idToken,
            isAuthenticated: true,
            authInitializing: false,
          });
        } catch (err) {
          console.warn('[AdminAuth] Error retrieving Firebase ID token:', err);
          setAuthState({
            user: firebaseUser,
            uid: firebaseUser.uid,
            email: firebaseUser.email || null,
            token: null,
            isAuthenticated: false,
            authInitializing: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          uid: null,
          email: null,
          token: null,
          isAuthenticated: false,
          authInitializing: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const result = await loginAdmin(email, pass);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setAuthState({
      user: null,
      uid: null,
      email: null,
      token: null,
      isAuthenticated: false,
      authInitializing: false,
    });
  }, []);

  const getToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (auth?.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken(forceRefresh);
        return idToken;
      } catch (err) {
        console.warn('[AdminAuth] Error fetching fresh ID token:', err);
      }
    }
    return authState.token;
  }, [authState.token]);

  return {
    ...authState,
    login,
    logout,
    getToken,
  };
}

export async function getActiveFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  if (auth?.currentUser) {
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch {
      return null;
    }
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token') || null;
  }
  return null;
}
