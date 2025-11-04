import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type QuizTimerSnapshot = {
  attemptId: string | null;
  totalSeconds: number;
  remainingSeconds: number;
  startedAt: number | null;
  lastPausedAt: number | null;
  isRunning: boolean;
  completedAt: number | null;
};

const createInitialState = (): QuizTimerSnapshot => ({
  attemptId: null,
  totalSeconds: 0,
  remainingSeconds: 0,
  startedAt: null,
  lastPausedAt: null,
  isRunning: false,
  completedAt: null,
});

type UseQuizTimerOptions = {
  storageKey: string;
  onExpire?: () => void;
};

type UseQuizTimerReturn = {
  state: QuizTimerSnapshot;
  start: (totalSeconds: number, attemptId?: string) => void;
  reset: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  remainingSeconds: number;
  totalSeconds: number;
  timeTakenSeconds: number;
  isExpired: boolean;
};

const STORAGE_VERSION = "v1";

type PersistedTimer = QuizTimerSnapshot & { version: string };

const loadFromStorage = (storageKey: string): QuizTimerSnapshot => {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as PersistedTimer;
    if (!parsed || parsed.version !== STORAGE_VERSION) return createInitialState();

    const remainingSeconds = Math.max(0, Math.round(parsed.remainingSeconds));
    const totalSeconds = Math.max(0, Math.round(parsed.totalSeconds));

    return {
      attemptId: parsed.attemptId,
      totalSeconds,
      remainingSeconds,
      startedAt: parsed.startedAt ?? null,
      lastPausedAt: parsed.lastPausedAt ?? null,
      isRunning: Boolean(parsed.isRunning) && remainingSeconds > 0,
      completedAt: parsed.completedAt ?? null,
    } satisfies QuizTimerSnapshot;
  } catch (error) {
    console.error("[useQuizTimer] Failed to restore timer state", error);
    return createInitialState();
  }
};

const persistState = (storageKey: string, state: QuizTimerSnapshot) => {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedTimer = { ...state, version: STORAGE_VERSION };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    console.error("[useQuizTimer] Failed to persist timer state", error);
  }
};

export function useQuizTimer({ storageKey, onExpire }: UseQuizTimerOptions): UseQuizTimerReturn {
  const [state, setState] = useState<QuizTimerSnapshot>(() => loadFromStorage(storageKey));
  const intervalRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  const stateRef = useRef(state);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist any state transitions
  useEffect(() => {
    persistState(storageKey, state);
  }, [state, storageKey]);

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning || prev.remainingSeconds <= 0) {
        return prev;
      }

      const nextRemaining = prev.remainingSeconds - 1;
      if (nextRemaining <= 0) {
        clearIntervalRef();
        const completedAt = Date.now();
        // Call expire callback outside of state update to avoid React warnings
        queueMicrotask(() => {
          onExpireRef.current?.();
        });
        return {
          ...prev,
          remainingSeconds: 0,
          isRunning: false,
          completedAt,
        } satisfies QuizTimerSnapshot;
      }

      return {
        ...prev,
        remainingSeconds: nextRemaining,
      } satisfies QuizTimerSnapshot;
    });
  }, [clearIntervalRef]);

  useEffect(() => {
    if (state.isRunning && state.remainingSeconds > 0 && intervalRef.current === null) {
      intervalRef.current = window.setInterval(tick, 1000);
    }

    if ((!state.isRunning || state.remainingSeconds <= 0) && intervalRef.current !== null) {
      clearIntervalRef();
    }

    return () => {
      clearIntervalRef();
    };
  }, [state.isRunning, state.remainingSeconds, tick, clearIntervalRef]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setState((prev) => {
        if (document.visibilityState === "hidden") {
          if (!prev.isRunning) return prev;
          return {
            ...prev,
            isRunning: false,
            lastPausedAt: Date.now(),
          } satisfies QuizTimerSnapshot;
        }

        if (document.visibilityState === "visible") {
          if (prev.isRunning || prev.remainingSeconds <= 0) return prev;
          return {
            ...prev,
            isRunning: true,
            lastPausedAt: null,
          } satisfies QuizTimerSnapshot;
        }

        return prev;
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = () => {
      const snapshot = stateRef.current;
      const next: QuizTimerSnapshot = {
        ...snapshot,
        isRunning: false,
        lastPausedAt: Date.now(),
      };
      persistState(storageKey, next);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [storageKey]);

  const start = useCallback(
    (totalSeconds: number, attemptId?: string) => {
      const normalized = Math.max(0, Math.floor(totalSeconds));
      if (normalized <= 0) {
        setState(createInitialState());
        return;
      }

      setState({
        attemptId: attemptId ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())),
        totalSeconds: normalized,
        remainingSeconds: normalized,
        startedAt: Date.now(),
        lastPausedAt: null,
        isRunning: true,
        completedAt: null,
      });
    },
    [],
  );

  const reset = useCallback(() => {
    clearIntervalRef();
    const next = createInitialState();
    setState(next);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey, clearIntervalRef]);

  const stop = useCallback(() => {
    clearIntervalRef();
    setState((prev) => ({
      ...prev,
      isRunning: false,
      remainingSeconds: 0,
      completedAt: prev.completedAt ?? Date.now(),
    }));
  }, [clearIntervalRef]);

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning) return prev;
      return {
        ...prev,
        isRunning: false,
        lastPausedAt: Date.now(),
      } satisfies QuizTimerSnapshot;
    });
  }, []);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning || prev.remainingSeconds <= 0) return prev;
      return {
        ...prev,
        isRunning: true,
        lastPausedAt: null,
      } satisfies QuizTimerSnapshot;
    });
  }, []);

  const remainingSeconds = state.remainingSeconds;
  const totalSeconds = state.totalSeconds;

  const timeTakenSeconds = useMemo(() => {
    if (!state.startedAt) return 0;
    return Math.max(0, totalSeconds - remainingSeconds);
  }, [totalSeconds, remainingSeconds, state.startedAt]);

  const isExpired = totalSeconds > 0 && remainingSeconds <= 0;

  return {
    state,
    start,
    reset,
    stop,
    pause,
    resume,
    remainingSeconds,
    totalSeconds,
    timeTakenSeconds,
    isExpired,
  };
}
