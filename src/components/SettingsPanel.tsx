import type { ChangeEvent } from "react";
import type { SessionTheme } from "../constants/theme";

interface SettingsPanelProps {
  isHidden: boolean;
  workTime: number;
  breakTime: number;
  isRunning: boolean;
  isAlwaysOnTop: boolean;
  isFollowActive: boolean;
  theme: SessionTheme;
  onWorkTimeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBreakTimeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAlwaysOnTopChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFollowMouse: () => void;
}

export default function SettingsPanel({
  isHidden,
  workTime,
  breakTime,
  isRunning,
  isAlwaysOnTop,
  isFollowActive,
  theme,
  onWorkTimeChange,
  onBreakTimeChange,
  onAlwaysOnTopChange,
  onFollowMouse,
}: SettingsPanelProps) {
  return (
    <div
      className={`
        flex flex-col gap-4 text-left pt-6 border-t ${theme.border}
        settings-area transition-all duration-300 [-webkit-app-region:no-drag]
        ${isHidden ? "hidden" : ""}
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
              onChange={onWorkTimeChange}
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
              onChange={onBreakTimeChange}
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
              onChange={onAlwaysOnTopChange}
            />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-slate-700 transition-colors"></div>
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
          onClick={onFollowMouse}
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
        <p className="text-[10px] text-gray-300">Cmd+Shift+X 退出跟随模式</p>
      </div>
    </div>
  );
}
