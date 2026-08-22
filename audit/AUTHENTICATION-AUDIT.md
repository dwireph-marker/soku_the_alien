# AUTHENTICATION SECURITY AUDIT

## 1. Scope & Mechanism
The application utilizes **Firebase Authentication** on the client side (Email/Password) coupled with server-side validation using the Google Identity Toolkit REST API (`accounts:lookup`).

## 2. Test Execution & Findings

| Test Case | Payload / Method | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|
| **Empty Credentials** | `{ "idToken": "" }` | 400 Bad Request | 400 Bad Request | **PASS** |
| **Malformed Token** | `{ "idToken": "invalid.jwt.blob" }` | 401 Unauthorized | 401 Unauthorized | **PASS** |
| **Expired Token** | Expired Firebase ID token | 401 Unauthorized | 401 Unauthorized | **PASS** |
| **Token from Foreign Project** | Token issued for distinct GCP Project ID | 401 Unauthorized / 403 Forbidden | 401/403 Rejected | **PASS** |
| **Non-Admin User Token** | Valid token from non-admin account | 403 Forbidden (when `FIREBASE_ADMIN_UID` set) | 403 Forbidden | **PASS** |
| **Brute-Force Attack** | 20 rapid login attempts | 429 Rate Limit Exceeded | 429 Too Many Requests | **PASS** |
| **Timing Attack on Token** | Measure lookup response delta | Constant failure time | Verified resilient | **PASS** |
| **Unicode / Special Characters** | Fuzzed inputs in token fields | 400 / 401 Graceful error | No crash / handled | **PASS** |

## 3. Defense Verification
* Server does not accept password credentials directly on custom routes; authentication relies on cryptographic Firebase ID tokens verified against Google Identity Toolkit.
* Admin UID pinning via `FIREBASE_ADMIN_UID` ensures that even authenticated users cannot elevate privileges unless their UID matches the administrator record.
