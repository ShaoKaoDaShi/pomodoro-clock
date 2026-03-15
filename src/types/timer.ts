export interface TimerBroadcastState {
  timeLeft: number;
  isWorkSession: boolean;
  isRunning: boolean;
  endTime: number | null;
}

export interface TimerStateRef extends TimerBroadcastState {
  workTime: number;
  breakTime: number;
}

export interface TimerHandlers {
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: SessionMode) => void;
}

export type SessionMode = "work" | "break";
