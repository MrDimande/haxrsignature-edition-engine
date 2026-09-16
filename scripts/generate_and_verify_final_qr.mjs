import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const BASE_PREVIEW_URL = 'https://projecto-haxrsignature-edition-pvp436ata.vercel.app';
const ARTIFACTS_DIR = 'C:\\Users\\Aldim\\.gemini\\antigravity-ide\\brain\\85f42ef0-7461-442c-b627-1fc0c451fd69';
const PUBLIC_DIR = path.resolve('public/images/stan');

async function runQrGenerationAndVerification() {
  console.log('=== GERAÇÃO & DECODE VERIFICATION DO QR CODE FINAL ===\n');

  if (!fs.existsSync('.stanley_active_token')) {
    throw new Error('Ficheiro .stanley_active_token não encontrado.');
  }

  const activeToken = fs.readFileSync('.stanley_active_token', 'utf8').trim();
  if (!activeToken) {
    throw new Error('Token em .stanley_active_token está vazio.');
  }

  // URL Canónica Oficial apontando para a Deployment Real de Preview Vercel
  const intendedUrl = `${BASE_PREVIEW_URL}/stan-real-madrid/memorias?token=${activeToken}`;

  const svgPath = path.join(PUBLIC_DIR, 'qr-stan-matchday.svg');
  const pngPath = path.join(PUBLIC_DIR, 'qr-stan-matchday.png');

  // 1. Gerar SVG do QR Code
  const svgContent = await QRCode.toString(intendedUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0A1628',   // Deep Navy
      light: '#F7F4EF',  // Ivory
    },
  });
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log(`✔ SVG gerado: ${svgPath} (${svgContent.length} bytes)`);

  // 2. Gerar PNG de Alta Resolução (1200x1200px)
  await QRCode.toFile(pngPath, intendedUrl, {
    type: 'png',
    width: 1200,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0A1628',
      light: '#F7F4EF',
    },
  });
  const pngStat = fs.statSync(pngPath);
  console.log(`✔ PNG gerado: ${pngPath} (${pngStat.size} bytes)`);

  // 3. Copiar para o directório de artefactos
  const artSvg = path.join(ARTIFACTS_DIR, 'qr-stan-matchday.svg');
  const artPng = path.join(ARTIFACTS_DIR, 'qr-stan-matchday.png');
  fs.copyFileSync(svgPath, artSvg);
  fs.copyFileSync(pngPath, artPng);
  console.log(`✔ Activos copiados para artefactos: ${artPng}`);

  // 4. DECODE REAL DO PNG GERADO
  console.log('\n4. Executando Decode Real do PNG gerado:');
  const pngBuffer = fs.readFileSync(pngPath);
  const png = PNG.sync.read(pngBuffer);

  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  if (!decoded) {
    throw new Error('Falha ao decodificar o PNG do QR Code: nenhum código QR detectado.');
  }

  console.log(`✔ QR Code decodificado com sucesso!`);
  console.log(`   - Dimensões da imagem: ${png.width}x${png.height}px`);
  console.log(`   - URL Intencional: ${intendedUrl}`);
  console.log(`   - URL Decodificada: ${decoded.data}`);

  assert.equal(decoded.data, intendedUrl, 'A URL decodificada deve ser estritamente idêntica à URL intencional!');
  console.log('\n====================================================');
  console.log('✔ PROVA MATEMÁTICA: decoded_url === intended_url (100% PASS)');
  console.log('====================================================\n');

  process.exit(0);
}

runQrGenerationAndVerification().catch((err) => {
  console.error('Erro na verificação do QR Code:', err);
  process.exit(1);
});
