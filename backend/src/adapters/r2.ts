import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StoragePort } from "../ports";

export type R2Options = {
  accountId: string;
  bucket: string;
  endpoint: string;
  publicBaseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export const createR2Adapter = (options: R2Options): StoragePort => {
  const client = new S3Client({
    region: "auto",
    endpoint: options.endpoint,
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    },
    forcePathStyle: true,
  });

  const publicUrl = (key: string): string =>
    `${options.publicBaseUrl}/${key.replace(/^\/+/, "")}`;

  return {
    async head(key) {
      const result = await client.send(
        new HeadObjectCommand({ Bucket: options.bucket, Key: key }),
      );
      return {
        contentLength: result.ContentLength,
        contentType: result.ContentType,
      };
    },

    async get(key) {
      const result = await client.send(
        new GetObjectCommand({ Bucket: options.bucket, Key: key }),
      );
      if (!result.Body) {
        throw new Error(`R2 object has no body: ${key}`);
      }
      return new Uint8Array(await result.Body.transformToByteArray());
    },

    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: options.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return publicUrl(key);
    },

    async delete(key) {
      await client.send(
        new DeleteObjectCommand({ Bucket: options.bucket, Key: key }),
      );
    },
  };
};
