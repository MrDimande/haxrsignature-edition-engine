/**
 * Patch Next.js 15 font loader to prevent:
 * TypeError: Cannot read properties of null (reading '1')
 * at next/dist/compiled/@next/font/dist/google/loader.js:122:78
 *
 * Root cause: `/\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1]` fails
 * when Google Fonts returns cached or modified URLs with query parameters.
 */
const fs = require('fs');
const path = require('path');

function patchFile() {
  const loaderPath = path.join(
    __dirname,
    '..',
    'node_modules',
    'next',
    'dist',
    'compiled',
    '@next',
    'font',
    'dist',
    'google',
    'loader.js'
  );

  if (!fs.existsSync(loaderPath)) {
    return;
  }

  let content = fs.readFileSync(loaderPath, 'utf8');
  const faultyTarget = 'const ext = /\\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1];';
  const safeReplacement = "const extMatch = /\\.(woff|woff2|eot|ttf|otf)/i.exec(googleFontFileUrl); const ext = extMatch ? extMatch[1] : 'woff2';";

  if (content.includes(faultyTarget)) {
    content = content.replace(faultyTarget, safeReplacement);
    fs.writeFileSync(loaderPath, content, 'utf8');
    console.log('[patch-next-font] Successfully patched @next/font/google loader.');
  }
}

try {
  patchFile();
} catch (err) {
  console.warn('[patch-next-font] Warning: Could not patch next-font loader:', err.message);
}
