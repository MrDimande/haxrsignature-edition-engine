import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.vercel',
  'coverage',
  '.gemini',
  'dist'
]);

function scanDir(dir, envVars) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, envVars);
    } else if (entry.isFile() && /\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
      // Exclude scratch scripts if desired or include them
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.matchAll(/process\.env\.([A-Za-z0-9_]+)/g);
      for (const m of matches) {
        const varName = m[1];
        if (!envVars[varName]) {
          envVars[varName] = new Set();
        }
        envVars[varName].add(fullPath.replace(/\\/g, '/'));
      }
    }
  }
}

const envVars = {};
scanDir('.', envVars);

console.log(`Found ${Object.keys(envVars).length} distinct process.env variables:`);
for (const [k, files] of Object.entries(envVars).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`- ${k} (used in ${files.size} files, e.g. ${Array.from(files)[0]})`);
}
