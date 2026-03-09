// 引入 electron 模块
const { ipcRenderer } = require('electron');

// 状态变量
let timerInterval;
let timeLeft = 25 * 60; // 默认 25 分钟，单位秒
let isRunning = false;
let isWorkSession = true; // true: 专注时间, false: 休息时间

// DOM 元素
const timerDisplay = document.getElementById('timer');
const statusText = document.getElementById('status-text');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const workTimeInput = document.getElementById('work-time');
const breakTimeInput = document.getElementById('break-time');
const alwaysOnTopCheckbox = document.getElementById('always-on-top');
const followMouseBtn = document.getElementById('follow-mouse-btn');
const appContainer = document.getElementById('app-container');

// 格式化时间显示 MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 更新界面
function updateDisplay() {
  timerDisplay.textContent = formatTime(timeLeft);
}

// 播放提示音 (使用 Web Audio API 生成简单的 Beep 声)
function playSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
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
  // 播放 0.5 秒
  gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
  oscillator.stop(ctx.currentTime + 0.5);
}

// 发送系统通知
function sendNotification(title, body) {
  // 使用 IPC 发送通知请求给主进程
  ipcRenderer.send('show-notification', { title, body });
}

// 计时器结束处理
function timerComplete() {
  clearInterval(timerInterval);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  
  playSound();

  if (isWorkSession) {
    statusText.textContent = "专注结束，休息一下吧！";
    sendNotification("番茄钟完成！", "恭喜你完成了一个专注时段，休息一下吧。");
    // 切换到休息模式
    isWorkSession = false;
    timeLeft = parseInt(breakTimeInput.value) * 60;
  } else {
    statusText.textContent = "休息结束，准备开始专注！";
    sendNotification("休息结束！", "休息时间到了，准备开始下一个专注时段。");
    // 切换回工作模式
    isWorkSession = true;
    timeLeft = parseInt(workTimeInput.value) * 60;
  }
  
  updateDisplay();
}

// 开始计时
function startTimer() {
  if (isRunning) return;
  
  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  workTimeInput.disabled = true;
  breakTimeInput.disabled = true;
  
  statusText.textContent = isWorkSession ? "专注中..." : "休息中...";

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      timerComplete();
    }
  }, 1000);
}

// 暂停计时
function pauseTimer() {
  if (!isRunning) return;
  
  clearInterval(timerInterval);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  statusText.textContent = "已暂停";
}

// 重置计时
function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  workTimeInput.disabled = false;
  breakTimeInput.disabled = false;
  
  isWorkSession = true;
  timeLeft = parseInt(workTimeInput.value) * 60;
  statusText.textContent = "准备开始专注";
  updateDisplay();
}

// 事件监听
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// 输入框改变时更新时间 (仅在非运行时)
workTimeInput.addEventListener('change', () => {
  if (!isRunning && isWorkSession) {
    timeLeft = parseInt(workTimeInput.value) * 60;
    updateDisplay();
  }
});

breakTimeInput.addEventListener('change', () => {
  if (!isRunning && !isWorkSession) {
    timeLeft = parseInt(breakTimeInput.value) * 60;
    updateDisplay();
  }
});

// 监听“总在最前”复选框变化
alwaysOnTopCheckbox.addEventListener('change', () => {
  ipcRenderer.send('toggle-always-on-top', alwaysOnTopCheckbox.checked);
});

// 监听跟随鼠标模式按钮
followMouseBtn.addEventListener('click', () => {
  // 发送 IPC 消息
  ipcRenderer.send('start-follow-mouse');
  
  // 切换 UI 到迷你模式
  appContainer.classList.add('mini-mode');
});

// 监听退出跟随鼠标模式
ipcRenderer.on('stop-follow-mouse', () => {
  // 恢复 UI
  appContainer.classList.remove('mini-mode');
});

// 初始化显示
updateDisplay();
