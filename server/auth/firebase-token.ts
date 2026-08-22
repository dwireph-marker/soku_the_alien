import 'dotenv/config';

export interface AuthenticatedFirebaseUser {
  uid: string;
  email?: string;
}

const DEFAULT_FIREBASE_API_KEY = 'AIzaSyAqQIiCklhaOacTGR-LZC0kiPKQXtH_lV4';

export async function verifyFirebaseToken(idToken: string): Promise<AuthenticatedFirebaseUser | null> {
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    return null;
  }

  const cleanToken = idToken.trim();

  const apiKey =
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    DEFAULT_FIREBASE_API_KEY;

  if (!apiKey) {
    console.warn('[Auth] Firebase API key is missing on server for token verification.');
    return null;
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: cleanToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json().catch(() => null);
    if (data && Array.isArray(data.users) && data.users.length > 0) {
      const user = data.users[0];
      if (user && user.localId) {
        return {
          uid: user.localId,
          email: user.email,
        };
      }
    }
  } catch (err: any) {
    console.warn('[Auth] Safe token lookup note:', err?.message || 'Token validation error');
  }

  return null;
}
