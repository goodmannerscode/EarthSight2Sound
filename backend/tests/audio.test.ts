import { describe, expect, it } from "bun:test";
import {
  MAX_AUDIO_BYTES,
  MAX_AUDIO_SECONDS,
} from "@es2s/shared";
import {
  buildWav,
  fitToBudget,
  buildWav,
  readWavInfo,
} from "../src/audio";

const SAMPLE_RATE = 16_000;

const makeTone = (seconds: number, sampleRate = SAMPLE_RATE): Float32Array => {
  const length = Math.round(seconds * sampleRate);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
  }
  return samples;
};

describe("buildWav", () => {
  it("produces a mono 16-bit WAV", () => {
    const wav = buildWav(makeTone(1), SAMPLE_RATE);
    const info = readWavInfo(wav);
    expect(info.channels).toBe(1);
    expect(info.bitsPerSample).toBe(16);
    expect(info.sampleRate).toBe(SAMPLE_RATE);
  });

  it("writes a RIFF/WAVE header", () => {
    const wav = buildWav(makeTone(1), SAMPLE_RATE);
    const header = Buffer.from(wav.subarray(0, 12)).toString("ascii");
    expect(header.slice(0, 4)).toBe("RIFF");
    expect(header.slice(8, 12)).toBe("WAVE");
  });

  it("keeps the declared data size consistent with the payload", () => {
    const samples = makeTone(2);
    const wav = buildWav(samples, SAMPLE_RATE);
    const info = readWavInfo(wav);
    expect(info.dataBytes).toBe(samples.length * 2);
    expect(wav.byteLength).toBe(44 + samples.length * 2);
  });

  it("clamps samples outside [-1, 1]", () => {
    const samples = new Float32Array([2, -2, 0]);
    const wav = buildWav(samples, SAMPLE_RATE);
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
    expect(view.getInt16(48, true)).toBe(0);
  });
});

describe("readWavInfo", () => {
  it("rejects a buffer that is too short", () => {
    expect(() => readWavInfo(new Uint8Array(10))).toThrow();
  });

  it("rejects a non-RIFF buffer", () => {
    const bogus = new Uint8Array(64);
    expect(() => readWavInfo(bogus)).toThrow();
  });
});

describe("fitToBudget", () => {
  it("returns the input untouched when it already fits", () => {
    const wav = buildWav(makeTone(1), SAMPLE_RATE);
    const result = fitToBudget(wav, MAX_AUDIO_BYTES);
    expect(result.byteLength).toBe(wav.byteLength);
    expect(result).toBe(wav);
  });

  it("shrinks a WAV that exceeds the byte budget", () => {
    const wav = buildWav(makeTone(MAX_AUDIO_SECONDS, 44_100), 44_100);
    const budget = Math.floor(wav.byteLength / 2);
    expect(wav.byteLength).toBeGreaterThan(budget);

    const result = fitToBudget(wav, budget);
    expect(result.byteLength).toBeLessThanOrEqual(budget);
  });

  it("keeps the result a valid mono 16-bit WAV", () => {
    const wav = buildWav(makeTone(MAX_AUDIO_SECONDS, 44_100), 44_100);
    const info = readWavInfo(fitToBudget(wav, MAX_AUDIO_BYTES));
    expect(info.channels).toBe(1);
    expect(info.bitsPerSample).toBe(16);
  });

  it("preserves the duration while lowering the sample rate", () => {
    const wav = buildWav(makeTone(MAX_AUDIO_SECONDS, 44_100), 44_100);
    const info = readWavInfo(fitToBudget(wav, MAX_AUDIO_BYTES));
    const seconds = info.dataBytes / 2 / info.sampleRate;
    expect(seconds).toBeGreaterThanOrEqual(MAX_AUDIO_SECONDS - 0.5);
    expect(seconds).toBeLessThanOrEqual(MAX_AUDIO_SECONDS + 0.5);
  });

  it("throws when the budget cannot be met", () => {
    const wav = buildWav(makeTone(1), SAMPLE_RATE);
    expect(() => fitToBudget(wav, 100)).toThrow();
  });
});
