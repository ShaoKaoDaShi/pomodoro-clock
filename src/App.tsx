import { useState, useEffect, useRef } from 'react';
import { ipcRenderer } from 'electron';

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
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playSound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = 880; // A5
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const sendNotification = (title: string, body: string) => {
    ipcRenderer.send('show-notification', { title, body });
  };

  const timerComplete = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRunning(false);
    playSound();

    if (isWorkSession) {
      sendNotification("番茄钟完成！", "恭喜你完成了一个专注时段，休息一下吧。");
      setIsWorkSession(false);
      setTimeLeft(breakTime * 60);
    } else {
      sendNotification("休息结束！", "休息时间到了，准备开始下一个专注时段。");
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
    ipcRenderer.send('start-follow-mouse');
    setIsMiniMode(true);
  };

  const handleAlwaysOnTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAlwaysOnTop(e.target.checked);
    ipcRenderer.send('toggle-always-on-top', e.target.checked);
  };

  useEffect(() => {
    const stopFollowMouseHandler = () => {
      setIsMiniMode(false);
    };
    ipcRenderer.on('stop-follow-mouse', stopFollowMouseHandler);
    return () => {
      ipcRenderer.removeListener('stop-follow-mouse', stopFollowMouseHandler);
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

  return (
    <div className={`bg-transparent flex justify-center items-center h-screen select-none font-sans text-gray-800 overflow-hidden`}>
      {/* 拖拽区域 */}
      <div 
        className={`fixed top-0 left-0 w-full h-8 z-50 [-webkit-app-region:drag] ${isMiniMode ? 'hidden' : ''}`}
        id="drag-region"
      ></div>

      <div 
        id="app-container" 
        className={`bg-white/95 backdrop-blur-md p-8 rounded-xl shadow-2xl w-80 text-center relative ${isMiniMode ? 'mini-mode' : ''}`}
      >
        {/* 关闭按钮 (模拟) */}
        <div className={`absolute top-2 right-2 flex gap-1 z-50 ${isMiniMode ? 'hidden' : ''}`}>
          <div
            className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-600 transition"
            onClick={() => window.close()}
          ></div>
        </div>

        <h1 className={`text-2xl font-bold text-red-600 mb-4 [-webkit-app-region:drag] ${isMiniMode ? 'hidden' : ''}`}>
          🍅 番茄时钟
        </h1>

        <div id="timer" className={`text-6xl font-bold my-4 text-gray-800 tabular-nums ${isMiniMode ? 'text-sm' : ''}`}>
          {formatTime(timeLeft)}
        </div>

        <div className={`mb-6 text-gray-500 ${isMiniMode ? 'hidden' : ''}`} id="status-text">
          {isRunning ? (isWorkSession ? "专注中..." : "休息中...") : (timeLeft === 0 ? (isWorkSession ? "休息结束，准备开始专注！" : "专注结束，休息一下吧！") : (timerIntervalRef.current ? "已暂停" : "准备开始专注"))}
        </div>

        <div className={`flex justify-between gap-3 mb-6 controls-area ${isMiniMode ? 'hidden' : ''}`}>
          <button
            id="start-btn"
            className="flex-1 py-2 px-4 rounded-md transition bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed active:opacity-80 disabled:active:opacity-50 cursor-pointer [-webkit-app-region:no-drag]"
            onClick={startTimer}
            disabled={isRunning}
          >
            开始
          </button>
          <button
            id="pause-btn"
            className="flex-1 py-2 px-4 rounded-md transition bg-yellow-400 text-yellow-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed active:opacity-80 disabled:active:opacity-50 cursor-pointer [-webkit-app-region:no-drag]"
            onClick={pauseTimer}
            disabled={!isRunning}
          >
            暂停
          </button>
          <button
            id="reset-btn"
            className="flex-1 py-2 px-4 rounded-md transition bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed active:opacity-80 disabled:active:opacity-50 cursor-pointer [-webkit-app-region:no-drag]"
            onClick={resetTimer}
          >
            重置
          </button>
        </div>

        <div className={`flex flex-col gap-3 text-left border-t border-gray-200 pt-4 settings-area ${isMiniMode ? 'hidden' : ''}`}>
          <label className="flex justify-between items-center text-sm">
            专注时长 (分钟):
            <input
              type="number"
              id="work-time"
              value={workTime}
              min="1"
              max="60"
              className="w-16 p-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-400 [-webkit-app-region:no-drag]"
              onChange={(e) => setWorkTime(Number(e.target.value))}
              disabled={isRunning}
            />
          </label>
          <label className="flex justify-between items-center text-sm">
            休息时长 (分钟):
            <input
              type="number"
              id="break-time"
              value={breakTime}
              min="1"
              max="30"
              className="w-16 p-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-400 [-webkit-app-region:no-drag]"
              onChange={(e) => setBreakTime(Number(e.target.value))}
              disabled={isRunning}
            />
          </label>
          <label className="flex justify-between items-center text-sm cursor-pointer">
            总在最前:
            <input
              type="checkbox"
              id="always-on-top"
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 [-webkit-app-region:no-drag]"
              checked={isAlwaysOnTop}
              onChange={handleAlwaysOnTopChange}
            />
          </label>

          <button
            id="follow-mouse-btn"
            className="mt-2 w-full py-2 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 transition shadow-sm [-webkit-app-region:no-drag]"
            onClick={handleFollowMouse}
          >
            🖱️ 开启跟随鼠标模式
          </button>
          <p className="text-xs text-center text-gray-400 mt-1">
            按 Cmd/Ctrl+Shift+X 退出跟随模式
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
