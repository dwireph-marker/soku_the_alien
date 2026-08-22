# API SECURITY AUDIT (OWASP API SECURITY TOP 10 - 2023)

## 1. Scope
Every REST endpoint exposed by the Express backend was tested for access control, parameter validation, rate limiting, and response sanitization.

---

## 2. Granular Endpoint Assessment

### 1. `GET /api/health`
* **Purpose**: Container liveness probe.
* **Authentication**: None (Public).
* **Security Controls**: Returns minimal JSON (`{ status: "ok", uptime }`), no server internals or environment vars disclosed.
* **Status**: **SECURE**

### 2. `POST /api/admin/login`
* **Purpose**: Verifies admin token and returns user profile.
* **Authentication**: Firebase ID Token in request body.
* **Security Controls**: Sliding-window rate limiter (`15 req / 15 min`), token verification against Google Identity Toolkit, strict body schema check.
* **Status**: **SECURE**

### 3. `GET /api/upload/imagekit-auth`
* **Purpose**: Generates cryptographic HMAC token for client-side ImageKit uploads.
* **Authentication**: Admin Bearer token required (`authenticateAdmin`).
* **Security Controls**: Private ImageKit secret never leaves backend server; token includes timestamp and randomized UUID.
* **Status**: **SECURE**

### 4. `POST /api/upload/audio`
* **Purpose**: Uploads custom MP3/WAV tracks to local storage.
* **Authentication**: Admin Bearer token required (`authenticateAdmin`).
* **Security Controls**: Upload rate limiter (`30 req / 1 min`), Multer fileFilter, 16-byte magic byte signature verification, 50MB file size limit, sanitized filename.
* **Status**: **SECURE**

### 5. `GET /api/audio/tracks`
* **Purpose**: Lists audio tracks for music player.
* **Authentication**: Public.
* **Security Controls**: Reads pre-sanitized track list from `data/audio_tracks.json`.
* **Status**: **SECURE**

### 6. `DELETE /api/audio/tracks/:id`
* **Purpose**: Deletes an uploaded audio track.
* **Authentication**: Admin Bearer token required (`authenticateAdmin`).
* **Security Controls**: Regex validation on `id` (`/^[a-zA-Z0-9_-]+$/`), directory path containment check (`filePath.startsWith(AUDIO_DIR)`).
* **Status**: **SECURE**

### 7. `POST /api/upload/media`, `POST /api/upload/video`, `POST /api/upload/image`
* **Purpose**: Uploads media files (photos/videos).
* **Authentication**: Admin Bearer token required (`authenticateAdmin`).
* **Security Controls**: Magic byte inspection, SVG disallowed, 100MB file size limit.
* **Status**: **SECURE**

### 8. `GET /api/birthday/settings`
* **Purpose**: Retrieves countdown target date and celebration status.
* **Authentication**: Public.
* **Security Controls**: Returns sanitized datetime configuration.
* **Status**: **SECURE**

### 9. `PUT /api/birthday/settings`
* **Purpose**: Updates birthday datetime and countdown configurations.
* **Authentication**: Admin Bearer token required (`authenticateAdmin`).
* **Security Controls**: Strict field parsing and format validation.
* **Status**: **SECURE**
