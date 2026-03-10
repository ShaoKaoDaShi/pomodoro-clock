// src/services/platform.ts

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// Define types for Electron IPC if needed, or use any
type IpcRenderer = {
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
};

let ipcRenderer: IpcRenderer | null = null;

// Try to initialize ipcRenderer if we are in an Electron environment
try {
  // Check if window.require is available (Electron with nodeIntegration)
  if (typeof window !== "undefined" && (window as any).require) {
    const electron = (window as any).require("electron");
    ipcRenderer = electron.ipcRenderer;
  }
} catch (e) {
  console.log("Not running in Electron environment");
}

export const isElectron = (): boolean => {
  return !!ipcRenderer;
};

export const isNative = Capacitor.isNativePlatform();

export const platform = {
  sendNotification: async (title: string, body: string) => {
    if (isElectron() && ipcRenderer) {
      ipcRenderer.send("show-notification", { title, body });
    } else if (isNative) {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== "granted") {
          const request = await LocalNotifications.requestPermissions();
          if (request.display !== "granted") return;
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: new Date().getTime(),
              schedule: { at: new Date(Date.now() + 100) },
              sound: undefined,
              attachments: undefined,
              actionTypeId: "",
              extra: null,
            },
          ],
        });
      } catch (e) {
        console.error("Failed to schedule notification", e);
      }
    } else {
      // Fallback for web
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (
        "Notification" in window &&
        Notification.permission !== "denied"
      ) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification(title, { body });
        }
      }
    }
  },

  startFollowMouse: () => {
    if (isElectron() && ipcRenderer) {
      ipcRenderer.send("start-follow-mouse");
    } else {
      console.log("Follow mouse mode not supported on this platform");
    }
  },

  toggleAlwaysOnTop: (enabled: boolean) => {
    if (isElectron() && ipcRenderer) {
      ipcRenderer.send("toggle-always-on-top", enabled);
    } else {
      console.log("Always on top not supported on this platform");
    }
  },

  onStopFollowMouse: (callback: () => void) => {
    if (isElectron() && ipcRenderer) {
      // Wrapper to match Electron event signature
      const listener = () => callback();
      ipcRenderer.on("stop-follow-mouse", listener);
      return listener; // Return for cleanup
    }
    return () => {};
  },

  offStopFollowMouse: (listener: any) => {
    if (isElectron() && ipcRenderer && listener) {
      ipcRenderer.removeListener("stop-follow-mouse", listener);
    }
  },

  quit: () => {
    if (isElectron()) {
      window.close();
    }
  },
};
