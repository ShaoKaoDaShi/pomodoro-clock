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
  const [isSettingsView, setIsSettingsView] = useState(false);

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

  const handleOpenSettings = () => {
    setIsSettingsView(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsView(false);
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
        {isSettingsView && !isMiniMode ? (
          <SettingsPanel
            isAlwaysOnTop={isAlwaysOnTop}
            isOpenAtLogin={isOpenAtLogin}
            theme={theme}
            updateState={updateState}
            onBack={handleCloseSettings}
            onAlwaysOnTopChange={handleAlwaysOnTopChange}
            onOpenAtLoginChange={handleOpenAtLoginChange}
            onCheckForUpdates={handleCheckForUpdates}
            onInstallDownloadedUpdate={handleInstallDownloadedUpdate}
          />
        ) : (
          <>
            <button
              className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/60 hover:text-gray-500 [-webkit-app-region:no-drag] ${isMiniMode ? "hidden" : ""}`}
              onClick={handleOpenSettings}
              title="设置"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.802-2.942.768-2.14 2.14.43.735.02 1.677-.815 1.882-1.56.38-1.56 2.6 0 2.98.835.205 1.245 1.147.816 1.882-.803 1.372.767 2.942 2.14 2.14a1.532 1.532 0 012.285.948c.38 1.56 2.6 1.56 2.98 0a1.532 1.532 0 012.286-.948c1.372.802 2.942-.768 2.14-2.14a1.532 1.532 0 01.815-1.882c1.56-.38 1.56-2.6 0-2.98a1.532 1.532 0 01-.816-1.882c.803-1.372-.767-2.942-2.14-2.14a1.532 1.532 0 01-2.285-.948zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
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
            <div
              className={`settings-area flex flex-col gap-4 text-left pt-6 border-t ${theme.border} transition-all duration-300 [-webkit-app-region:no-drag] ${isMiniMode ? "hidden" : ""}`}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-3 rounded-xl">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    专注时长
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={timer.workTime}
                      min="1"
                      max="60"
                      className={`w-full bg-transparent font-bold text-lg text-gray-700 outline-none p-0 ${theme.text}`}
                      onChange={handleWorkTimeChange}
                      disabled={timer.isRunning}
                    />
                    <span className="text-xs text-gray-400 ml-1">min</span>
                  </div>
                </div>

                <div className="bg-white/50 p-3 rounded-xl">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    休息时长
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={timer.breakTime}
                      min="1"
                      max="30"
                      className={`w-full bg-transparent font-bold text-lg text-gray-700 outline-none p-0 ${theme.text}`}
                      onChange={handleBreakTimeChange}
                      disabled={timer.isRunning}
                    />
                    <span className="text-xs text-gray-400 ml-1">min</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center px-1">
                <button
                  className={`transition-colors p-2 rounded-full ${
                    isFollowActive
                      ? "text-indigo-500 bg-indigo-50 hover:bg-indigo-100"
                      : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"
                  }`}
                  onClick={handleFollowMouse}
                  title={isFollowActive ? "关闭跟随模式" : "开启跟随模式"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
                    <rect x="12" y="13" width="10" height="7" rx="2" />
                  </svg>
                </button>
                <p className="text-[10px] text-gray-300">
                  Cmd+Shift+X 退出跟随模式
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
