interface TimerDisplayProps {
  formattedTime: string;
  isMiniMode: boolean;
  timerTextClassName: string;
  statusText: string;
}

export default function TimerDisplay({
  formattedTime,
  isMiniMode,
  timerTextClassName,
  statusText,
}: TimerDisplayProps) {
  return (
    <div className="text-center relative">
      <div id="timer" className={timerTextClassName}>
        {formattedTime}
      </div>
      <div
        className={`text-sm font-medium text-gray-500 mb-8 h-6 ${isMiniMode ? "hidden" : ""}`}
        id="status-text"
      >
        {statusText}
      </div>
    </div>
  );
}
