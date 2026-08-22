# Authentication Token Verification Audit

## 1. Token Verification Architecture
Authentication in the application follows a strict zero-trust model:
1. **Client-Side Authentication**: The administrator authenticates via Firebase Client SDK (`signInWithEmailAndPassword`).
2. **ID Token Generation**: Upon successful authentication, Firebase client issues a cryptographically signed JWT ID token.
3. **Transmission**: The ID token is transmitted to `/api/admin/login` and subsequent protected endpoints via `Authorization: Bearer <ID_TOKEN>`.
4. **Server-Side Cryptographic Verification**: The backend verifies the token using Google Identity Toolkit's lookup API.
5. **Authorization Enforcement**: After verifying token authenticity, the server compares the token's `localId` (UID) against the authorized `FIREBASE_ADMIN_UID`.

## 2. Token Invariants Tested

- **Missing Token**: `null`, `undefined`, empty string -> **HTTP 401 Unauthorized**.
- **Malformed Token**: Incomplete Base64 JWT or non-JWT string -> **HTTP 401 Unauthorized**.
- **Forged Token**: Manipulated payload or invalid signature -> **HTTP 401 Unauthorized**.
- **Expired Token**: Expired Unix timestamp in `exp` claim -> **HTTP 401 Unauthorized**.
- **Non-Admin User Token**: Valid signature but unauthorized UID -> **HTTP 403 Forbidden**.
- **Authorized Admin User Token**: Valid signature and matching UID -> **HTTP 200 OK**.

## 3. Defense Against Token Leakage
- ID tokens are stored in memory and local session storage without cookie-based exposure.
- Server logs do not output tokens or bearer headers.
- Safe error handling prevents stack traces or error payloads from leaking token contents.
