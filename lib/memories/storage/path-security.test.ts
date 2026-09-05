import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { assertCanonicalStoragePath, InvalidStoragePathError } from "./path-security";

describe("HAXR Signature Edition — Storage Path Security", () => {
  const validPath = "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg";

  test("accepts valid canonical paths", () => {
    assert.doesNotThrow(() => assertCanonicalStoragePath(validPath));
    assert.doesNotThrow(() =>
      assertCanonicalStoragePath("jessicaesamueltraditionalwedding/012a2a33-e775-44c3-b1f7-008a46945e0d/original.mp4")
    );
    assert.doesNotThrow(() =>
      assertCanonicalStoragePath("lobolo-jessica-samuel/a1b2c3d4-e5f6-7890-abcd-ef1234567890/original.webp")
    );
  });

  test("rejects directory traversal ../", () => {
    assert.throws(
      () => assertCanonicalStoragePath("../jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg"),
      InvalidStoragePathError
    );
    assert.throws(
      () => assertCanonicalStoragePath("jessicasamuelwedding/../../original.jpg"),
      InvalidStoragePathError
    );
  });

  test("rejects backslashes", () => {
    assert.throws(
      () => assertCanonicalStoragePath("jessicasamuelwedding\\67a29bbd-6840-43c8-8b8e-31865023bf51\\original.jpg"),
      InvalidStoragePathError
    );
  });

  test("rejects leading or trailing slashes", () => {
    assert.throws(() => assertCanonicalStoragePath("/" + validPath), InvalidStoragePathError);
    assert.throws(() => assertCanonicalStoragePath(validPath + "/"), InvalidStoragePathError);
  });

  test("rejects non-canonical filenames", () => {
    assert.throws(
      () => assertCanonicalStoragePath("jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/malicious.sh"),
      InvalidStoragePathError
    );
    assert.throws(
      () => assertCanonicalStoragePath("jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/thumb.jpg"),
      InvalidStoragePathError
    );
  });

  test("rejects non-uuid subfolder identifiers", () => {
    assert.throws(
      () => assertCanonicalStoragePath("jessicasamuelwedding/not-a-uuid/original.jpg"),
      InvalidStoragePathError
    );
  });
});
