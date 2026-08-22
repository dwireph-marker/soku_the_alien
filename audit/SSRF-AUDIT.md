# SERVER-SIDE REQUEST FORGERY (SSRF) AUDIT

## 1. Outbound Network Call Analysis
Every server-side outgoing network interaction was cataloged and reviewed:
1. `server/auth/firebase-token.ts`: Calls Google Identity Toolkit API (`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=...`). URL is hardcoded and cannot be influenced by user parameters.
2. `server/upload-imagekit.ts`: Generates cryptographic authentication signatures for client-side uploads. Does not make outbound HTTP requests.

## 2. Testing
* Tested injecting arbitrary URLs (e.g. `http://169.254.169.254/latest/meta-data/`, `http://localhost:22`) into all API payloads (`/api/birthday/settings`, `/api/upload/*`).
* Result: Server does not fetch external URLs; inputs are strictly stored or checked locally.

## 3. Verdict
**SSRF Risk: ZERO.** No user-controlled outbound HTTP request execution paths exist on the server.
