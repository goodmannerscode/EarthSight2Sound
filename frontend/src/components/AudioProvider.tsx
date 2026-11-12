"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AudioContextValue = {
  currentId: string | null;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  progress: number;
  duration: number;
  play: (id: string, src: string) => void;
  pause: () => void;
  toggle: (id: string, src: string) => void;
  seek: (ratio: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
};

const AudioCtx = createContext<AudioContextValue | null>(null);

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);
    };
    const onDurationChange = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = clamp01(volume);
    audio.muted = muted;
  }, [volume, muted]);

  const play = useCallback((id: string, src: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== src) {
      audio.src = src;
      setProgress(0);
      setDuration(0);
    }
    setCurrentId(id);
    void audio.play().catch(() => setIsPlaying(false));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(
    (id: string, src: string) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (currentId === id && !audio.paused) {
        audio.pause();
        return;
      }
      play(id, src);
    },
    [currentId, play],
  );

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = clamp01(ratio) * audio.duration;
    setProgress(clamp01(ratio));
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(clamp01(value));
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((value) => !value);
  }, []);

  const value = useMemo<AudioContextValue>(
    () => ({
      currentId,
      isPlaying,
      volume,
      muted,
      progress,
      duration,
      play,
      pause,
      toggle,
      seek,
      setVolume,
      toggleMute,
    }),
    [
      currentId,
      isPlaying,
      volume,
      muted,
      progress,
      duration,
      play,
      pause,
      toggle,
      seek,
      setVolume,
      toggleMute,
    ],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) {
    throw new Error("useAudio must be used inside <AudioProvider>");
  }
  return ctx;
}
