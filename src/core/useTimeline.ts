import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { TimelineStoryboard, TimelineStep, CanvasEntities } from '../types/timeline';
import { computeTimelineState } from './timelineReducer';

export interface UseTimelineOptions {
  initialStepIndex?: number;
  onStepChange?: (step: TimelineStep) => void;
  defaultSpeed?: number;
}

export interface UseTimelineReturn {
  currentStepIndex: number;
  currentStep: TimelineStep | undefined;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  canvasState: CanvasEntities;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepNext: () => void;
  stepPrev: () => void;
  seekTo: (stepIndex: number) => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
}

export function useTimeline(
  storyboard: TimelineStoryboard,
  options: UseTimelineOptions = {}
): UseTimelineReturn {
  const { initialStepIndex = 0, onStepChange, defaultSpeed = 1 } = options;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    const maxIdx = Math.max(storyboard.steps.length - 1, 0);
    return Math.min(Math.max(initialStepIndex, 0), maxIdx);
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(defaultSpeed);
  const [prevStoryboardId, setPrevStoryboardId] = useState<string>(storyboard.id);

  // Synchronously reset state during render when storyboard changes
  if (storyboard.id !== prevStoryboardId) {
    setPrevStoryboardId(storyboard.id);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }

  const totalSteps = storyboard.steps.length;
  const currentStep = storyboard.steps[currentStepIndex];

  // Compute exact canvas state for current step deterministically
  const canvasState = useMemo(() => {
    return computeTimelineState(
      storyboard.initialState,
      storyboard.steps,
      currentStepIndex
    );
  }, [storyboard, currentStepIndex]);

  // Keep latest onStepChange in a ref to avoid stale closures in effects
  const onStepChangeRef = useRef(onStepChange);
  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  // Handle step index updates
  const seekTo = useCallback(
    (targetIndex: number) => {
      const maxIdx = Math.max(totalSteps - 1, 0);
      const bounded = Math.min(Math.max(targetIndex, 0), maxIdx);
      setCurrentStepIndex(bounded);
      const step = storyboard.steps[bounded];
      if (step && onStepChangeRef.current) {
        onStepChangeRef.current(step);
      }
    },
    [totalSteps, storyboard.steps]
  );

  const stepNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      seekTo(currentStepIndex + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, totalSteps, seekTo]);

  const stepPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      seekTo(currentStepIndex - 1);
    }
  }, [currentStepIndex, seekTo]);

  const play = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      seekTo(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, totalSteps, seekTo]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    seekTo(0);
  }, [seekTo]);

  // Auto-stepping timer
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (isPlaying) {
      const delayMs = Math.max(2400 / speed, 300);
      timerRef.current = window.setTimeout(() => {
        if (currentStepIndex < totalSteps - 1) {
          seekTo(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, delayMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentStepIndex, totalSteps, speed, seekTo]);


  return {
    currentStepIndex,
    currentStep,
    totalSteps,
    isPlaying,
    speed,
    canvasState,
    play,
    pause,
    togglePlay,
    stepNext,
    stepPrev,
    seekTo,
    reset,
    setSpeed,
  };
}
