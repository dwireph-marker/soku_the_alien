import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase/client';

export { auth };

export async function loginAdmin(email: string, pass: string): Promise<{ uid: string; email: string; token: string }> {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const idToken = await userCredential.user.getIdToken(true);

  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Authorization failed' }));
    await firebaseSignOut(auth).catch(() => {});
    throw new Error(errData.error || 'User authorization failed.');
  }

  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email || email,
    token: idToken,
  };
}

export async function logoutAdmin(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth).catch(() => {});
  }
}
