import React, { useState, useEffect, useRef } from "react";
import { ipcRenderer } from "electron";

const App = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(
    window.location.hash === "#follow",
  );
  const [isFollowActive, setIsFollowActive] = useState(false);
  const isFollowWindow = window.location.hash === "#follow";

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Ref to hold current state for IPC handlers to avoid stale closures
  const stateRef = useRef({
    timeLeft,
    isWorkSession,
    isRunning,
    endTime: endTimeRef.current,
    workTime,
    breakTime,
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

  // Ref to hold latest handlers
  const handlersRef = useRef({
    startTimer: () => {},
    pauseTimer: () => {},
    resetTimer: () => {},
    switchMode: (_mode: "work" | "break") => {},
  });

  // ... (Function definitions)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const playSound = () => {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = stateRef.current.isWorkSession ? 880 : 523; // Different tones
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const sendNotification = (title: string, body: string) => {
    ipcRenderer.send("show-notification", { title, body });
  };

  const timerComplete = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRunning(false);
    playSound();

    const currentState = stateRef.current;

    if (currentState.isWorkSession) {
      sendNotification("专注完成", "做得好！休息一下吧。");
      setIsWorkSession(false);
      setTimeLeft(currentState.breakTime * 60);
    } else {
      sendNotification("休息结束", "准备好开始新的专注了吗？");
      setIsWorkSession(true);
      setTimeLeft(currentState.workTime * 60);
    }

    // 清除主进程兜底
    ipcRenderer.send("stop-timer-check");
  };

  const startTimer = () => {
    if (isRunning) return;
    if (isFollowWindow) return; // Follow window is passive

    setIsRunning(true);
    // 使用 Date.now() 计算目标时间，防止浏览器后台节流导致计时器变慢或停止
    const endTime = Date.now() + timeLeft * 1000;
    endTimeRef.current = endTime;

    // 告诉主进程，在 timeLeft 秒后提醒我，防止我睡着了
    if (!isFollowWindow) {
      ipcRenderer.send("start-timer-check", timeLeft * 1000);
    }

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (!endTimeRef.current) return;

      const distance = endTimeRef.current - now;
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
    if (!isRunning) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRunning(false);
    ipcRenderer.send("stop-timer-check");
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRunning(false);
    ipcRenderer.send("stop-timer-check");
    // setIsWorkSession(true); // Don't force work session
    if (isWorkSession) {
      setTimeLeft(workTime * 60);
    } else {
      setTimeLeft(breakTime * 60);
    }
  };

  // IPC Listeners Setup
  useEffect(() => {
    if (isFollowWindow) {
      ipcRenderer.send("request-timer-state");

      const handleTimerUpdate = (
        _event: any,
        state: {
          timeLeft: number;
          isWorkSession: boolean;
          isRunning: boolean;
          endTime: number | null;
        },
      ) => {
        setIsWorkSession(state.isWorkSession);
        setIsRunning(state.isRunning);
        endTimeRef.current = state.endTime;

        if (!state.isRunning) {
          setTimeLeft(state.timeLeft);
        } else if (state.endTime) {
          // If running, immediately calculate time left based on endTime to avoid jump
          const now = Date.now();
          const distance = state.endTime - now;
          const secondsLeft = Math.ceil(distance / 1000);
          setTimeLeft(secondsLeft > 0 ? secondsLeft : 0);
        }
      };

      ipcRenderer.on("timer-update", handleTimerUpdate);
      return () => {
        ipcRenderer.removeListener("timer-update", handleTimerUpdate);
      };
    } else {
      // Main window listens for state requests from follow window
      const handleRequestState = () => {
        ipcRenderer.send("timer-update", stateRef.current);
      };

      const handleTimerFinishedCheck = () => {
        // 主进程发来通知说时间到了，作为兜底
        if (stateRef.current.isRunning) {
          setTimeLeft(0);
          timerComplete();
        }
      };

      // Listen for tray menu commands
      const handleStartTimer = () => {
        handlersRef.current.startTimer();
      };

      const handlePauseTimer = () => {
        handlersRef.current.pauseTimer();
      };

      const handleResetTimer = () => {
        handlersRef.current.resetTimer();
      };

      const handleSwitchMode = (_event: any, mode: "work" | "break") => {
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
        ipcRenderer.removeListener(
          "timer-finished-check",
          handleTimerFinishedCheck,
        );
        ipcRenderer.removeListener("start-timer", handleStartTimer);
        ipcRenderer.removeListener("pause-timer", handlePauseTimer);
        ipcRenderer.removeListener("reset-timer", handleResetTimer);
        ipcRenderer.removeListener("switch-mode", handleSwitchMode);
      };
    }
  }, [isFollowWindow]);

  // Local timer for Follow Window to update UI smoothly
  useEffect(() => {
    if (!isFollowWindow) return;

    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const distance = endTimeRef.current - now;
          const secondsLeft = Math.ceil(distance / 1000);
          if (secondsLeft >= 0) {
            setTimeLeft(secondsLeft);
          }
        }
      }, 200);
    }

    return () => clearInterval(interval);
  }, [isFollowWindow, isRunning]);

  // Broadcaster (Main Window only)
  useEffect(() => {
    if (!isFollowWindow) {
      ipcRenderer.send("timer-update", {
        timeLeft,
        isWorkSession,
        isRunning,
        endTime: endTimeRef.current,
      });
    }
  }, [isFollowWindow, timeLeft, isWorkSession, isRunning]);

  const handleFollowMouse = () => {
    if (isFollowActive) {
      ipcRenderer.send("stop-follow-mouse");
    } else {
      ipcRenderer.send("start-follow-mouse");
    }
    // setIsMiniMode(true); // Don't hide main UI
  };

  const handleAlwaysOnTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAlwaysOnTop(e.target.checked);
    ipcRenderer.send("toggle-always-on-top", e.target.checked);
  };

  useEffect(() => {
    // Listen for follow mode status changes from main process
    const handleFollowChange = (_: any, isActive: boolean) => {
      setIsFollowActive(isActive);
    };
    ipcRenderer.on("follow-mode-changed", handleFollowChange);

    // Check initial status
    ipcRenderer.send("check-follow-status");

    return () => {
      ipcRenderer.removeListener("follow-mode-changed", handleFollowChange);
    };
  }, []);

  // Window resize handler
  useEffect(() => {
    if (isFollowWindow) return;

    const updateWindowSize = () => {
      const container = document.getElementById("app-container");
      if (container) {
        // Get the actual rendered size
        const { offsetWidth, offsetHeight } = container;

        // Add buffer for shadows (shadow-2xl) and rounded corners
        // The container is centered in the window
        // We need enough space for the shadow to be visible
        const shadowBuffer = 60;

        ipcRenderer.send("resize-window", {
          width: offsetWidth + shadowBuffer,
          height: offsetHeight + shadowBuffer,
        });
      }
    };

    // Create observer to watch for size changes
    const observer = new ResizeObserver(() => {
      // Use requestAnimationFrame to debounce and ensure render is complete
      requestAnimationFrame(updateWindowSize);
    });

    const container = document.getElementById("app-container");
    if (container) {
      observer.observe(container);
      // Initial sizing
      updateWindowSize();
    }

    return () => observer.disconnect();
  }, [isFollowWindow]);

  // Update time when settings change and not running
  useEffect(() => {
    if (!isRunning) {
      if (isWorkSession) {
        setTimeLeft(workTime * 60);
      } else {
        setTimeLeft(breakTime * 60);
      }
    }
  }, [workTime, breakTime, isWorkSession, isRunning]);

  // Theme configuration based on session state
  const theme = isWorkSession
    ? {
        bg: "from-indigo-50 to-blue-50",
        text: "text-indigo-600",
        button: "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200",
        buttonSecondary: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
        ring: "focus:ring-indigo-200",
        border: "border-indigo-100",
        mini: "bg-indigo-50/90 text-indigo-600 border-indigo-200/50 shadow-indigo-100/50",
      }
    : {
        bg: "from-teal-50 to-emerald-50",
        text: "text-teal-600",
        button: "bg-teal-500 hover:bg-teal-600 shadow-teal-200",
        buttonSecondary: "bg-teal-100 text-teal-700 hover:bg-teal-200",
        ring: "focus:ring-teal-200",
        border: "border-teal-100",
        mini: "bg-teal-50/90 text-teal-600 border-teal-200/50 shadow-teal-100/50",
      };

  const switchMode = (mode: "work" | "break") => {
    if (
      (mode === "work" && isWorkSession) ||
      (mode === "break" && !isWorkSession)
    )
      return;

    // Stop timer if running
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRunning(false);
    ipcRenderer.send("stop-timer-check");

    // Switch mode
    const isWork = mode === "work";
    setIsWorkSession(isWork);
    setTimeLeft(isWork ? workTime * 60 : breakTime * 60);
  };

  // Update handlers ref on every render
  handlersRef.current = {
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
  };

  return (
    <div
      className={`flex justify-center items-center h-screen w-screen overflow-hidden select-none bg-transparent transition-colors duration-500`}
    >
      {/* 拖拽区域 - Removed separate drag region, moved to app-container */}

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
        {/* Header - Mode Switcher */}
        <div
          className={`flex justify-center mb-6 gap-2 ${isMiniMode ? "hidden" : ""} [-webkit-app-region:no-drag]`}
        >
          <button
            onClick={() => switchMode("work")}
            className={`text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full transition-all duration-300 ${
              isWorkSession
                ? "bg-white shadow-sm text-indigo-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode("break")}
            className={`text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full transition-all duration-300 ${
              !isWorkSession
                ? "bg-white shadow-sm text-teal-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Break
          </button>
        </div>

        {/* Timer Display */}
        <div className="text-center relative">
          <div
            id="timer"
            className={`
            font-mono tracking-tighter tabular-nums transition-all duration-300
            ${
              isMiniMode
                ? `text-sm font-bold px-3 py-1 rounded-full border backdrop-blur-md shadow-sm ${theme.mini}`
                : "text-7xl mb-2 font-light text-gray-800"
            }
          `}
          >
            {formatTime(timeLeft)}
          </div>

          <div
            className={`text-sm font-medium text-gray-500 mb-8 h-6 ${isMiniMode ? "hidden" : ""}`}
            id="status-text"
          >
            {isRunning
              ? isWorkSession
                ? "保持专注..."
                : "享受休息..."
              : timeLeft === 0
                ? "时间到！"
                : timerIntervalRef.current
                  ? "已暂停"
                  : "准备开始"}
          </div>
        </div>

        {/* Main Controls */}
        <div
          className={`flex justify-center gap-4 mb-8 controls-area [-webkit-app-region:no-drag] ${isMiniMode ? "hidden" : ""}`}
        >
          {!isRunning ? (
            <button
              className={`flex-1 py-3 px-6 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 ${theme.button}`}
              onClick={startTimer}
            >
              开始
            </button>
          ) : (
            <button
              className="flex-1 py-3 px-6 rounded-2xl bg-amber-400 text-amber-900 font-semibold shadow-lg shadow-amber-100 hover:bg-amber-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200"
              onClick={pauseTimer}
            >
              暂停
            </button>
          )}

          <button
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ${theme.buttonSecondary}`}
            onClick={resetTimer}
            title="重置"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Settings Area */}
        <div
          className={`
          flex flex-col gap-4 text-left pt-6 border-t ${theme.border} 
          settings-area transition-all duration-300 [-webkit-app-region:no-drag]
          ${isMiniMode ? "hidden" : ""}
        `}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 p-3 rounded-xl">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                专注时长
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={workTime}
                  min="1"
                  max="60"
                  className={`w-full bg-transparent font-bold text-lg text-gray-700 outline-none p-0 ${theme.text}`}
                  onChange={(e) => setWorkTime(Number(e.target.value))}
                  disabled={isRunning}
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
                  value={breakTime}
                  min="1"
                  max="30"
                  className={`w-full bg-transparent font-bold text-lg text-gray-700 outline-none p-0 ${theme.text}`}
                  onChange={(e) => setBreakTime(Number(e.target.value))}
                  disabled={isRunning}
                />
                <span className="text-xs text-gray-400 ml-1">min</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isAlwaysOnTop}
                  onChange={handleAlwaysOnTopChange}
                />
                <div
                  className={`w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-slate-700 transition-colors`}
                ></div>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
                总在最前
              </span>
            </label>

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
          </div>

          <div className="text-center">
            <p className="text-[10px] text-gray-300">
              Cmd+Shift+X 退出跟随模式
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
