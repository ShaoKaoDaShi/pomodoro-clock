import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { ipcRenderer } from "electron";
import type {
  SessionMode,
  TimerBroadcastState,
  TimerHandlers,
  TimerStateRef,
} from "../types/timer";

interface TimerActionHandlers {
  completeTimer: () => void;
  setTimeLeft: (value: number) => void;
  setIsRunning: (value: boolean) => void;
  setIsWorkSession: (value: boolean) => void;
}

interface UseTimerSyncOptions {
  isFollowWindow: boolean;
  timeLeft: number;
  isRunning: boolean;
  isWorkSession: boolean;
  endTimeRef: MutableRefObject<number | null>;
  stateRef: MutableRefObject<TimerStateRef>;
  handlersRef: MutableRefObject<TimerHandlers>;
  actions: TimerActionHandlers;
}

export function useTimerSync({
  isFollowWindow,
  timeLeft,
  isRunning,
  isWorkSession,
  endTimeRef,
  stateRef,
  handlersRef,
  actions,
}: UseTimerSyncOptions): void {
  useEffect(() => {
    if (isFollowWindow) {
      ipcRenderer.send("request-timer-state");

      const handleTimerUpdate = (
        _event: Electron.IpcRendererEvent,
        state: TimerBroadcastState,
      ) => {
        actions.setIsWorkSession(state.isWorkSession);
        actions.setIsRunning(state.isRunning);
        endTimeRef.current = state.endTime;

        if (!state.isRunning) {
          actions.setTimeLeft(state.timeLeft);
        } else if (state.endTime) {
          const secondsLeft = Math.ceil((state.endTime - Date.now()) / 1000);
          actions.setTimeLeft(secondsLeft > 0 ? secondsLeft : 0);
        }
      };

      ipcRenderer.on("timer-update", handleTimerUpdate);

      return () => {
        ipcRenderer.removeListener("timer-update", handleTimerUpdate);
      };
    }

    const handleRequestState = () => {
      ipcRenderer.send("timer-update", stateRef.current);
    };

    const handleTimerFinishedCheck = () => {
      if (stateRef.current.isRunning) {
        actions.setTimeLeft(0);
        actions.completeTimer();
      }
    };

    const handleStartTimer = () => {
      handlersRef.current.startTimer();
    };

    const handlePauseTimer = () => {
      handlersRef.current.pauseTimer();
    };

    const handleResetTimer = () => {
      handlersRef.current.resetTimer();
    };

    const handleSwitchMode = (
      _event: Electron.IpcRendererEvent,
      mode: SessionMode,
    ) => {
      handlersRef.current.switchMode(mode);
    };

    ipcRenderer.on("request-timer-state", handleRequestState);
    ipcRenderer.on("timer-finished-check", handleTimerFinishedCheck);
    ipcRenderer.on("start-timer", handleStartTimer);
    ipcRenderer.on("pause-timer", handlePauseTimer);
    ipcRenderer.on("reset-timer", handleResetTimer);
    ipcRenderer.on("switch-mode", handleSwitchMode);

    return () => {
      ipcRenderer.removeListener("request-timer-state", handleRequestState);
      ipcRenderer.removeListener("timer-finished-check", handleTimerFinishedCheck);
      ipcRenderer.removeListener("start-timer", handleStartTimer);
      ipcRenderer.removeListener("pause-timer", handlePauseTimer);
      ipcRenderer.removeListener("reset-timer", handleResetTimer);
      ipcRenderer.removeListener("switch-mode", handleSwitchMode);
    };
  }, [actions, endTimeRef, handlersRef, isFollowWindow, stateRef]);

  useEffect(() => {
    if (!isFollowWindow) {
      ipcRenderer.send("timer-update", {
        timeLeft,
        isWorkSession,
        isRunning,
        endTime: endTimeRef.current,
      } satisfies TimerBroadcastState);
    }
  }, [endTimeRef, isFollowWindow, isRunning, isWorkSession, timeLeft]);

  useEffect(() => {
    if (!isFollowWindow || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      if (endTimeRef.current) {
        const secondsLeft = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (secondsLeft >= 0) {
          actions.setTimeLeft(secondsLeft);
        }
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [actions, endTimeRef, isFollowWindow, isRunning]);
}
