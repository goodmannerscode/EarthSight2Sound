import { randomUUID } from "node:crypto";
import type { FeedItem } from "@es2s/shared";
import { fitToBudget } from "./audio";
import type { PipelineDeps } from "./ports";
import {
  validateDescription,
  validateHeadObject,
  validateImageDimensions,
} from "./validators";

export type PipelineInput = {
  key: string;
  description: string;
};

export class PipelineError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "PipelineError";
    this.status = status;
  }
}

const toPipelineError = (cause: unknown): PipelineError => {
  if (cause instanceof PipelineError) return cause;
  const message =
    cause instanceof Error ? cause.message : "Unexpected pipeline failure";
  return new PipelineError(500, message);
};

/**
 * Orchestrates head → get → resize → sonify → put → insert.
 * Imports no concrete adapter: everything arrives through `deps`.
 */
export const runPipeline = async (
  deps: PipelineDeps,
  input: PipelineInput,
): Promise<FeedItem> => {
  const description = validateDescription(input.description);
  if (!description.ok) {
    throw new PipelineError(description.status, description.error);
  }

  let head: ReturnType<typeof validateHeadObject>;
  try {
    head = validateHeadObject(await deps.storage.head(input.key));
  } catch (cause) {
    throw toPipelineError(cause);
  }
  if (!head.ok) {
    throw new PipelineError(head.status, head.error);
  }

  const original = await deps.storage.get(input.key);
  const resized = await deps.resize.run(original);

  const dimensions = validateImageDimensions({
    width: resized.width,
    height: resized.height,
  });
  if (!dimensions.ok) {
    throw new PipelineError(dimensions.status, dimensions.error);
  }

  const id = randomUUID();
  const imageKey = `images/${id}.jpg`;
  const audioKey = `audio/${id}.wav`;

  let imagePath: string | null = null;
  let audioDir: string | null = null;
  let audioPath: string | null = null;
  let audioUploaded = false;

  try {
    imagePath = await deps.temp.write(`${id}.jpg`, resized.data);
    audioDir = await deps.temp.mkdir(`${id}-audio`);

    audioPath = await deps.sonify.run(imagePath, audioDir);

    const rawWav = await deps.temp.read(audioPath);
    const wav = fitToBudget(rawWav);

    const imageUrl = await deps.storage.put(imageKey, resized.data, "image/jpeg");
    const audioUrl = await deps.storage.put(audioKey, wav, "audio/wav");
    audioUploaded = true;

    return await deps.repo.insert({
      imageUrl,
      audioUrl,
      description: description.value,
    });
  } catch (cause) {
    if (audioUploaded) {
      await deps.storage.delete(audioKey).catch(() => undefined);
    }
    throw toPipelineError(cause);
  } finally {
    if (imagePath) await deps.temp.remove(imagePath).catch(() => undefined);
    if (audioDir) await deps.temp.remove(audioDir).catch(() => undefined);
  }
};
