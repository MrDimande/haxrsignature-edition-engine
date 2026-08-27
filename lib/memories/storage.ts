import { del, get, issueSignedToken, presignUrl } from "@vercel/blob";
import { getStorageBackend } from "@lib/storage/backend";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";

function getBlobCredentials(): { oidcToken: string; storeId: string } | null {
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  return oidcToken && storeId ? { oidcToken, storeId } : null;
}

export function isMemoriesStorageConfigured(): boolean {
  return getStorageBackend() === "vercel-blob"
    ? Boolean(getBlobCredentials())
    : isSupabaseConfigured();
}

export async function createMemorySignedUploadUrl(input: {
  bucketName: string;
  storagePath: string;
  contentType: string;
  maximumSizeInBytes: number;
  validUntil: number;
}): Promise<string | null> {
  if (getStorageBackend() !== "vercel-blob") {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(input.bucketName)
      .createSignedUploadUrl(input.storagePath);
    return error ? null : data?.signedUrl ?? null;
  }

  const credentials = getBlobCredentials();
  if (!credentials) return null;

  const signedToken = await issueSignedToken({
    pathname: input.storagePath,
    operations: ["put"],
    allowedContentTypes: [input.contentType],
    maximumSizeInBytes: input.maximumSizeInBytes,
    validUntil: input.validUntil,
    oidcToken: credentials.oidcToken,
    storeId: credentials.storeId,
  });

  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "put",
    pathname: input.storagePath,
    access: "private",
    allowedContentTypes: [input.contentType],
    maximumSizeInBytes: input.maximumSizeInBytes,
    validUntil: input.validUntil,
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  return presignedUrl;
}

export async function downloadMemoryObject(input: {
  bucketName: string;
  storagePath: string;
}): Promise<Uint8Array | null> {
  if (getStorageBackend() !== "vercel-blob") {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(input.bucketName)
      .download(input.storagePath);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  }

  const credentials = getBlobCredentials();
  if (!credentials) return null;

  const result = await get(input.storagePath, {
    access: "private",
    oidcToken: credentials.oidcToken,
    storeId: credentials.storeId,
  });
  if (!result || result.statusCode !== 200) return null;

  return new Uint8Array(await new Response(result.stream).arrayBuffer());
}

export async function removeMemoryObject(input: {
  bucketName: string;
  storagePath: string;
}): Promise<void> {
  if (getStorageBackend() !== "vercel-blob") {
    const supabase = createAdminClient();
    await supabase.storage.from(input.bucketName).remove([input.storagePath]);
    return;
  }

  const credentials = getBlobCredentials();
  if (!credentials) return;

  await del(input.storagePath, {
    oidcToken: credentials.oidcToken,
    storeId: credentials.storeId,
  });
}

export async function createMemorySignedReadUrl(input: {
  bucketName: string;
  storagePath: string;
  ttlSeconds: number;
}): Promise<string | null> {
  if (getStorageBackend() !== "vercel-blob") {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(input.bucketName)
      .createSignedUrl(input.storagePath, input.ttlSeconds);
    return error ? null : data?.signedUrl ?? null;
  }

  const credentials = getBlobCredentials();
  if (!credentials) return null;

  const validUntil = Date.now() + input.ttlSeconds * 1000;
  const signedToken = await issueSignedToken({
    pathname: input.storagePath,
    operations: ["get"],
    validUntil,
    oidcToken: credentials.oidcToken,
    storeId: credentials.storeId,
  });

  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "get",
    pathname: input.storagePath,
    access: "private",
    validUntil,
  });

  return presignedUrl;
}
