import type { SonifyPort } from "../ports";

export type SonifyOptions = {
  /** Path to the Python interpreter that runs `image2sound`. */
  bin: string;
  /** Directory containing `main.py`; the CLI resolves its assets relative to it. */
  scriptDir: string;
  /** Hard kill after this many milliseconds. */
  timeoutMs: number;
  /** Lower bound passed to `--min-duration`. */
  minSeconds: number;
  /** Upper bound passed to `--max-duration`. */
  maxSeconds: number;
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
 * The CLI contract is `python main.py -p <image> -o <dir> --min-duration N
 * --max-duration N`. It writes a single timestamped WAV into `outDir`; we scan
 * for it rather than parsing stdout. If the real CLI changes, only `buildArgs`
 * needs to change.
 */
export const buildArgs = (
  imagePath: string,
  outDir: string,
  minSeconds: number,
  maxSeconds: number,
): string[] => [
  "main.py",
  "-p",
  imagePath,
  "-o",
  outDir,
  "--min-duration",
  String(minSeconds),
  "--max-duration",
  String(maxSeconds),
];

export const createSonifyAdapter = (options: SonifyOptions): SonifyPort => ({
  async run(imagePath, outDir) {
    const proc = Bun.spawn({
      cmd: [
        options.bin,
        ...buildArgs(imagePath, outDir, options.minSeconds, options.maxSeconds),
      ],
      cwd: options.scriptDir,
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

    const produced = await Array.fromAsync(
      new Bun.Glob("*.wav").scan({ cwd: outDir, absolute: true }),
    );
    const first = produced[0];
    if (!first) {
      throw new SonifyError("image2sound produced no WAV file", 0, "");
    }
    return first;
  },
});
