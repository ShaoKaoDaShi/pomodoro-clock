import type { ChangeEvent } from "react";
import type { SessionTheme } from "../constants/theme";
import type { UpdateState } from "../types/update";

interface SettingsPanelProps {
  isAlwaysOnTop: boolean;
  isOpenAtLogin: boolean;
  theme: SessionTheme;
  updateState: UpdateState;
  onBack: () => void;
  onAlwaysOnTopChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenAtLoginChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCheckForUpdates: () => void;
  onInstallDownloadedUpdate: () => void;
}

export default function SettingsPanel({
  isAlwaysOnTop,
  isOpenAtLogin,
  theme,
  updateState,
  onBack,
  onAlwaysOnTopChange,
  onOpenAtLoginChange,
  onCheckForUpdates,
  onInstallDownloadedUpdate,
}: SettingsPanelProps) {
  const isCheckingUpdate = updateState.status === "checking";
  const isDownloadingUpdate = updateState.status === "downloading";
  const isDownloadedUpdate = updateState.status === "downloaded";
  const isInstallingUpdate = updateState.status === "installing";
  const isUpdateActionDisabled =
    isCheckingUpdate ||
    isDownloadingUpdate ||
    isInstallingUpdate ||
    updateState.status === "unsupported";
  const updateActionText = isCheckingUpdate
    ? "检查中..."
    : isDownloadingUpdate
      ? "下载中..."
      : isInstallingUpdate
        ? "正在重启..."
        : "检查更新";
  const toggleTrackClassName =
    "block h-6 w-10 rounded-full bg-gray-200 transition-colors peer-checked:bg-slate-800";
  const toggleKnobClassName =
    "absolute left-1 top-1 block h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4";

  return (
    <div className="settings-area flex flex-col gap-5 text-left [-webkit-app-region:no-drag]">
      <div className="flex items-center justify-between">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-gray-500 shadow-sm transition-colors hover:bg-white hover:text-gray-800"
          onClick={onBack}
          title="返回"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-800">设置</p>
          <p className="text-xs text-gray-400">应用偏好与更新</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between rounded-2xl bg-white/60 p-4 shadow-sm cursor-pointer group">
          <span>
            <span className="block text-sm font-semibold text-gray-700 group-hover:text-gray-900">
              开机启动
            </span>
            <span className="mt-1 block text-xs text-gray-400">
              登录系统后自动打开应用
            </span>
          </span>
          <span className="relative shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isOpenAtLogin}
              onChange={onOpenAtLoginChange}
            />
            <span className={toggleTrackClassName}></span>
            <span className={toggleKnobClassName}></span>
          </span>
        </label>

        <label className="flex items-center justify-between rounded-2xl bg-white/60 p-4 shadow-sm cursor-pointer group">
          <span>
            <span className="block text-sm font-semibold text-gray-700 group-hover:text-gray-900">
              总在最前
            </span>
            <span className="mt-1 block text-xs text-gray-400">
              让计时器始终浮在其他窗口上方
            </span>
          </span>
          <span className="relative shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isAlwaysOnTop}
              onChange={onAlwaysOnTopChange}
            />
            <span className={toggleTrackClassName}></span>
            <span className={toggleKnobClassName}></span>
          </span>
        </label>
      </div>

      <div className={`rounded-2xl border bg-white/60 p-4 shadow-sm ${theme.border}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">版本更新</p>
            <p className="mt-1 text-xs text-gray-400">
              当前版本 {updateState.currentVersion || "未知"}
              {updateState.latestVersion
                ? ` / 最新版本 ${updateState.latestVersion}`
                : ""}
            </p>
          </div>
          <button
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isDownloadedUpdate
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-slate-800 text-white hover:bg-slate-900 disabled:bg-gray-300 disabled:text-gray-500"
            }`}
            onClick={
              isDownloadedUpdate ? onInstallDownloadedUpdate : onCheckForUpdates
            }
            disabled={
              isInstallingUpdate || (!isDownloadedUpdate && isUpdateActionDisabled)
            }
          >
            {isDownloadedUpdate ? "重启更新" : updateActionText}
          </button>
        </div>
        {updateState.message ? (
          <p className="mt-3 text-xs text-gray-500">{updateState.message}</p>
        ) : null}
        {updateState.error ? (
          <p className="mt-2 text-xs text-red-400">{updateState.error}</p>
        ) : null}
      </div>
    </div>
  );
}
