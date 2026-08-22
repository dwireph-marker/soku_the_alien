import fs from 'fs';
import path from 'path';

interface MigrationPayload {
  config?: any;
  wishes?: any[];
  auditLogs?: any[];
}

export function loadLocalJsonData(): MigrationPayload | null {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'site_db.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read site_db.json for migration:', err);
  }
  return null;
}

console.log('Migration script helper initialized.');
