import type { FeedItem } from "@es2s/shared";

export type HeadResult = {
  contentLength: number | undefined;
  contentType: string | undefined;
};

export type ResizedImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export type NewFeedItem = {
  imageUrl: string;
  audioUrl: string;
  description: string;
};

/** Object storage (Cloudflare R2). Keys are bucket-relative. */
export type StoragePort = {
  head(key: string): Promise<HeadResult>;
  get(key: string): Promise<Uint8Array>;
  put(key: string, body: Uint8Array, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
};

/** Persistence for published feed items. */
export type RepoPort = {
  insert(item: NewFeedItem): Promise<FeedItem>;
};

/** Runs the sonifier binary and writes a WAV to `outPath`. */
export type SonifyPort = {
  run(imagePath: string, seconds: number, outPath: string): Promise<void>;
};

/** Decodes, guards and resizes an image. */
export type ResizePort = {
  run(buffer: Uint8Array): Promise<ResizedImage>;
};

/** Temporary file handling, injected so tests never touch the disk. */
export type TempPort = {
  write(name: string, data: Uint8Array): Promise<string>;
  read(path: string): Promise<Uint8Array>;
  remove(path: string): Promise<void>;
};

export type PipelineDeps = {
  storage: StoragePort;
  repo: RepoPort;
  sonify: SonifyPort;
  resize: ResizePort;
  temp: TempPort;
  random?: () => number;
};
