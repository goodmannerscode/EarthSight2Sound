import sharp from "sharp";
import type { ResizePort, ResizedImage } from "../ports";

sharp.cache(false);
sharp.concurrency(1);

export const RESIZE_EDGE = 512;
export const JPEG_QUALITY = 85;

/**
 * Decodes and resizes to a 512px-inside JPEG.
 * Pixel-count guarding happens in the pipeline, before this runs.
 */
export const createResizeAdapter = (): ResizePort => ({
  async run(buffer): Promise<ResizedImage> {
    const { data, info } = await sharp(buffer, { failOn: "error" })
      .resize(RESIZE_EDGE, RESIZE_EDGE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    return {
      data: new Uint8Array(data),
      width: info.width,
      height: info.height,
    };
  },
});
