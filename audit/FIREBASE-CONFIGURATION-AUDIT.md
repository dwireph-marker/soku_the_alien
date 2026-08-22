# Firebase Configuration & Provider Audit

## 1. Project Consistency Check

All frontend and server configurations were verified to ensure they point consistently to the same production Firebase project:

- **Firebase Project ID**: `dwireph-7b015`
- **Auth Domain**: `dwireph-7b015.firebaseapp.com`
- **Storage Bucket**: `dwireph-7b015.firebasestorage.app`
- **Messaging Sender ID**: `407812524785`
- **Web App ID**: `1:407812524785:web:0a3d018b96a287cbb17750`
- **API Key Status**: Active and permitted for Google Identity Toolkit API

## 2. Authentication Provider & Sign-in Method
- **Email/Password**: Configured as the primary authentication provider.
- **Authorized Domains**: `localhost`, `dwireph-7b015.firebaseapp.com`, and production Vercel deployment domains.
- **Identity Toolkit API**: Enabled and accessible without IP restriction blocking serverless callers.

## 3. Server-Side Token Verification
- Handled in `server/auth/firebase-token.ts` via Google Identity Toolkit `accounts:lookup` endpoint.
- Verifies that tokens are issued specifically for the target Firebase project and are not expired.
- Strictly validates administrator identity against `FIREBASE_ADMIN_UID`.

## 4. Frontend Compilation Integrity
- Production bundles in `dist/` embed the correct `VITE_FIREBASE_*` variables at compile time.
- No development-only mock credentials or fallback dummy users exist in the build output.
