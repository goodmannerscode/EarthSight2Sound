"use client";

import { useCallback, type KeyboardEvent, type MouseEvent } from "react";
import { useAudio } from "@/components/AudioProvider";

type PlayerCardProps = {
  id: string;
  src: string;
  title?: string;
};

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
};

const ratioFromEvent = (
  event: MouseEvent<HTMLDivElement>,
): number => {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
};

export function PlayerCard({ id, src, title }: PlayerCardProps) {
  const {
    currentId,
    isPlaying,
    volume,
    muted,
    progress,
    duration,
    toggle,
    seek,
    setVolume,
    toggleMute,
  } = useAudio();

  const isCurrent = currentId === id;
  const shownProgress = isCurrent ? progress : 0;
  const shownDuration = isCurrent ? duration : 0;

  const onSeek = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!isCurrent) return;
      seek(ratioFromEvent(event));
    },
    [isCurrent, seek],
  );

  const onSeekKey = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isCurrent) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        seek(progress + 0.05);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seek(progress - 0.05);
      } else if (event.key === "Home") {
        event.preventDefault();
        seek(0);
      } else if (event.key === "End") {
        event.preventDefault();
        seek(1);
      }
    },
    [isCurrent, progress, seek],
  );

  const onVolume = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      setVolume(ratioFromEvent(event));
    },
    [setVolume],
  );

  const onVolumeKey = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        setVolume(volume + 0.05);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        setVolume(volume - 0.05);
      }
    },
    [setVolume, volume],
  );

  const effectiveVolume = muted ? 0 : volume;

  return (
    <div
      className="glass flex items-center gap-3 px-3 py-2"
      role="group"
      aria-label={title ? `Player for ${title}` : "Audio player"}
    >
      <button
        type="button"
        onClick={() => toggle(id, src)}
        aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
        aria-pressed={isCurrent && isPlaying}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-earth-600 text-white transition-colors hover:bg-earth-500"
      >
        {isCurrent && isPlaying ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.29-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
          </svg>
        )}
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          role="slider"
          tabIndex={isCurrent ? 0 : -1}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(shownProgress * 100)}
          aria-valuetext={`${formatTime(shownProgress * shownDuration)} of ${formatTime(shownDuration)}`}
          aria-disabled={!isCurrent}
          onClick={onSeek}
          onKeyDown={onSeekKey}
          className={`group relative h-2 flex-1 rounded-full bg-white/15 ${
            isCurrent ? "cursor-pointer" : "cursor-default opacity-60"
          }`}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-earth-400 transition-[width] duration-150"
            style={{ width: `${shownProgress * 100}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
            style={{ left: `${shownProgress * 100}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-white/50">
          {formatTime(shownProgress * shownDuration)}
        </span>
      </div>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        {muted || volume === 0 ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
            <path d="M4 9v6h4l5 4V5L8 9H4Zm12.5 3 2.5-2.5-1-1L15.5 11 13 8.5l-1 1L14.5 12 12 14.5l1 1 2.5-2.5 2.5 2.5 1-1L16.5 12Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
            <path d="M4 9v6h4l5 4V5L8 9H4Zm11.5-1.5a5 5 0 0 1 0 9v-2a3 3 0 0 0 0-5v-2Z" />
          </svg>
        )}
      </button>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(effectiveVolume * 100)}
        onClick={onVolume}
        onKeyDown={onVolumeKey}
        className="group relative h-2 w-20 shrink-0 cursor-pointer rounded-full bg-white/15"
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-white/70 transition-[width] duration-150"
          style={{ width: `${effectiveVolume * 100}%` }}
        />
      </div>
    </div>
  );
}
