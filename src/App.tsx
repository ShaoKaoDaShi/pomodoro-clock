import { useState, useEffect, useRef } from "react";
import { ipcRenderer } from "electron";

const App = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    oscillator.frequency.value = isWorkSession ? 880 : 523; // Different tones
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

    if (isWorkSession) {
      sendNotification("专注完成", "做得好！休息一下吧。");
      setIsWorkSession(false);
      setTimeLeft(breakTime * 60);
    } else {
      sendNotification("休息结束", "准备好开始新的专注了吗？");
      setIsWorkSession(true);
      setTimeLeft(workTime * 60);
    }
  };

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          timerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (!isRunning) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRunning(false);
    setIsWorkSession(true);
    setTimeLeft(workTime * 60);
  };

  const handleFollowMouse = () => {
    ipcRenderer.send("start-follow-mouse");
    setIsMiniMode(true);
  };

  const handleAlwaysOnTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAlwaysOnTop(e.target.checked);
    ipcRenderer.send("toggle-always-on-top", e.target.checked);
  };

  useEffect(() => {
    const stopFollowMouseHandler = () => {
      setIsMiniMode(false);
    };
    ipcRenderer.on("stop-follow-mouse", stopFollowMouseHandler);
    return () => {
      ipcRenderer.removeListener("stop-follow-mouse", stopFollowMouseHandler);
    };
  }, []);

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
        bg: "from-rose-50 to-orange-50",
        text: "text-rose-600",
        button: "bg-rose-500 hover:bg-rose-600 shadow-rose-200",
        buttonSecondary: "bg-rose-100 text-rose-700 hover:bg-rose-200",
        ring: "focus:ring-rose-200",
        border: "border-rose-100",
      }
    : {
        bg: "from-teal-50 to-emerald-50",
        text: "text-teal-600",
        button: "bg-teal-500 hover:bg-teal-600 shadow-teal-200",
        buttonSecondary: "bg-teal-100 text-teal-700 hover:bg-teal-200",
        ring: "focus:ring-teal-200",
        border: "border-teal-100",
      };

  return (
    <div
      className={`flex justify-center items-center h-screen w-screen overflow-hidden select-none bg-transparent transition-colors duration-500`}
    >
      {/* 拖拽区域 */}
      <div
        className={`fixed top-0 left-0 w-full h-8 z-50 [-webkit-app-region:drag] ${isMiniMode ? "hidden" : ""}`}
        id="drag-region"
      ></div>

      <div
        id="app-container"
        className={`
          relative transition-all duration-300 ease-in-out
          ${
            isMiniMode
              ? "mini-mode"
              : `w-80 p-8 rounded-4xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/60 bg-gradient-to-br ${theme.bg}`
          }
        `}
      >
        {/* 关闭按钮 (模拟) */}
        <div
          className={`absolute top-4 right-4 flex gap-1 z-50 group ${isMiniMode ? "hidden" : ""}`}
        >
          <div
            className="w-3 h-3 rounded-full bg-slate-300 group-hover:bg-red-500 cursor-pointer transition-colors duration-200"
            onClick={() => window.close()}
          ></div>
        </div>

        {/* Header */}
        <div className={`text-center mb-6 ${isMiniMode ? "hidden" : ""}`}>
          <span
            className={`text-xs font-medium uppercase tracking-widest ${isWorkSession ? "text-rose-400" : "text-teal-400"}`}
          >
            {isWorkSession ? "Focus Time" : "Break Time"}
          </span>
        </div>

        {/* Timer Display */}
        <div className="text-center relative">
          <div
            id="timer"
            className={`
            font-mono font-light tracking-tighter text-gray-800 tabular-nums transition-all duration-300
            ${isMiniMode ? "text-sm font-semibold" : "text-7xl mb-2"}
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
          className={`flex justify-center gap-4 mb-8 controls-area ${isMiniMode ? "hidden" : ""}`}
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
          settings-area transition-all duration-300
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
                  className={`w-full bg-transparent font-bold text-lg text-gray-700 outline-none p-0 ${isWorkSession ? "text-gray-600" : "text-teal-600"}`}
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
              className="text-gray-400 hover:text-indigo-500 transition-colors p-2 rounded-full hover:bg-indigo-50"
              onClick={handleFollowMouse}
              title="开启跟随模式"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
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
