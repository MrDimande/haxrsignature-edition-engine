import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const TARGET_URL = 'https://edition.haxrsignature.com/stanturns5/memorias?link=stan-matchday';
const OUTPUT_DIR = path.resolve('public/images/stan');

async function generateQrAssets() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const svgPath = path.join(OUTPUT_DIR, 'qr-stan-matchday.svg');
  const pngPath = path.join(OUTPUT_DIR, 'qr-stan-matchday.png');

  // 1. Gerar SVG Puro com Estética Real Madrid Matchday (Deep Navy em Fundo Marfim / Branco)
  const svgContent = await QRCode.toString(TARGET_URL, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0A1628',   // Deep Navy
      light: '#F7F4EF',  // Stanley Ivory
    },
  });

  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log(`[QR Generator] SVG salvo com sucesso em: ${svgPath} (${svgContent.length} bytes)`);

  // 2. Gerar PNG de Alta Resolução para Impressão e Display (1200x1200px)
  await QRCode.toFile(pngPath, TARGET_URL, {
    type: 'png',
    width: 1200,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0A1628',
      light: '#F7F4EF',
    },
  });

  const pngStats = fs.statSync(pngPath);
  console.log(`[QR Generator] PNG de alta resolução (1200px) salvo em: ${pngPath} (${pngStats.size} bytes)`);
  console.log(`[QR Generator] URL canónica codificada: ${TARGET_URL}`);
}

generateQrAssets().catch((err) => {
  console.error('[QR Generator] Erro ao gerar QR Code:', err);
  process.exit(1);
});
