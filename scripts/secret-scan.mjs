import fs from "node:fs";
import path from "node:path";

const ignored = new Set(["node_modules", ".git", ".next"]);
const allowedExtensions = /\.(ts|tsx|js|mjs|md|env\.example)$/;
const secretPatterns = [
  /sk_(?:live|test)_[A-Za-z0-9]{16,}/,
  /re_[A-Za-z0-9]{20,}/,
  /eyJ[A-Za-z0-9_-]{80,}\.[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{40,}/,
];

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(target, files);
    } else if (allowedExtensions.test(entry.name)) {
      files.push(target);
    }
  }
  return files;
}

const hits = [];
for (const file of walk(".")) {
  if (file.endsWith(path.join("scripts", "secret-scan.mjs"))) continue;
  const contents = fs.readFileSync(file, "utf8");
  if (secretPatterns.some((pattern) => pattern.test(contents))) {
    hits.push(file);
  }
}

if (hits.length > 0) {
  console.error("SECRET SCAN FAIL", hits);
  process.exit(1);
}

console.log("secret-scan ok");
