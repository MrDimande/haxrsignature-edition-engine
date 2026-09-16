import assert from "node:assert/strict";
import test from "node:test";
import {
  createMemoryUploadClientId,
  memoryUploadHttpStatus,
  normalizeMemoryUploadErrorCode,
  validateClientMediaFile,
} from "./upload-error-contract";

test("upload error contract normalizes legacy failures without hiding stage", () => {
  assert.equal(normalizeMemoryUploadErrorCode("SESSION_INVALID", "SERVICE_UNAVAILABLE"), "SESSION_EXPIRED");
  assert.equal(normalizeMemoryUploadErrorCode("STORAGE_ERROR", "UPLOAD_INTENT_FAILED"), "UPLOAD_SIGN_FAILED");
  assert.equal(normalizeMemoryUploadErrorCode("UPLOAD_MISSING", "UPLOAD_COMPLETE_FAILED"), "STORAGE_UPLOAD_FAILED");
  assert.equal(memoryUploadHttpStatus("UPLOAD_SIGN_FAILED"), 502);
  assert.equal(memoryUploadHttpStatus("UPLOAD_COMPLETE_FAILED"), 503);
});

test("client media guard accepts iPhone formats and blocks unsupported or oversized files before upload", () => {
  assert.equal(validateClientMediaFile({ name: "IMG_001.HEIC", type: "", size: 2 * 1024 * 1024 }), null);
  assert.equal(validateClientMediaFile({ name: "clip.mov", type: "video/quicktime", size: 90 * 1024 * 1024 }), null);
  assert.equal(validateClientMediaFile({ name: "graphic.gif", type: "image/gif", size: 1024 }), "UNSUPPORTED_MEDIA");
  assert.equal(validateClientMediaFile({ name: "IMG_002.jpg", type: "image/jpeg", size: 26 * 1024 * 1024 }), "FILE_TOO_LARGE");
});

test("client upload identifiers are UUID v4 values", () => {
  assert.match(createMemoryUploadClientId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
