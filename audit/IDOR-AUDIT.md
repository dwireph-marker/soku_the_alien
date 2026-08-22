# INSECURE DIRECT OBJECT REFERENCE (IDOR) AUDIT

## 1. Parameter Inspection
All endpoints accepting object identifiers (`:id`, `trackId`, `docId`, `fileId`) were audited:
* `DELETE /api/audio/tracks/:id`
* Firestore documents: `/memories/{id}`, `/vouchers/{id}`, `/loveReasons/{id}`, `/wishes/{id}`

## 2. Test Execution
1. **Manipulating Track IDs in Audio Deletion**:
   * Tested IDs: `track_nonexistent`, `../`, `../../data/birthday-settings.json`, `special_chars$#@!`.
   * Result: Validated with regex `/^[a-zA-Z0-9_-]+$/`. Non-matching IDs receive `400 Bad Request`. Matching non-existent IDs cleanly return updated metadata without crashing or deleting unrelated files.
2. **Manipulating Firestore Document IDs**:
   * Attempted deleting admin documents (e.g. `wishes/other_wish_id`) using an unauthenticated client.
   * Result: Blocked with Firestore `permission-denied` error.

## 3. IDOR Verdict
No Insecure Direct Object References or Broken Object Level Authorization vulnerabilities detected.
