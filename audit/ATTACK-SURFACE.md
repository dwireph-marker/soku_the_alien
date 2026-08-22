# ATTACK SURFACE INVENTORY

## 1. Overview & Architecture
* **Application Type**: Single Page Application (React 19 + TypeScript + Tailwind CSS) with an integrated Node.js Express 4 Backend Server.
* **Database & Auth**: Cloud Firestore (NoSQL) & Firebase Authentication (Email/Password + ID Tokens).
* **Media & File Storage**: Local filesystem (`/data/uploads/audio`, `/data/uploads/images`, `/data/uploads/videos`) + Optional ImageKit Cloud API CDN.
* **Ingress Port**: Container port `3000` (Reverse-proxied via NGINX).

---

## 2. Inventory Breakdown

### A. Frontend Routes & Views
1. `/` (Default view): Romantic Birthday celebration site (Hero countdown, interactive cake, photo marquee, memories deck, love letters, music audio player, interactive games, wish submission).
2. `/#admin` or `/admin`: Administrative Dashboard & Control Center (Site settings, Birthday datetime, Memories management, Love reasons, Vouchers, Music & sound effects, Celebration controls, Wish management, Audit logs, Exam arena controls).

### B. Backend API Endpoints
| HTTP Method | Route | Auth Required | Purpose |
|-------------|-------|---------------|---------|
| `GET` | `/api/health` | No | Server health check |
| `POST` | `/api/admin/login` | No (Rate-Limited) | Firebase ID token verification and Admin session issuance |
| `GET` | `/api/upload/imagekit-auth` | Yes (`authenticateAdmin`) | Generates HMAC-SHA1 signature and token for client-side ImageKit uploads |
| `POST` | `/api/upload/audio` | Yes (`authenticateAdmin`, Rate-Limited) | Accepts audio files, validates MIME and magic bytes, stores to disk |
| `GET` | `/api/audio/tracks` | No | Fetches list of uploaded audio soundtrack metadata |
| `DELETE` | `/api/audio/tracks/:id` | Yes (`authenticateAdmin`) | Deletes audio track metadata and unlinks disk file safely |
| `POST` | `/api/upload/media` | Yes (`authenticateAdmin`, Rate-Limited) | Batch upload for images and videos |
| `POST` | `/api/upload/video` | Yes (`authenticateAdmin`, Rate-Limited) | Single video upload |
| `POST` | `/api/upload/image` | Yes (`authenticateAdmin`, Rate-Limited) | Single image upload |
| `GET` | `/api/birthday/settings` | No | Fetches current birthday countdown date, time, and recurrence |
| `PUT` | `/api/birthday/settings` | Yes (`authenticateAdmin`) | Updates birthday date, time, timezone, and countdown configuration |
| `*` | `/uploads/*` | Static file serving | Serves uploaded audio, images, and videos with hardened headers |

### C. Middlewares
1. `securityHeadersMiddleware`: Content-Security-Policy (CSP), X-Content-Type-Options (nosniff), X-Frame-Options (SAMEORIGIN), Permissions-Policy, Referrer-Policy, Cross-Origin-Opener-Policy, header stripping (`X-Powered-By`).
2. `corsMiddleware`: Validates origin, sets `Access-Control-Allow-*` headers, handles `OPTIONS` preflight requests.
3. `loginRateLimiter`: 15 requests per 15-minute sliding window.
4. `uploadRateLimiter`: 30 requests per 1-minute sliding window.
5. `apiRateLimiter`: 180 requests per 1-minute sliding window.
6. `authenticateAdmin`: Extracts Bearer token from `Authorization` header, verifies with Firebase Auth API, checks configured `FIREBASE_ADMIN_UID`.
7. `optionalAdmin`: Soft auth check for permissive administrative context.
8. Multer Middleware: `uploadAudioMiddleware`, `uploadMediaMiddleware` with filesize limits (50MB/100MB) and strict file extensions & MIME filters.

### D. Firestore Collections
1. `siteSettings`: App titles, names, theme settings. (Read: Public; Write: Admin).
2. `celebration`: Celebration triggers, confetti, sound effects. (Read: Public; Write: Admin).
3. `music`: Background soundtrack config, volume, active track ID. (Read: Public; Write: Admin).
4. `treasureHuntSettings`: Interactive game settings. (Read: Public; Write: Admin).
5. `treasureHuntStats`: Aggregate game analytics. (Read: Public; Write: Schema-restricted keys).
6. `treasureHuntTemplates`: Game clue templates. (Read: Public; Write: Admin).
7. `treasureHuntInstances`: Active/completed game sessions. (Read: Public; Create/Update: Validated status & templateId; Delete: Admin).
8. `memories`: Birthday photo cards with captions and dates. (Read: Public; Write: Admin).
9. `loveReasons`: Romantic cards with text and icons. (Read: Public; Write: Admin).
10. `vouchers`: Birthday gift coupons. (Read: Public; Write: Admin).
11. `wishes`: Visitor birthday wishes and messages. (Create: Public with string/length validation; Read/Update/Delete: Admin).
12. `auditLogs`: Administrative operation logs. (Read/Write: Admin).
13. `appPreferences`: Client local UI preference synchronization. (Read/Write: Schema-restricted keys).
14. `examArena`: Quiz challenge questions & user progress. (Read: Public; Write: Admin or progress doc).

### E. Client Storage & Secrets
* **LocalStorage**: `admin_token`, `admin_session`, `audio_muted_pref`, `romantic_theme_pref`.
* **Server-side Filesystem Operations**:
  * `data/birthday-settings.json` (Read/Write)
  * `data/audio_tracks.json` (Read/Write)
  * `data/uploads/audio/*` (Read/Write/Delete)
  * `data/uploads/images/*` (Read/Write)
  * `data/uploads/videos/*` (Read/Write)
* **Environment Variables**:
  * `FIREBASE_ADMIN_UID` (Server only)
  * `IMAGEKIT_PRIVATE_KEY` (Server only)
  * `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_URL_ENDPOINT` (Public/Server)
  * `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (Client Firebase config)
