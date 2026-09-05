import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  resolveStorageProviderName,
  getMemoriesStorageProvider,
  STORAGE_PROVIDER_ENV,
  UnsupportedStorageProviderError,
} from "./factory";
import { R2ConfigurationError } from "./r2-provider";

describe("HAXR Signature Edition — Storage Factory & Provider Selection", () => {
  test("defaults to supabase when STORAGE_PROVIDER is absent", () => {
    const original = process.env[STORAGE_PROVIDER_ENV];
    try {
      delete process.env[STORAGE_PROVIDER_ENV];
      assert.equal(resolveStorageProviderName(), "supabase");
      const provider = getMemoriesStorageProvider();
      assert.equal(provider.providerName, "supabase");
    } finally {
      if (original !== undefined) process.env[STORAGE_PROVIDER_ENV] = original;
    }
  });

  test("selects supabase when STORAGE_PROVIDER=supabase explicitly", () => {
    const original = process.env[STORAGE_PROVIDER_ENV];
    try {
      process.env[STORAGE_PROVIDER_ENV] = "supabase";
      assert.equal(resolveStorageProviderName(), "supabase");
      const provider = getMemoriesStorageProvider();
      assert.equal(provider.providerName, "supabase");
    } finally {
      if (original !== undefined) process.env[STORAGE_PROVIDER_ENV] = original;
    }
  });

  test("fails closed when STORAGE_PROVIDER is an unsupported value", () => {
    const original = process.env[STORAGE_PROVIDER_ENV];
    try {
      process.env[STORAGE_PROVIDER_ENV] = "s3-direct";
      assert.throws(() => resolveStorageProviderName(), UnsupportedStorageProviderError);
    } finally {
      if (original !== undefined) process.env[STORAGE_PROVIDER_ENV] = original;
    }
  });

  test("fails closed when STORAGE_PROVIDER=r2-s3 but credentials are missing", () => {
    const originalProvider = process.env[STORAGE_PROVIDER_ENV];
    const origKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    try {
      process.env[STORAGE_PROVIDER_ENV] = "r2-s3";
      delete process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
      assert.throws(() => getMemoriesStorageProvider(), R2ConfigurationError);
    } finally {
      if (originalProvider !== undefined) process.env[STORAGE_PROVIDER_ENV] = originalProvider;
      if (origKey !== undefined) process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = origKey;
    }
  });
});
