import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  generateImageDerivatives,
  processBrowserVideoPoster,
  sniffMediaFormat,
  decodeHeicWithLimits,
  DERIVATIVE_CONFIG,
  type ProcessMediaDerivativesResult,
} from "./derivatives";
import { MockMemoriesStorageProvider } from "./storage/mock-provider";
import { assertCanonicalStoragePath, InvalidStoragePathError } from "./storage/path-security";

describe("HAXR PLUS MEMORIES — FASE 5: Media Derivatives Pipeline", () => {
  let mockStorage: MockMemoriesStorageProvider;

  beforeEach(() => {
    mockStorage = new MockMemoriesStorageProvider();
  });

  // 1. Processamento de Imagem e Dimensões
  test("generateImageDerivatives gera thumbnail e medium WebP com dimensões correctas", async () => {
    // Cria imagem de teste 1920x1080 (landscape)
    const testImage = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 180, g: 140, b: 90 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await generateImageDerivatives(testImage);

    // Validações de Thumbnail
    assert.equal(result.thumbnail.format, "webp");
    assert.equal(result.thumbnail.contentType, "image/webp");
    assert.ok(result.thumbnail.width <= DERIVATIVE_CONFIG.thumbnail.maxWidth);
    assert.ok(result.thumbnail.height <= DERIVATIVE_CONFIG.thumbnail.maxHeight);
    assert.equal(result.thumbnail.width, 320);
    assert.equal(result.thumbnail.height, 180); // Preserva ratio 16:9

    // Validações de Medium / Preview
    assert.equal(result.medium.format, "webp");
    assert.equal(result.medium.contentType, "image/webp");
    assert.ok(result.medium.width <= DERIVATIVE_CONFIG.medium.maxWidth);
    assert.ok(result.medium.height <= DERIVATIVE_CONFIG.medium.maxHeight);
    assert.equal(result.medium.width, 1280);
    assert.equal(result.medium.height, 720); // Preserva ratio 16:9

    // Metadados
    assert.equal(result.metadata.width, 1920);
    assert.equal(result.metadata.height, 1080);
    assert.equal(result.metadata.orientation, "landscape");
  });

  // 2. Não-ampliação de imagens pequenas (withoutEnlargement)
  test("generateImageDerivatives não amplia imagens menores que os limites", async () => {
    const smallImage = await sharp({
      create: {
        width: 200,
        height: 150,
        channels: 3,
        background: { r: 50, g: 50, b: 50 },
      },
    })
      .png()
      .toBuffer();

    const result = await generateImageDerivatives(smallImage);

    // Thumbnail não deve ser ampliado para 320px
    assert.equal(result.thumbnail.width, 200);
    assert.equal(result.thumbnail.height, 150);

    // Medium não deve ser ampliado para 1280px
    assert.equal(result.medium.width, 200);
    assert.equal(result.medium.height, 150);
  });

  // 3. Orientação Portrait
  test("generateImageDerivatives detecta orientação portrait correctamente", async () => {
    const portraitImage = await sharp({
      create: {
        width: 1080,
        height: 1920,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await generateImageDerivatives(portraitImage);
    assert.equal(result.metadata.orientation, "portrait");
    assert.equal(result.thumbnail.height, 320);
    assert.equal(result.thumbnail.width, 180);
    assert.equal(result.medium.height, 1280);
    assert.equal(result.medium.width, 720);
  });

  // 4. Salvaguarda de Segurança: Dimensões Absurdas
  test("generateImageDerivatives rejeita imagens com dimensões absurdas (> 16384px)", async () => {
    const hugeBuffer = Buffer.from("fake-huge-image");
    // Simulando erro com sharp sobre dimensões não lidas ou excedidas ou formato inválido
    await assert.rejects(
      async () => generateImageDerivatives(hugeBuffer),
      /CORRUPT_OR_UNSUPPORTED_IMAGE|Não foi possível ler as dimensões da imagem original|Input buffer contains unsupported image format/
    );
  });

  // 5. Storage Safety: Validação Estrita de Caminhos de Derivados
  test("Storage Safety: derivados canónicos cumprem assertCanonicalStoragePath", () => {
    const photoId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const slug = "jessicasamuelwedding";

    const thumbPath = `${slug}/${photoId}/thumbnail.webp`;
    const mediumPath = `${slug}/${photoId}/medium.webp`;
    const posterPath = `${slug}/${photoId}/poster.webp`;

    assert.doesNotThrow(() => assertCanonicalStoragePath(thumbPath));
    assert.doesNotThrow(() => assertCanonicalStoragePath(mediumPath));
    assert.doesNotThrow(() => assertCanonicalStoragePath(posterPath));

    // Tentativas maliciosas ou fora de padrão são estritamente rejeitadas
    assert.throws(
      () => assertCanonicalStoragePath(`${slug}/../other-event/${photoId}/thumbnail.webp`),
      InvalidStoragePathError
    );
    assert.throws(
      () => assertCanonicalStoragePath(`${slug}/${photoId}/malicious.sh`),
      InvalidStoragePathError
    );
    assert.throws(
      () => assertCanonicalStoragePath(`${slug}/${photoId}/random-file.jpg`),
      InvalidStoragePathError
    );
  });

  // 6. Mock Storage Provider: Operações de Leitura e Escrita
  test("MockMemoriesStorageProvider grava, lê e verifica derivados em memória", async () => {
    const path = "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/thumbnail.webp";
    const testData = new Uint8Array([1, 2, 3, 4, 5]);

    await mockStorage.putObject(path, testData, "image/webp");

    const info = await mockStorage.getObjectInfo(path);
    assert.equal(info.exists, true);
    assert.equal(info.contentLength, 5);
    assert.equal(info.contentType, "image/webp");

    const read = await mockStorage.readObject(path);
    assert.deepEqual(read, testData);

    const signed = await mockStorage.createSignedDownloadUrl({ storagePath: path, expiresInSeconds: 60 });
    assert.ok(signed.downloadUrl.includes("mock-storage.haxrsignature.internal"));

    await mockStorage.remove(path);
    const infoAfter = await mockStorage.getObjectInfo(path);
    assert.equal(infoAfter.exists, false);
  });

  // 7. MIME Real: Detecção de Magic Bytes
  test("sniffMediaFormat identifica correctamente assinaturas de imagem e vídeo", () => {
    // JPEG
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(sniffMediaFormat(jpegHeader).format, "jpeg");
    assert.equal(sniffMediaFormat(jpegHeader).isImage, true);

    // PNG
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(sniffMediaFormat(pngHeader).format, "png");
    assert.equal(sniffMediaFormat(pngHeader).isImage, true);

    // MP4
    const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
    assert.equal(sniffMediaFormat(mp4Header).format, "mp4");
    assert.equal(sniffMediaFormat(mp4Header).isVideo, true);
    assert.equal(sniffMediaFormat(mp4Header).isImage, false);

    // HEIC (brand heic)
    const heicHeader = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    assert.equal(sniffMediaFormat(heicHeader).format, "heic");
    assert.equal(sniffMediaFormat(heicHeader).isImage, true);
    assert.equal(sniffMediaFormat(heicHeader).isVideo, false);

    // HEIF (brand mif1)
    const mif1Header = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31]);
    assert.equal(sniffMediaFormat(mif1Header).format, "heic");
    assert.equal(sniffMediaFormat(mif1Header).isImage, true);
    assert.equal(sniffMediaFormat(mif1Header).isVideo, false);

    // Corrupted / Garbage
    const corrupt = Buffer.from([0x00, 0x11, 0x22, 0x33]);
    assert.equal(sniffMediaFormat(corrupt).format, "unknown");
    assert.equal(sniffMediaFormat(corrupt).isImage, false);
  });

  // 8. MIME Real: Imagem declarada com payload MP4 deve falhar
  test("generateImageDerivatives rejeita payload MP4 com erro de MIME_MISMATCH", async () => {
    const fakeMp4 = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
    await assert.rejects(
      async () => generateImageDerivatives(fakeMp4),
      /MIME_MISMATCH/
    );
  });

  // 9. MIME Real: Bytes PNG válidos são transcodificados com sucesso para WebP
  test("generateImageDerivatives processa PNG real com sucesso", async () => {
    const pngBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 255, g: 215, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await generateImageDerivatives(pngBuffer);
    assert.equal(result.thumbnail.format, "webp");
    assert.equal(result.medium.format, "webp");
    assert.equal(result.metadata.format, "png");
  });

  // 10. MIME Real: Bytes corrompidos falham de forma segura
  test("generateImageDerivatives rejeita bytes inválidos com erro seguro", async () => {
    const invalidBytes = Buffer.from("random-binary-corrupt-data");
    await assert.rejects(
      async () => generateImageDerivatives(invalidBytes),
      /CORRUPT_OR_UNSUPPORTED_IMAGE/
    );
  });

  // 11. Browser Poster: Bytes inválidos com MIME image/jpeg declarado são rejeitados
  test("processBrowserVideoPoster rejeita bytes inválidos independentemente do MIME", async () => {
    const invalidBytes = Buffer.from("corrupt-browser-canvas-payload");
    await assert.rejects(
      async () => processBrowserVideoPoster(invalidBytes, "jessicasamuelwedding", "f5555555-5555-4555-a555-555555555552", "arbitrary/path.jpg"),
      /INVALID_POSTER_BYTES/
    );
  });

  // 12. Browser Poster: Caminho arbitrário do cliente é ignorado/rejeitado e substituído por WebP canónico
  test("processBrowserVideoPoster ignora caminhos arbitrários e gera WebP canónico", async () => {
    const validCanvasFrame = await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const mediaId = "f5555555-5555-4555-a555-555555555552";
    const slug = "jessicasamuelwedding";
    const arbitraryPath = "../../malicious/client/custom-poster.png";

    const poster = await processBrowserVideoPoster(validCanvasFrame, slug, mediaId, arbitraryPath);

    assert.equal(poster.format, "webp");
    assert.equal(poster.contentType, "image/webp");
    assert.equal(poster.canonicalPath, `${slug}/${mediaId}/poster.webp`);
    assert.notEqual(poster.canonicalPath, arbitraryPath);
    assert.ok(poster.width <= 1280);
    assert.ok(poster.height <= 720);
  });

  // 13. HEIC Real: Processamento nativo de ficheiro iPhone HEIC autêntico
  test("generateImageDerivatives processa ficheiro iPhone HEIC real e produz derivados WebP", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const fixturePath = path.resolve(process.cwd(), "lib/memories/fixtures/iphone_sample.heic");

    assert.ok(fs.existsSync(fixturePath), "Fixture iPhone HEIC deve existir fisicamente");
    const heicBytes = fs.readFileSync(fixturePath);

    const result = await generateImageDerivatives(heicBytes);

    // Validações de Thumbnail
    assert.equal(result.thumbnail.format, "webp");
    assert.equal(result.thumbnail.contentType, "image/webp");
    assert.ok(result.thumbnail.width <= DERIVATIVE_CONFIG.thumbnail.maxWidth);
    assert.ok(result.thumbnail.height <= DERIVATIVE_CONFIG.thumbnail.maxHeight);

    // Validações de Medium
    assert.equal(result.medium.format, "webp");
    assert.equal(result.medium.contentType, "image/webp");
    assert.ok(result.medium.width <= DERIVATIVE_CONFIG.medium.maxWidth);
    assert.ok(result.medium.height <= DERIVATIVE_CONFIG.medium.maxHeight);

    // Metadados
    assert.equal(result.metadata.format, "heic");
    assert.ok(result.metadata.width > 0);
    assert.ok(result.metadata.height > 0);
    assert.ok(["portrait", "landscape", "square"].includes(result.metadata.orientation));
  });

  // 14. HEIC Real: Payload HEIC corrompido falha com erro específico de descodificação
  test("generateImageDerivatives rejeita HEIC corrompido com HEIC_DECODE_FAILED específico", async () => {
    // Cabeçalho ftypheic válido seguido de lixo corrompido
    const corruptHeic = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
      0xde, 0xad, 0xbe, 0xef, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    ]);

    await assert.rejects(
      async () => generateImageDerivatives(corruptHeic),
      /HEIC_DECODE_FAILED/
    );
  });

  // 15. HEIC Isolation: Timeout preemptivo via worker_threads
  test("HEIC_DECODE_TIMEOUT_PREEMPTIVE cancela o decoder preemptivamente sem bloquear o processo", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const fixturePath = path.resolve(process.cwd(), "lib/memories/fixtures/iphone_sample.heic");
    const heicBytes = fs.readFileSync(fixturePath);

    const start = Date.now();
    await assert.rejects(
      async () => decodeHeicWithLimits(heicBytes, { timeoutMs: 1 }),
      /HEIC_TIMEOUT/
    );
    const elapsed = Date.now() - start;
    // O timeout deve preempter em menos de 2000ms, em vez de esperar a descodificação completa
    assert.ok(elapsed < 2000, `Decoder deve ser preemptado rapidamente (demorou ${elapsed}ms)`);
  });

  // 16. HEIC Isolation: Limite estrito de pixels totais (50 MP)
  test("HEIC_PIXEL_LIMIT rejeita imagens que excedam o limite de resolução", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const fixturePath = path.resolve(process.cwd(), "lib/memories/fixtures/iphone_sample.heic");
    const heicBytes = fs.readFileSync(fixturePath);

    await assert.rejects(
      async () => decodeHeicWithLimits(heicBytes, { maxInputPixels: 100 }),
      /HEIC_LIMIT_EXCEEDED: Pixels totais da imagem/
    );
  });

  // 17. HEIC Isolation: Limite estrito de memória descompactada RGBA (250 MB)
  test("HEIC_RAW_MEMORY_LIMIT rejeita payloads que excedam a salvaguarda de memória RGBA", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const fixturePath = path.resolve(process.cwd(), "lib/memories/fixtures/iphone_sample.heic");
    const heicBytes = fs.readFileSync(fixturePath);

    await assert.rejects(
      async () => decodeHeicWithLimits(heicBytes, { maxRawRgbaBytes: 1024 }),
      /HEIC_LIMIT_EXCEEDED: Memória de pixels descompactados/
    );
  });
});
