import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inferMediaType,
  calculateOrientation,
  sanitizeCapturedAt,
  sanitizeDimension,
  sanitizeDuration,
  buildThumbnailStoragePath,
  buildPosterStoragePath,
  resolveDerivativePaths,
} from "./metadata";

describe("HAXR Plus Memories — Media Core Metadata & Derivatives", () => {
  describe("inferMediaType", () => {
    it("deve inferir 'video' a partir de MIME types suportados", () => {
      assert.equal(inferMediaType("video/mp4"), "video");
      assert.equal(inferMediaType("video/quicktime"), "video");
      assert.equal(inferMediaType("video/webm"), "video");
    });

    it("deve inferir 'video' a partir de extensões de ficheiro", () => {
      assert.equal(inferMediaType(undefined, "clip.mp4"), "video");
      assert.equal(inferMediaType(null, "celebration.MOV"), "video");
      assert.equal(inferMediaType("", "dance.webm"), "video");
    });

    it("deve inferir 'image' por omissão e para imagens comuns", () => {
      assert.equal(inferMediaType("image/jpeg", "photo.jpg"), "image");
      assert.equal(inferMediaType("image/png", "bride.png"), "image");
      assert.equal(inferMediaType("image/webp", "decor.webp"), "image");
      assert.equal(inferMediaType(undefined, undefined), "image");
    });
  });

  describe("calculateOrientation", () => {
    it("deve classificar orientação 'portrait', 'landscape' e 'square'", () => {
      assert.equal(calculateOrientation(1080, 1920), "portrait");
      assert.equal(calculateOrientation(1920, 1080), "landscape");
      assert.equal(calculateOrientation(1000, 1000), "square");
      assert.equal(calculateOrientation(1000, 1020), "square"); // Dentro de 5% de tolerância
    });

    it("deve retornar null para dimensões inválidas ou incompletas", () => {
      assert.equal(calculateOrientation(null, 1000), null);
      assert.equal(calculateOrientation(1000, 0), null);
      assert.equal(calculateOrientation(-50, 100), null);
    });
  });

  describe("sanitizeCapturedAt", () => {
    it("deve aceitar datas válidas em ISO", () => {
      const valid = "2026-08-15T15:30:00.000Z";
      assert.equal(sanitizeCapturedAt(valid), valid);
    });

    it("deve rejeitar datas no futuro distante e usar fallback", () => {
      const farFuture = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const fallback = "2026-08-15T12:00:00.000Z";
      assert.equal(sanitizeCapturedAt(farFuture, fallback), fallback);
    });

    it("deve rejeitar datas anteriores a 2000 e usar fallback", () => {
      const ancient = "1990-01-01T00:00:00.000Z";
      const fallback = "2026-08-15T12:00:00.000Z";
      assert.equal(sanitizeCapturedAt(ancient, fallback), fallback);
    });

    it("deve retornar null se data for inválida e sem fallback", () => {
      assert.equal(sanitizeCapturedAt("data_invalida"), null);
      assert.equal(sanitizeCapturedAt(null), null);
    });
  });

  describe("sanitizeDimension", () => {
    it("deve arredondar dimensões positivas válidas", () => {
      assert.equal(sanitizeDimension(1920.4), 1920);
      assert.equal(sanitizeDimension(1080), 1080);
    });

    it("deve retornar null para dimensões negativas, zero ou excessivas (> 16384)", () => {
      assert.equal(sanitizeDimension(0), null);
      assert.equal(sanitizeDimension(-100), null);
      assert.equal(sanitizeDimension(20000), null);
      assert.equal(sanitizeDimension(NaN), null);
    });
  });

  describe("sanitizeDuration", () => {
    it("deve aceitar durações positivas até 600 segundos", () => {
      assert.equal(sanitizeDuration(15.5), 15.5);
      assert.equal(sanitizeDuration(60), 60);
    });

    it("deve limitar ao tecto de 600 segundos", () => {
      assert.equal(sanitizeDuration(1200), 600);
    });

    it("deve retornar null para durações inválidas ou negativas", () => {
      assert.equal(sanitizeDuration(0), null);
      assert.equal(sanitizeDuration(-5), null);
      assert.equal(sanitizeDuration(NaN), null);
    });
  });

  describe("Derivatives paths", () => {
    it("deve construir caminhos canónicos para thumbnails e posters", () => {
      const originalPhoto = "jessicasamuelwedding/photos/abc-123.jpg";
      assert.equal(
        buildThumbnailStoragePath(originalPhoto),
        "jessicasamuelwedding/photos/derivatives/thumbnails/abc-123.webp"
      );

      const originalVideo = "jessicasamuelwedding/videos/xyz-789.mp4";
      assert.equal(
        buildPosterStoragePath(originalVideo),
        "jessicasamuelwedding/videos/derivatives/posters/xyz-789.webp"
      );

      const resolved = resolveDerivativePaths(originalVideo, "video");
      assert.equal(
        resolved.thumbnailPath,
        "jessicasamuelwedding/videos/derivatives/thumbnails/xyz-789.webp"
      );
      assert.equal(
        resolved.posterPath,
        "jessicasamuelwedding/videos/derivatives/posters/xyz-789.webp"
      );
    });
  });
});
