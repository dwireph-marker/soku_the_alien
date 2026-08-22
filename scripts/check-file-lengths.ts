import fs from 'fs';
import path from 'path';

const MAX_LINES = 300;
const DIRS_TO_CHECK = ['src', 'server'];

function getFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

let failed = false;
let totalChecked = 0;
let failingFiles: { file: string; lines: number }[] = [];

for (const dir of DIRS_TO_CHECK) {
  const files = getFiles(dir);
  for (const file of files) {
    totalChecked++;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    if (lines > MAX_LINES) {
      failingFiles.push({ file, lines });
      failed = true;
    }
  }
}

if (failed) {
  console.error(`\n❌ Line count check failed! ${failingFiles.length} file(s) exceed ${MAX_LINES} lines:\n`);
  for (const item of failingFiles) {
    console.error(`  - ${item.file}: ${item.lines} lines (max: ${MAX_LINES})`);
  }
  process.exit(1);
} else {
  console.log(`\n✓ File length check passed`);
  console.log(`✓ 0 files exceed ${MAX_LINES} lines (checked ${totalChecked} files)\n`);
}
