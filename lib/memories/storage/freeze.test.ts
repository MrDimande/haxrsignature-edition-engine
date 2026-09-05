import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isMemoriesWriteFrozen, HAXR_STORAGE_WRITE_FREEZE_ENV } from "./freeze";

describe("HAXR Signature Edition — Write Freeze Mechanics", () => {
  test("freeze is disabled when env variable is absent", () => {
    const original = process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
    try {
      delete process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
      assert.equal(isMemoriesWriteFrozen(), false);
    } finally {
      if (original !== undefined) process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = original;
    }
  });

  test("freeze is disabled when env variable is empty", () => {
    const original = process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
    try {
      process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = "";
      assert.equal(isMemoriesWriteFrozen(), false);
    } finally {
      if (original !== undefined) process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = original;
    }
  });

  test("freeze is disabled when env variable is 'false'", () => {
    const original = process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
    try {
      process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = "false";
      assert.equal(isMemoriesWriteFrozen(), false);
    } finally {
      if (original !== undefined) process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = original;
    }
  });

  test("freeze is disabled when env variable is 'TRUE' (strict lowercase requirement)", () => {
    const original = process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
    try {
      process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = "TRUE";
      assert.equal(isMemoriesWriteFrozen(), false);
    } finally {
      if (original !== undefined) process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = original;
    }
  });

  test("freeze is enabled ONLY when env variable is exact string 'true'", () => {
    const original = process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
    try {
      process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = "true";
      assert.equal(isMemoriesWriteFrozen(), true);
    } finally {
      if (original !== undefined) process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = original;
    }
  });
});
