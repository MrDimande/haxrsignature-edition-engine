/**
 * Plus Memories — Optimização de Fotografia (client-side)
 *
 * Operações seguras e mensuráveis:
 *  1. Correcção de orientação EXIF
 *  2. Downscale quando a imagem excede 3840px em qualquer dimensão
 *  3. Compressão de alta qualidade (WebP 0.88 ou JPEG 0.90 fallback)
 *
 * Limitações documentadas:
 *  - Funciona apenas para imagens, não vídeos
 *  - Canvas não suporta HEIC/HEIF nativamente em todos os browsers
 *  - Em browsers sem suporte a WebP output, usa JPEG como fallback
 *  - Não altera esteticamente a fotografia — sem filtros, sem IA
 */

const MAX_DIMENSION = 3840;

/**
 * Verifica se o ficheiro é uma imagem elegível para optimização.
 * Vídeos e ficheiros HEIC sem suporte nativo ficam de fora.
 */
export function isEnhanceable(file: File): boolean {
  const type = file.type.toLowerCase();
  // Apenas imagens que o Canvas consegue ler de forma confiável
  return (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp"
  );
}

/**
 * Lê a tag de orientação EXIF de um JPEG.
 * Retorna 1–8 (orientação) ou 1 se não encontrado.
 */
function readExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  // Verificar SOI marker
  if (view.getUint16(0) !== 0xFFD8) return 1;

  let offset = 2;
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset);
    offset += 2;

    if (marker === 0xFFE1) {
      // APP1 (EXIF)
      const length = view.getUint16(offset);
      const exifStart = offset + 2;

      // Check "Exif\0\0"
      if (
        view.getUint32(exifStart) === 0x45786966 &&
        view.getUint16(exifStart + 4) === 0x0000
      ) {
        const tiffStart = exifStart + 6;
        const isLittleEndian = view.getUint16(tiffStart) === 0x4949;

        const ifdOffset = view.getUint32(tiffStart + 4, isLittleEndian);
        const numEntries = view.getUint16(tiffStart + ifdOffset, isLittleEndian);

        for (let i = 0; i < numEntries; i++) {
          const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) break;
          const tag = view.getUint16(entryOffset, isLittleEndian);
          if (tag === 0x0112) {
            // Orientation tag
            return view.getUint16(entryOffset + 8, isLittleEndian);
          }
        }
      }
      offset += length - 2;
    } else if ((marker & 0xFF00) === 0xFF00) {
      // Skip other markers
      if (marker === 0xFFDA) break; // Start of scan — stop
      const length = view.getUint16(offset);
      offset += length;
    } else {
      break;
    }
  }

  return 1;
}

/**
 * Aplica rotação/flip com base na orientação EXIF.
 */
function applyExifTransform(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number
): void {
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, height, width); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
    default: break; // orientation 1 = normal
  }
}

/**
 * Verifica se o browser suporta exportar WebP via Canvas.
 */
function supportsWebPExport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

/**
 * Optimiza uma fotografia antes do upload.
 *
 * Retorna um novo File optimizado, ou o ficheiro original
 * se a optimização falhar ou não for aplicável.
 */
export async function optimizePhoto(file: File): Promise<File> {
  if (!isEnhanceable(file)) return file;

  try {
    const buffer = await file.arrayBuffer();
    const orientation = readExifOrientation(buffer);

    const bitmap = await createImageBitmap(new Blob([buffer], { type: file.type }));
    const origW = bitmap.width;
    const origH = bitmap.height;

    // Determinar se orientação troca largura/altura
    const swapDimensions = orientation >= 5 && orientation <= 8;
    const sourceW = swapDimensions ? origH : origW;
    const sourceH = swapDimensions ? origW : origH;

    // Calcular dimensões de saída (downscale se necessário)
    let outW = sourceW;
    let outH = sourceH;
    if (outW > MAX_DIMENSION || outH > MAX_DIMENSION) {
      const scale = Math.min(MAX_DIMENSION / outW, MAX_DIMENSION / outH);
      outW = Math.round(outW * scale);
      outH = Math.round(outH * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Aplicar transformação EXIF
    if (orientation !== 1) {
      applyExifTransform(ctx, orientation, outW, outH);
    }

    // Desenhar imagem (resize feito automaticamente pelo drawImage)
    ctx.drawImage(bitmap, 0, 0, origW, origH, 0, 0, swapDimensions ? outH : outW, swapDimensions ? outW : outH);
    bitmap.close();

    // Exportar — WebP preferencial, JPEG fallback
    const useWebP = supportsWebPExport();
    const outputType = useWebP ? "image/webp" : "image/jpeg";
    const quality = useWebP ? 0.88 : 0.90;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (!blob || blob.size >= file.size) {
      // Se a optimização não reduziu o tamanho, manter original
      return file;
    }

    const ext = useWebP ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.${ext}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("[PlusMemories] Image optimization failed, using original:", error);
    return file;
  }
}
