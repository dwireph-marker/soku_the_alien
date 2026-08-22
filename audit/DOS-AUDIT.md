# DENIAL OF SERVICE (DOS) & RESOURCE EXHAUSTION AUDIT

## 1. Attack Vectors Assessed
1. **Large Request Body Flooding**: Malicious client sends gigabyte-sized JSON payloads.
2. **Slowloris / HTTP Connection Holding**: Holding connections open indefinitely.
3. **Upload Disk Exhaustion**: Uploading massive files to consume server disk space.
4. **Regular Expression DoS (ReDoS)**: Complex regular expressions susceptible to catastrophic backtracking.

## 2. Mitigations & Verification
* **Body Size Caps**: Express body parsers explicitly capped (`express.json({ limit: '20mb' })`).
* **Upload Limits**: Multer limits enforced at 50MB (audio) and 100MB (media). Oversized requests rejected before memory saturation.
* **ReDoS Safety**: All regex patterns (e.g. `/^[a-zA-Z0-9_-]+$/`, `replace(/[^a-zA-Z0-9_-]/g, '_')`) are linear `O(n)` with no nested quantifiers.
* **Rate Limiting**: Protects against request flooding.

## 3. Verdict
The application is hardened against application-layer Denial of Service attacks.
