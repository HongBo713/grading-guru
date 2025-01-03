"use strict";
const { contextBridge, ipcRenderer } = require("electron");
console.log("Preload script starting...");
const electronAPI = {
  windowControl: {
    minimize: () => {
      console.log("Minimize called");
      return ipcRenderer.invoke("WINDOW_MINIMIZE");
    },
    maximize: () => {
      console.log("Maximize called");
      return ipcRenderer.invoke("WINDOW_MAXIMIZE");
    },
    close: () => {
      console.log("Close called");
      return ipcRenderer.invoke("WINDOW_CLOSE");
    },
    restore: () => {
      console.log("Restore called");
      return ipcRenderer.invoke("WINDOW_RESTORE");
    }
  },
  captureScreen: () => {
    console.log("CaptureScreen called");
    return ipcRenderer.invoke("CAPTURE_SCREEN");
  },
  isAvailable: () => true
};
try {
  console.log("Attempting to expose electron API...");
  contextBridge.exposeInMainWorld("electron", electronAPI);
  console.log("Electron API exposed successfully");
} catch (error) {
  console.error("Failed to expose electron API:", error);
}
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded in preload");
  const api = window.electron;
  console.log("window.electron available:", !!api);
});
