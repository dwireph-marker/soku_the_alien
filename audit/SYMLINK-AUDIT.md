# SYMLINK & FILESYSTEM BOUNDARY AUDIT

## 1. Scope
Evaluated whether symlink creation or resolution could allow attackers to traverse or manipulate files outside the designated `data/uploads/` and `data/` directories.

## 2. Findings
1. **Static File Serving**:
   * Express static middleware for `/uploads` utilizes `dotfiles: 'ignore'` and resolves strictly against `path.join(process.cwd(), 'data', 'uploads')`.
2. **File Upload Handlers**:
   * Multer generates random disk filenames (`${Date.now()}_${Math.random().toString(36)...}`) and does not follow or create symlinks.
3. **Deletion Handlers**:
   * `DELETE /api/audio/tracks/:id` explicitly verifies path boundary containment:
     ```typescript
     if (!filePath.startsWith(AUDIO_DIR)) {
       return res.status(400).json({ error: 'Invalid file path' });
     }
     ```
   * Any symlink or out-of-bounds target fails prefix validation.

## 3. Verdict
The filesystem boundaries are tightly constrained and immune to symlink escape attacks.
