# PATH TRAVERSAL PENETRATION TEST

## 1. Targeted Attack Surfaces
* Audio deletion endpoint: `DELETE /api/audio/tracks/:id`
* Static asset routing: `GET /uploads/audio/*`, `GET /uploads/images/*`, `GET /uploads/videos/*`
* Metadata JSON read/write handlers: `data/birthday-settings.json`, `data/audio_tracks.json`

## 2. Test Payloads & Results

| Payload Pattern | Target Endpoint | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| `../../../../etc/passwd` | `DELETE /api/audio/tracks/:id` | 400 Bad Request | 400 Bad Request (Regex filter) | **PASS** |
| `..%2f..%2fpackage.json` | `DELETE /api/audio/tracks/:id` | 400 Bad Request | 400 Bad Request (Regex filter) | **PASS** |
| `/uploads/audio/..%2f..%2fserver.ts` | `GET /uploads/audio/*` | 404 / 403 Access Denied | 404 Not Found (express.static bounds) | **PASS** |
| `..\..\windows\win.ini` | `DELETE /api/audio/tracks/:id` | 400 Bad Request | 400 Bad Request | **PASS** |
| `track_%00_nullbyte` | `DELETE /api/audio/tracks/:id` | 400 Bad Request | 400 Bad Request | **PASS** |

## 3. Defense Verification
1. ID parameter strictly enforces regex `/^[a-zA-Z0-9_-]+$/`.
2. Paths are resolved using `path.resolve()` and tested with `filePath.startsWith(AUDIO_DIR)`.
3. Express static middleware prevents dot-dot jailbreaks.
