import { useEffect, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { SessionMode, TimerHandlers, TimerStateRef } from "../types/timer";

interface UsePomodoroTimerOptions {
  isFollowWindow: boolean;
  onTimerCompleteWork: () => void;
  onTimerCompleteBreak: () => void;
  onStartTimerCheck: (durationMs: number) => void;
  onStopTimerCheck: () => void;
}

interface UsePomodoroTimerResult {
  timeLeft: number;
  isRunning: boolean;
  isWorkSession: boolean;
  workTime: number;
  breakTime: number;
  setTimeLeft: Dispatch<SetStateAction<number>>;
  setIsRunning: Dispatch<SetStateAction<boolean>>;
  setIsWorkSession: Dispatch<SetStateAction<boolean>>;
  setWorkTime: Dispatch<SetStateAction<number>>;
  setBreakTime: Dispatch<SetStateAction<number>>;
  timerIntervalRef: MutableRefObject<NodeJS.Timeout | null>;
  endTimeRef: MutableRefObject<number | null>;
  stateRef: MutableRefObject<TimerStateRef>;
  handlersRef: MutableRefObject<TimerHandlers>;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: SessionMode) => void;
  timerComplete: () => void;
}

export function usePomodoroTimer({
  isFollowWindow,
  onTimerCompleteWork,
  onTimerCompleteBreak,
  onStartTimerCheck,
  onStopTimerCheck,
}: UsePomodoroTimerOptions): UsePomodoroTimerResult {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const stateRef = useRef<TimerStateRef>({
    timeLeft,
    isWorkSession,
    isRunning,
    endTime: endTimeRef.current,
    workTime,
    breakTime,
  });
  const handlersRef = useRef<TimerHandlers>({
    startTimer: () => {},
    pauseTimer: () => {},
    resetTimer: () => {},
    switchMode: () => {},
  });

  useEffect(() => {
    stateRef.current = {
      timeLeft,
      isWorkSession,
      isRunning,
      endTime: endTimeRef.current,
      workTime,
      breakTime,
    };
  }, [timeLeft, isWorkSession, isRunning, workTime, breakTime]);

  const timerComplete = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRunning(false);

    if (stateRef.current.isWorkSession) {
      onTimerCompleteWork();
      setIsWorkSession(false);
      setTimeLeft(stateRef.current.breakTime * 60);
    } else {
      onTimerCompleteBreak();
      setIsWorkSession(true);
      setTimeLeft(stateRef.current.workTime * 60);
    }

    onStopTimerCheck();
  };

  const startTimer = () => {
    if (stateRef.current.isRunning || isFollowWindow) {
      return;
    }

    setIsRunning(true);
    const endTime = Date.now() + stateRef.current.timeLeft * 1000;
    endTimeRef.current = endTime;

    if (!isFollowWindow) {
      onStartTimerCheck(stateRef.current.timeLeft * 1000);
    }

    timerIntervalRef.current = setInterval(() => {
      if (!endTimeRef.current) {
        return;
      }

      const distance = endTimeRef.current - Date.now();
      const secondsLeft = Math.ceil(distance / 1000);

      if (secondsLeft <= 0) {
        setTimeLeft(0);
        timerComplete();
      } else {
        setTimeLeft(secondsLeft);
      }
    }, 200);
  };

  const pauseTimer = () => {
    if (!stateRef.current.isRunning) {
      return;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRunning(false);
    onStopTimerCheck();
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRunning(false);
    onStopTimerCheck();
    setTimeLeft(
      stateRef.current.isWorkSession
        ? stateRef.current.workTime * 60
        : stateRef.current.breakTime * 60,
    );
  };

  const switchMode = (mode: SessionMode) => {
    if (
      (mode === "work" && stateRef.current.isWorkSession) ||
      (mode === "break" && !stateRef.current.isWorkSession)
    ) {
      return;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const nextIsWorkSession = mode === "work";
    setIsRunning(false);
    onStopTimerCheck();
    setIsWorkSession(nextIsWorkSession);
    setTimeLeft(nextIsWorkSession ? workTime * 60 : breakTime * 60);
  };

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(isWorkSession ? workTime * 60 : breakTime * 60);
    }
  }, [workTime, breakTime, isWorkSession, isRunning]);

  useEffect(() => {
    handlersRef.current = {
      startTimer,
      pauseTimer,
      resetTimer,
      switchMode,
    };
  }, [pauseTimer, resetTimer, startTimer, switchMode]);

  return {
    timeLeft,
    isRunning,
    isWorkSession,
    workTime,
    breakTime,
    setTimeLeft,
    setIsRunning,
    setIsWorkSession,
    setWorkTime,
    setBreakTime,
    timerIntervalRef,
    endTimeRef,
    stateRef,
    handlersRef,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    timerComplete,
  };
}
