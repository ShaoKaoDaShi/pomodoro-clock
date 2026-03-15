interface ModeSwitchProps {
  isHidden: boolean;
  isWorkSession: boolean;
  onSwitchMode: (mode: "work" | "break") => void;
}

export default function ModeSwitch({
  isHidden,
  isWorkSession,
  onSwitchMode,
}: ModeSwitchProps) {
  return (
    <div
      className={`flex justify-center mb-6 gap-2 ${isHidden ? "hidden" : ""} [-webkit-app-region:no-drag]`}
    >
      <button
        onClick={() => onSwitchMode("work")}
        className={`text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full transition-all duration-300 ${
          isWorkSession
            ? "bg-white shadow-sm text-indigo-500"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        Focus
      </button>
      <button
        onClick={() => onSwitchMode("break")}
        className={`text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full transition-all duration-300 ${
          !isWorkSession
            ? "bg-white shadow-sm text-teal-500"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        Break
      </button>
    </div>
  );
}
