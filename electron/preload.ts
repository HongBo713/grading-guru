// preload.ts
const { contextBridge, ipcRenderer } = require('electron');

// Type declaration with export for global recognition
export interface ElectronAPI {
  windowControl: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    restore: () => Promise<void>;
  };
  captureScreen: () => Promise<string>;
  isAvailable: () => boolean;
}

// Declare the window extension
// declare global {
//   interface Window {
//     electron: ElectronAPI
//   }
// }

// Debug log when preload starts
console.log('Preload script starting...');

// Create the API object with proper typing
const electronAPI: ElectronAPI = {
  windowControl: {
    minimize: () => {
      console.log('Minimize called');
      return ipcRenderer.invoke('WINDOW_MINIMIZE');
    },
    maximize: () => {
      console.log('Maximize called');
      return ipcRenderer.invoke('WINDOW_MAXIMIZE');
    },
    close: () => {
      console.log('Close called');
      return ipcRenderer.invoke('WINDOW_CLOSE');
    },
    restore: () => {
      console.log('Restore called');
      return ipcRenderer.invoke('WINDOW_RESTORE');
    }
  },
  captureScreen: () => {
    console.log('CaptureScreen called');
    return ipcRenderer.invoke('CAPTURE_SCREEN');
  },
  isAvailable: () => true
};

try {
  console.log('Attempting to expose electron API...');
  contextBridge.exposeInMainWorld('electron', electronAPI);
  console.log('Electron API exposed successfully');
} catch (error) {
  console.error('Failed to expose electron API:', error);
}

// Check for API availability after DOM loads
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded in preload');
  // Use type assertion to check electron property
  const api = (window as any).electron;
  console.log('window.electron available:', !!api);
});