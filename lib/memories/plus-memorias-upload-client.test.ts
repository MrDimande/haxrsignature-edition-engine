import assert from "node:assert/strict";
import test from "node:test";
import { uploadPlusMemory } from "../../engines/true-theme/profiles/jessica-samuel-wedding/memories/plus-memorias-upload";

function photoFile(contentType = "image/jpeg") {
  const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: contentType });
  Object.defineProperty(blob, "name", { value: "matchday.jpg" });
  return blob as File;
}

test("client keeps one idempotency key across intent, PUT and complete", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ input: string; body?: string; contentType?: string | null }> = [];
  const clientUploadId = "de305d54-75b4-431b-adb2-eb6b9e546014";

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({
      input: url,
      body: typeof init?.body === "string" ? init.body : undefined,
      contentType: new Headers(init?.headers).get("Content-Type"),
    });
    if (url === "/api/memories/upload-intent") {
      return new Response(JSON.stringify({
        success: true,
        photoId: "8ac7d52a-11dc-4a2c-825d-8d9f0b24288b",
        uploadUrl: "https://storage.example.test/upload",
        contentType: "image/jpeg",
      }), { status: 200 });
    }
    if (url === "https://storage.example.test/upload") {
      return new Response(null, { status: 200 });
    }
    return new Response(JSON.stringify({ success: true, pointsAwarded: 100, totalPoints: 100 }), { status: 200 });
  }) as typeof fetch;

  try {
    const result = await uploadPlusMemory({
      slug: "stanturns5",
      file: photoFile("image/jpg"),
      challengeId: "8ac7d52a-11dc-4a2c-825d-8d9f0b24288b",
      clientUploadId,
    });

    assert.equal(result.success, true);
    assert.equal(result.pointsAwarded, 100);
    assert.equal(JSON.parse(calls[0].body!).clientUploadId, clientUploadId);
    assert.equal(calls[1].contentType, "image/jpeg");
    assert.deepEqual(calls.map((call) => call.input), [
      "/api/memories/upload-intent",
      "https://storage.example.test/upload",
      "/api/memories/complete",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("client reconciles an already-completed intent without another storage PUT", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url === "/api/memories/upload-intent") {
      return new Response(JSON.stringify({
        success: true,
        alreadyCompleted: true,
        photoId: "8ac7d52a-11dc-4a2c-825d-8d9f0b24288b",
        uploadUrl: "",
        contentType: "image/jpeg",
      }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: true, pointsAwarded: 100 }), { status: 200 });
  }) as typeof fetch;

  try {
    const result = await uploadPlusMemory({ slug: "stanturns5", file: photoFile() });
    assert.equal(result.success, true);
    assert.deepEqual(calls, ["/api/memories/upload-intent", "/api/memories/complete"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("client names a failed physical PUT as a storage upload failure", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/memories/upload-intent") {
      return new Response(JSON.stringify({
        success: true,
        photoId: "8ac7d52a-11dc-4a2c-825d-8d9f0b24288b",
        uploadUrl: "https://storage.example.test/upload",
        contentType: "image/jpeg",
      }), { status: 200 });
    }
    return new Response(null, { status: 403 });
  }) as typeof fetch;

  try {
    const result = await uploadPlusMemory({ slug: "stanturns5", file: photoFile() });
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.code, "STORAGE_UPLOAD_FAILED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
