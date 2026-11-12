import type { SonifyPort } from "../ports";

export type SonifyOptions = {
  /** Path to the `image2sound` executable (or a venv python wrapper). */
  bin: string;
  /** Hard kill after this many milliseconds. */
  timeoutMs: number;
};

export class SonifyError extends Error {
  readonly exitCode: number | null;
  readonly stderr: string;

  constructor(message: string, exitCode: number | null, stderr: string) {
    super(message);
    this.name = "SonifyError";
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

/**
 * Runs the external sonifier as a child process.
 *
 * The CLI contract is `image2sound <image> <seconds> <out.wav>`. If the real
 * binary differs, only `buildArgs` needs to change.
 */
export const buildArgs = (
  imagePath: string,
  seconds: number,
  outPath: string,
): string[] => [imagePath, String(seconds), outPath];

export const createSonifyAdapter = (options: SonifyOptions): SonifyPort => ({
  async run(imagePath, seconds, outPath) {
    const proc = Bun.spawn({
      cmd: [options.bin, ...buildArgs(imagePath, seconds, outPath)],
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
    });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
    }, options.timeoutMs);

    try {
      const [exitCode, stderr] = await Promise.all([
        proc.exited,
        new Response(proc.stderr).text(),
      ]);

      if (exitCode !== 0) {
        throw new SonifyError(
          `image2sound exited with code ${exitCode}`,
          exitCode,
          stderr.slice(0, 2_000),
        );
      }
    } finally {
      clearTimeout(timer);
    }
  },
});
