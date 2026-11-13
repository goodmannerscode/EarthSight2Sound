import {
  MAX_AUDIO_BYTES,
  MAX_AUDIO_SECONDS,
} from "@es2s/shared";

const HEADER_BYTES = 44;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;
const MIN_SAMPLE_RATE = 4_000;
const SAMPLE_RATE_STEP = 0.85;

export type WavInfo = {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataBytes: number;
};

/** Random whole-second duration inside the allowed window. */
const writeAscii = (view: DataView, offset: number, text: string): void => {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
};

/** Encodes mono float samples as a 16-bit PCM WAV. */
export const buildWav = (
  samples: Float32Array,
  sampleRate: number,
): Uint8Array => {
  const dataBytes = samples.length * (BITS_PER_SAMPLE / 8);
  const buffer = new ArrayBuffer(HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, CHANNELS, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * CHANNELS * (BITS_PER_SAMPLE / 8), true);
  view.setUint16(32, CHANNELS * (BITS_PER_SAMPLE / 8), true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    const value = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(HEADER_BYTES + i * 2, Math.round(value), true);
  }

  return new Uint8Array(buffer);
};

export const readWavInfo = (wav: Uint8Array): WavInfo => {
  if (wav.byteLength < HEADER_BYTES) {
    throw new Error("WAV buffer is too short");
  }
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const riff = String.fromCharCode(...wav.subarray(0, 4));
  const wave = String.fromCharCode(...wav.subarray(8, 12));
  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error("Not a RIFF/WAVE buffer");
  }
  return {
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    bitsPerSample: view.getUint16(34, true),
    dataBytes: view.getUint32(40, true),
  };
};

const decodeSamples = (wav: Uint8Array): Float32Array => {
  const info = readWavInfo(wav);
  const count = info.dataBytes / 2;
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    samples[i] = view.getInt16(HEADER_BYTES + i * 2, true) / 0x8000;
  }
  return samples;
};

/** Linear resample that preserves the wall-clock duration. */
const resample = (samples: Float32Array, ratio: number): Float32Array => {
  const outLength = Math.max(1, Math.floor(samples.length * ratio));
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const position = i / ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    const a = samples[index] ?? 0;
    const b = samples[index + 1] ?? a;
    out[i] = a + (b - a) * fraction;
  }
  return out;
};

/**
 * Lowers the sample rate by ~15% per pass until the WAV fits the byte budget.
 * Duration is preserved; only resolution is traded away.
 */
export const fitToBudget = (
  wav: Uint8Array,
  maxBytes: number = MAX_AUDIO_BYTES,
): Uint8Array => {
  if (wav.byteLength <= maxBytes) return wav;

  const info = readWavInfo(wav);
  let samples = decodeSamples(wav);
  let sampleRate = info.sampleRate;

  while (true) {
    const nextRate = Math.floor(sampleRate * SAMPLE_RATE_STEP);
    if (nextRate < MIN_SAMPLE_RATE) {
      throw new Error(
        `Cannot fit audio into ${maxBytes} bytes without dropping below ${MIN_SAMPLE_RATE} Hz`,
      );
    }
    samples = resample(samples, nextRate / sampleRate);
    sampleRate = nextRate;

    const candidate = buildWav(samples, sampleRate);
    if (candidate.byteLength <= maxBytes) return candidate;
  }
};
