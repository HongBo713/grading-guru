/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    DIST: string;
    VITE_PUBLIC: string;
  }
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer;
  electron: {
    electron: ElectronAPI;
    ipcRenderer: Electron.IpcRenderer;
    getScreenSources(arg0: { types: string[]; thumbnailSize: { width: number; height: number; }; }): unknown;
    windowControl: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      restore: () => Promise<void>;
    };
    captureScreen: () => Promise<string>;
    isAvailable: () => boolean;
  };
}
