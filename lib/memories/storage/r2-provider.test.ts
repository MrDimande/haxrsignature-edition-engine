import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { S3Client } from "@aws-sdk/client-s3";
import { R2MemoriesStorageProvider } from "./r2-provider";

describe("HAXR Signature Edition — R2 Storage Provider (Offline / Mocked SDK)", () => {
  const fakeConfig = {
    accessKeyId: "mock-access-key-id",
    secretAccessKey: "mock-secret-access-key",
    endpoint: "https://mock-account.r2.cloudflarestorage.com",
    bucketName: "haxr-wedding-photos",
  };

  test("createSignedUploadUrl returns signed URL with Content-Type", async () => {
    // S3Client real gera assinaturas offline via HMAC sem rede
    const client = new S3Client({
      region: "auto",
      endpoint: fakeConfig.endpoint,
      credentials: {
        accessKeyId: fakeConfig.accessKeyId,
        secretAccessKey: fakeConfig.secretAccessKey,
      },
    });
    const provider = new R2MemoriesStorageProvider(fakeConfig, client);

    const result = await provider.createSignedUploadUrl({
      storagePath: "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg",
      contentType: "image/jpeg",
      expiresInSeconds: 900,
    });

    assert.ok(result.uploadUrl);
    assert.ok(result.uploadUrl.includes("haxr-wedding-photos"));
    assert.ok(result.uploadUrl.includes("original.jpg"));
    assert.ok(result.uploadUrl.includes("X-Amz-Signature"));
  });

  test("createSignedDownloadUrl returns signed GET URL", async () => {
    const client = new S3Client({
      region: "auto",
      endpoint: fakeConfig.endpoint,
      credentials: {
        accessKeyId: fakeConfig.accessKeyId,
        secretAccessKey: fakeConfig.secretAccessKey,
      },
    });
    const provider = new R2MemoriesStorageProvider(fakeConfig, client);

    const result = await provider.createSignedDownloadUrl({
      storagePath: "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg",
      expiresInSeconds: 300,
    });

    assert.ok(result.downloadUrl);
    assert.ok(result.downloadUrl.includes("haxr-wedding-photos"));
    assert.ok(result.downloadUrl.includes("X-Amz-Signature"));
  });

  test("getObjectInfo handles existing object", async () => {
    const client = new S3Client({
      region: "auto",
      endpoint: fakeConfig.endpoint,
      credentials: {
        accessKeyId: fakeConfig.accessKeyId,
        secretAccessKey: fakeConfig.secretAccessKey,
      },
    });
    // Mock send method for calls requiring network
    client.send = (async (cmd: any) => {
      return {
        ContentLength: 2048,
        ContentType: "image/jpeg",
        ETag: '"etag-123"',
      };
    }) as any;

    const provider = new R2MemoriesStorageProvider(fakeConfig, client);

    const info = await provider.getObjectInfo("jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg");
    assert.equal(info.exists, true);
    assert.equal(info.contentLength, 2048);
    assert.equal(info.contentType, "image/jpeg");
    assert.equal(info.etag, '"etag-123"');
  });

  test("getObjectInfo handles NotFound / 404 cleanly", async () => {
    const notFoundErr = new Error("Not Found");
    (notFoundErr as any).name = "NotFound";
    (notFoundErr as any).$metadata = { httpStatusCode: 404 };

    const client = new S3Client({
      region: "auto",
      endpoint: fakeConfig.endpoint,
      credentials: {
        accessKeyId: fakeConfig.accessKeyId,
        secretAccessKey: fakeConfig.secretAccessKey,
      },
    });
    client.send = (async () => {
      throw notFoundErr;
    }) as any;

    const provider = new R2MemoriesStorageProvider(fakeConfig, client);

    const info = await provider.getObjectInfo("jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg");
    assert.equal(info.exists, false);
  });

  test("getObjectInfo does NOT swallow 403 AccessDenied as NotFound", async () => {
    const accessDeniedErr = new Error("Access Denied");
    (accessDeniedErr as any).name = "AccessDenied";
    (accessDeniedErr as any).$metadata = { httpStatusCode: 403 };

    const client = new S3Client({
      region: "auto",
      endpoint: fakeConfig.endpoint,
      credentials: {
        accessKeyId: fakeConfig.accessKeyId,
        secretAccessKey: fakeConfig.secretAccessKey,
      },
    });
    client.send = (async () => {
      throw accessDeniedErr;
    }) as any;

    const provider = new R2MemoriesStorageProvider(fakeConfig, client);

    await assert.rejects(
      async () => provider.getObjectInfo("jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg"),
      (err: any) => err.name === "AccessDenied"
    );
  });

  test("readObjectPrefix converts byte stream accurately", async () => {
    const sampleBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const client = new S3Client({
      region: "auto",
      endpoint: fakeConfig.endpoint,
      credentials: {
        accessKeyId: fakeConfig.accessKeyId,
        secretAccessKey: fakeConfig.secretAccessKey,
      },
    });
    client.send = (async () => {
      return {
        Body: {
          transformToByteArray: async () => sampleBytes,
        },
      };
    }) as any;

    const provider = new R2MemoriesStorageProvider(fakeConfig, client);

    const bytes = await provider.readObjectPrefix("jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg", 4);
    assert.deepEqual(bytes, sampleBytes);
  });

  test("remove executes single exact object DeleteObjectCommand", async () => {
    let capturedBucket = "";
    let capturedKey = "";
    const client = new S3Client({
      region: "auto",
      endpoint: fakeConfig.endpoint,
      credentials: {
        accessKeyId: fakeConfig.accessKeyId,
        secretAccessKey: fakeConfig.secretAccessKey,
      },
    });
    client.send = (async (cmd: any) => {
      capturedBucket = cmd.input.Bucket;
      capturedKey = cmd.input.Key;
    }) as any;

    const provider = new R2MemoriesStorageProvider(fakeConfig, client);

    await provider.remove("jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg");
    assert.equal(capturedBucket, "haxr-wedding-photos");
    assert.equal(capturedKey, "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg");
  });
});
