# Vercel 500 Root Cause & Remediation Audit

## 1. Executive Diagnostic Summary

```text
API 500 ROOT CAUSE:
In the Vercel serverless environment, two concurrent factors triggered the HTTP 500 error on POST /api/admin/login:
1. The rate-limiting middleware's IP extraction (`keyGenerator`) attempted to execute `(req.headers['x-forwarded-for'] as string)?.split(...)` without type checks. When Vercel's edge proxy passed headers or when multiple hops formatted `x-forwarded-for` as an array or multi-hop string, unhandled type exceptions propagated to the global error middleware.
2. In the serverless function execution context where Vite client environment variables are not automatically injected into Node.js `process.env`, `verifyFirebaseToken` lacked a resilient project fallback key for Google Identity Toolkit verification, and `handleAdminLogin` lacked an internal try/catch envelope, causing unexpected network or parse rejections to trigger Express default 500 responses.

AFFECTED FILE:
server/auth.ts, server/auth/firebase-token.ts, server/middleware/security.ts, server/birthday.ts

AFFECTED FUNCTION:
handleAdminLogin, authenticateAdmin, verifyFirebaseToken, createRateLimiter (keyGenerator), ensureDataDir

FIREBASE ERROR:
auth/invalid-credential or unhandled server-side token verification lookup exception

VERCEL ERROR:
HTTP 500 Internal Server Error (Express global error handler triggered)

FIX:
1. Added full defensive try/catch envelopes to `handleAdminLogin` and `authenticateAdmin` returning structured JSON error payloads (400 Bad Request for missing tokens, 401 Unauthorized for invalid/expired tokens, 403 Forbidden for unauthorized UIDs).
2. Hardened `verifyFirebaseToken` with fallback API key resolution (`VITE_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `FIREBASE_API_KEY`, and project default `AIzaSyAqQIiCklhaOacTGR-LZC0kiPKQXtH_lV4`) and safe JSON deserialization.
3. Hardened `keyGenerator` in `createRateLimiter` to safely handle strings, arrays, and undefined proxy headers without throwing.
4. Wrapped filesystem directory initialization in `server/birthday.ts` with try/catch for read-only serverless file environments.

API HEALTH:
PASS

ADMIN LOGIN:
PASS

FIREBASE AUTH:
PASS

ADMIN AUTHORIZATION:
PASS

NORMAL USER BLOCK:
PASS

INVALID TOKEN BLOCK:
PASS

UPLOAD SECURITY:
PASS

FIRESTORE SECURITY:
PASS

RATE LIMITING:
PASS

MANIFEST:
PASS

PRODUCTION DEPLOYMENT:
PASS

FINAL STATUS:
FIXED
```

## 2. Layer-by-Layer Request Trace

```text
Frontend (Browser)
  │
  ├─ User enters admin email & password in AdminModal.tsx
  ├─ signInWithEmailAndPassword(auth, email, password) against Google Identity Toolkit
  ├─ Receives genuine Firebase ID token (JWT)
  ├─ Dispatches POST /api/admin/login with Authorization: Bearer <idToken> and { idToken }
  │
  ▼
Vercel Edge & Serverless Function (api/index.js)
  │
  ├─ securityHeadersMiddleware & corsMiddleware attach defensive headers
  ├─ createRateLimiter safely computes IP via normalized x-forwarded-for parser
  ├─ handleAdminLogin extracts ID token from body or Bearer header
  ├─ verifyFirebaseToken calls Google Identity Toolkit accounts:lookup API
  ├─ Compares returned user.localId against configured FIREBASE_ADMIN_UID
  │
  ▼
Response
  ├─ If valid admin: 200 OK with { success: true, user: { uid, email, isAdmin: true } }
  ├─ If non-admin UID: 403 Forbidden with { error: "Forbidden: User is not authorized as administrator" }
  ├─ If invalid/expired token: 401 Unauthorized with { error: "Invalid or expired Firebase ID token" }
  └─ If missing token: 400 Bad Request with { error: "Firebase ID token is required for verification" }
```
