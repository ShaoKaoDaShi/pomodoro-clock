import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { ipcRenderer } from "electron";
import ModeSwitch from "./components/ModeSwitch";
import SettingsPanel from "./components/SettingsPanel";
import TimerControls from "./components/TimerControls";
import TimerDisplay from "./components/TimerDisplay";
import { getTheme } from "./constants/theme";
import { usePomodoroTimer } from "./hooks/usePomodoroTimer";
import { useTimerSync } from "./hooks/useTimerSync";
import { useWindowControls } from "./hooks/useWindowControls";
import type { UpdateState } from "./types/update";
import { formatTime } from "./utils/time";

const initialUpdateState: UpdateState = {
  status: "idle",
  currentVersion: "",
};

const App = () => {
  const isFollowWindow = window.location.hash === "#follow";
  const isMiniMode = isFollowWindow;
  const {
    isAlwaysOnTop,
    isOpenAtLogin,
    isFollowActive,
    handleAlwaysOnTopChange,
    handleOpenAtLoginChange,
    handleFollowMouse,
  } = useWindowControls({
    isFollowWindow,
  });
  const [updateState, setUpdateState] =
    useState<UpdateState>(initialUpdateState);

  useEffect(() => {
    if (isFollowWindow) {
      return;
    }

    const handleUpdateStateChanged = (_event: unknown, state: UpdateState) => {
      setUpdateState(state);
    };

    ipcRenderer.on("update-state-changed", handleUpdateStateChanged);
    ipcRenderer.send("request-update-state");

    return () => {
      ipcRenderer.removeListener(
        "update-state-changed",
        handleUpdateStateChanged,
      );
    };
  }, [isFollowWindow]);

  const playSound = (isWorkSession: boolean) => {
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = isWorkSession ? 880 : 523;
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const sendNotification = (title: string, body: string) => {
    ipcRenderer.send("show-notification", { title, body });
  };

  const handleTimerCompleteWork = () => {
    playSound(true);
    sendNotification("专注完成", "做得好！休息一下吧。");
  };

  const handleTimerCompleteBreak = () => {
    playSound(false);
    sendNotification("休息结束", "准备好开始新的专注了吗？");
  };

  const startTimerCheck = (durationMs: number) => {
    ipcRenderer.send("start-timer-check", durationMs);
  };

  const stopTimerCheck = () => {
    ipcRenderer.send("stop-timer-check");
  };

  const handleCheckForUpdates = () => {
    ipcRenderer.send("check-for-updates");
  };

  const handleInstallDownloadedUpdate = () => {
    ipcRenderer.send("install-downloaded-update");
  };

  const timer = usePomodoroTimer({
    isFollowWindow,
    onTimerCompleteWork: handleTimerCompleteWork,
    onTimerCompleteBreak: handleTimerCompleteBreak,
    onStartTimerCheck: startTimerCheck,
    onStopTimerCheck: stopTimerCheck,
  });

  const timerActions = useMemo(
    () => ({
      completeTimer: timer.timerComplete,
      setTimeLeft: (value: number) => timer.setTimeLeft(value),
      setIsRunning: (value: boolean) => timer.setIsRunning(value),
      setIsWorkSession: (value: boolean) => timer.setIsWorkSession(value),
    }),
    [timer],
  );

  useTimerSync({
    isFollowWindow,
    timeLeft: timer.timeLeft,
    isRunning: timer.isRunning,
    isWorkSession: timer.isWorkSession,
    endTimeRef: timer.endTimeRef,
    stateRef: timer.stateRef,
    handlersRef: timer.handlersRef,
    actions: timerActions,
  });

  const handleWorkTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    timer.setWorkTime(Number(event.target.value));
  };

  const handleBreakTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    timer.setBreakTime(Number(event.target.value));
  };

  const theme = getTheme(timer.isWorkSession);
  const formattedTime = formatTime(timer.timeLeft);
  const statusText = timer.isRunning
    ? timer.isWorkSession
      ? "保持专注..."
      : "享受休息..."
    : timer.timeLeft === 0
      ? "时间到！"
      : timer.timerIntervalRef.current
        ? "已暂停"
        : "准备开始";
  const timerTextClassName = `
    font-mono tracking-tighter tabular-nums transition-all duration-300
    ${
      isMiniMode
        ? `text-sm font-bold px-3 py-1 rounded-full border backdrop-blur-md shadow-sm ${theme.mini}`
        : "text-7xl mb-2 font-light text-gray-800"
    }
  `;
  const primaryButtonClassName = `flex-1 py-3 px-6 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 ${theme.button}`;
  const secondaryButtonClassName = `w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ${theme.buttonSecondary}`;

  return (
    <div className="flex justify-center items-center h-screen w-screen overflow-hidden select-none bg-transparent transition-colors duration-500">
      <div
        id="app-container"
        className={`
          relative transition-all duration-300 ease-in-out [-webkit-app-region:drag]
          ${
            isMiniMode
              ? "mini-mode"
              : `w-80 p-8 rounded-4xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/60 bg-gradient-to-br ${theme.bg}`
          }
        `}
      >
        <ModeSwitch
          isHidden={isMiniMode}
          isWorkSession={timer.isWorkSession}
          onSwitchMode={timer.switchMode}
        />
        <TimerDisplay
          formattedTime={formattedTime}
          isMiniMode={isMiniMode}
          timerTextClassName={timerTextClassName}
          statusText={statusText}
        />
        <TimerControls
          isHidden={isMiniMode}
          isRunning={timer.isRunning}
          primaryButtonClassName={primaryButtonClassName}
          secondaryButtonClassName={secondaryButtonClassName}
          onStart={timer.startTimer}
          onPause={timer.pauseTimer}
          onReset={timer.resetTimer}
        />
        <SettingsPanel
          isHidden={isMiniMode}
          workTime={timer.workTime}
          breakTime={timer.breakTime}
          isRunning={timer.isRunning}
          isAlwaysOnTop={isAlwaysOnTop}
          isOpenAtLogin={isOpenAtLogin}
          isFollowActive={isFollowActive}
          theme={theme}
          updateState={updateState}
          onWorkTimeChange={handleWorkTimeChange}
          onBreakTimeChange={handleBreakTimeChange}
          onAlwaysOnTopChange={handleAlwaysOnTopChange}
          onOpenAtLoginChange={handleOpenAtLoginChange}
          onFollowMouse={handleFollowMouse}
          onCheckForUpdates={handleCheckForUpdates}
          onInstallDownloadedUpdate={handleInstallDownloadedUpdate}
        />
      </div>
    </div>
  );
};

export default App;
