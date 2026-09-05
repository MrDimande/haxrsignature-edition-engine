import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  MemoriesStorageProvider,
  ObjectInfo,
  SignedDownloadUrlOptions,
  SignedDownloadUrlResult,
  SignedUploadUrlOptions,
  SignedUploadUrlResult,
} from "./types";
import { assertCanonicalStoragePath } from "./path-security";

export type R2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
};

export class R2ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "R2ConfigurationError";
  }
}

export function resolveR2ConfigFromEnv(): R2Config {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.trim();
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();

  const missing: string[] = [];
  if (!accessKeyId) missing.push("CLOUDFLARE_R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  if (!endpoint) missing.push("CLOUDFLARE_R2_ENDPOINT");
  if (!bucketName) missing.push("CLOUDFLARE_R2_BUCKET_NAME");

  if (missing.length > 0) {
    throw new R2ConfigurationError(
      `Configuração incompleta do provedor R2. Variáveis em falta: ${missing.join(", ")}`
    );
  }

  return {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    endpoint: endpoint!,
    bucketName: bucketName!,
  };
}

export class R2MemoriesStorageProvider implements MemoriesStorageProvider {
  readonly providerName = "r2-s3" as const;
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(config?: R2Config, clientOverride?: S3Client) {
    if (clientOverride) {
      this.client = clientOverride;
      this.bucketName = config?.bucketName || process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || "haxr-wedding-photos";
      return;
    }

    const resolved = config || resolveR2ConfigFromEnv();
    this.bucketName = resolved.bucketName;
    this.client = new S3Client({
      region: "auto",
      endpoint: resolved.endpoint,
      credentials: {
        accessKeyId: resolved.accessKeyId,
        secretAccessKey: resolved.secretAccessKey,
      },
      maxAttempts: 1,
      forcePathStyle: true,
    });
  }

  async createSignedUploadUrl(options: SignedUploadUrlOptions): Promise<SignedUploadUrlResult> {
    assertCanonicalStoragePath(options.storagePath);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: options.storagePath,
      ContentType: options.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: options.expiresInSeconds,
      unhoistableHeaders: new Set(["content-type"]),
    });

    return { uploadUrl };
  }

  async createSignedDownloadUrl(options: SignedDownloadUrlOptions): Promise<SignedDownloadUrlResult> {
    assertCanonicalStoragePath(options.storagePath);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: options.storagePath,
    });

    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: options.expiresInSeconds,
    });

    return { downloadUrl };
  }

  async getObjectInfo(storagePath: string): Promise<ObjectInfo> {
    assertCanonicalStoragePath(storagePath);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
      });
      const res = await this.client.send(command);

      return {
        exists: true,
        contentLength: res.ContentLength,
        contentType: res.ContentType,
        etag: res.ETag,
      };
    } catch (err: any) {
      const name = err?.name || "";
      const httpCode = err?.$metadata?.httpStatusCode;

      if (name === "NotFound" || name === "NoSuchKey" || httpCode === 404) {
        return { exists: false };
      }

      // 403 / AccessDenied NÃO pode ser mascarado como not-found
      throw err;
    }
  }

  async readObjectPrefix(storagePath: string, maxBytes: number): Promise<Uint8Array | null> {
    assertCanonicalStoragePath(storagePath);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
        Range: `bytes=0-${maxBytes - 1}`,
      });

      const res = await this.client.send(command);
      if (!res.Body) return null;

      const bytes = await res.Body.transformToByteArray();
      return bytes;
    } catch (err: any) {
      const name = err?.name || "";
      const httpCode = err?.$metadata?.httpStatusCode;
      if (name === "NotFound" || name === "NoSuchKey" || httpCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async remove(storagePath: string): Promise<void> {
    assertCanonicalStoragePath(storagePath);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath,
      });
      await this.client.send(command);
    } catch (err: any) {
      console.error(`[R2StorageProvider] Falha ao remover '${storagePath}': ${err?.message || err}`);
    }
  }
}
