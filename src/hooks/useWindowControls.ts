import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { ipcRenderer } from "electron";

interface UseWindowControlsOptions {
  isFollowWindow: boolean;
}

interface UseWindowControlsResult {
  isFollowActive: boolean;
  isAlwaysOnTop: boolean;
  isOpenAtLogin: boolean;
  handleFollowMouse: () => void;
  handleAlwaysOnTopChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleOpenAtLoginChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function useWindowControls({
  isFollowWindow,
}: UseWindowControlsOptions): UseWindowControlsResult {
  const [isFollowActive, setIsFollowActive] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isOpenAtLogin, setIsOpenAtLogin] = useState(false);

  const handleFollowMouse = () => {
    ipcRenderer.send(isFollowActive ? "stop-follow-mouse" : "start-follow-mouse");
  };

  const handleAlwaysOnTopChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.checked;
    setIsAlwaysOnTop(nextValue);
    ipcRenderer.send("toggle-always-on-top", nextValue);
  };

  const handleOpenAtLoginChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.checked;
    setIsOpenAtLogin(nextValue);
    ipcRenderer.send("toggle-open-at-login", nextValue);
  };

  useEffect(() => {
    const handleFollowChange = (
      _event: Electron.IpcRendererEvent,
      isActive: boolean,
    ) => {
      setIsFollowActive(isActive);
    };

    ipcRenderer.on("follow-mode-changed", handleFollowChange);
    ipcRenderer.send("check-follow-status");

    return () => {
      ipcRenderer.removeListener("follow-mode-changed", handleFollowChange);
    };
  }, []);

  useEffect(() => {
    if (isFollowWindow) {
      return;
    }

    const handleOpenAtLoginChange = (
      _event: Electron.IpcRendererEvent,
      isEnabled: boolean,
    ) => {
      setIsOpenAtLogin(isEnabled);
    };

    ipcRenderer.on("open-at-login-changed", handleOpenAtLoginChange);
    ipcRenderer.send("request-open-at-login");

    return () => {
      ipcRenderer.removeListener("open-at-login-changed", handleOpenAtLoginChange);
    };
  }, [isFollowWindow]);

  useEffect(() => {
    if (isFollowWindow) {
      return;
    }

    const updateWindowSize = () => {
      const container = document.getElementById("app-container");
      if (!container) {
        return;
      }

      ipcRenderer.send("resize-window", {
        width: container.offsetWidth + 60,
        height: container.offsetHeight + 60,
      });
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateWindowSize);
    });

    const container = document.getElementById("app-container");
    if (container) {
      observer.observe(container);
      updateWindowSize();
    }

    return () => {
      observer.disconnect();
    };
  }, [isFollowWindow]);

  return {
    isFollowActive,
    isAlwaysOnTop,
    isOpenAtLogin,
    handleFollowMouse,
    handleAlwaysOnTopChange,
    handleOpenAtLoginChange,
  };
}
