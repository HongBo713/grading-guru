import { app, BrowserWindow, ipcMain, screen, desktopCapturer } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRELOAD_PATH = app.isPackaged ? path.join(__dirname, "preload.js") : path.join(__dirname, "../dist/electron/preload.js");
console.log("Checking preload script...");
console.log("Preload path:", PRELOAD_PATH);
console.log("Preload exists:", fs.existsSync(PRELOAD_PATH));
console.log("Directory contents:", fs.readdirSync(path.dirname(PRELOAD_PATH)));
console.log("Preload path:", PRELOAD_PATH);
if (!process.env.DIST) {
  process.env.DIST = path.join(__dirname, "../dist");
}
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  console.log("__dirname:", __dirname);
  console.log("preload path:", path.join(__dirname, "preload.js"));
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    // frame: false,
    backgroundColor: "#1E1E1E",
    webPreferences: {
      nodeIntegration: true,
      // Enable this for testing
      contextIsolation: true,
      sandbox: false,
      // Disable sandbox for testing
      preload: PRELOAD_PATH
    }
  });
  function createSelectionWindow() {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;
    const selectionWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      transparent: true,
      frame: false,
      autoHideMenuBar: true,
      fullscreen: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      enableLargerThanScreen: true,
      useContentSize: true
    });
    selectionWindow.removeMenu();
    if (VITE_DEV_SERVER_URL) {
      selectionWindow.loadURL(`${VITE_DEV_SERVER_URL}selection.html`);
    } else {
      selectionWindow.loadFile(path.join(process.env.DIST, "selection.html"));
    }
    return selectionWindow;
  }
  ipcMain.handle("WINDOW_MINIMIZE", () => {
    win == null ? void 0 : win.minimize();
  });
  ipcMain.handle("WINDOW_MAXIMIZE", () => {
    if (win == null ? void 0 : win.isMaximized()) {
      win == null ? void 0 : win.restore();
    } else {
      win == null ? void 0 : win.maximize();
    }
  });
  ipcMain.handle("WINDOW_CLOSE", () => {
    win == null ? void 0 : win.close();
  });
  ipcMain.handle("WINDOW_RESTORE", () => {
    win == null ? void 0 : win.restore();
  });
  ipcMain.handle("CAPTURE_SCREEN", async () => {
    if (!win) return null;
    try {
      console.log("Starting capture process...");
      const selectionWindow = createSelectionWindow();
      return new Promise((resolve, reject) => {
        ipcMain.once("SELECTION_COMPLETE", async (event, bounds) => {
          console.log("Selection complete, bounds:", bounds);
          try {
            const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
            const scaleFactor = display.scaleFactor || 1;
            console.log("Display scale factor:", scaleFactor);
            console.log("Original bounds:", bounds);
            console.log("Capturing full screen...");
            const sources = await desktopCapturer.getSources({
              types: ["screen"],
              thumbnailSize: {
                width: display.size.width * scaleFactor,
                height: display.size.height * scaleFactor
              }
            });
            if (sources && sources.length > 0) {
              console.log("Full screen captured, size:", sources[0].thumbnail.getSize());
              const croppedImage = sources[0].thumbnail.crop({
                x: Math.round(bounds.x * scaleFactor),
                y: Math.round(bounds.y * scaleFactor),
                width: Math.round(bounds.width * scaleFactor),
                height: Math.round(bounds.height * scaleFactor)
              });
              console.log("Cropped image size:", croppedImage.getSize());
              const dataUrl = croppedImage.toDataURL();
              console.log("Data URL length:", dataUrl.length);
              selectionWindow.close();
              resolve(dataUrl);
            } else {
              selectionWindow.close();
              reject(new Error("No screen sources found"));
            }
          } catch (error) {
            selectionWindow.close();
            console.error("Error during capture:", error);
            reject(error);
          }
        });
        ipcMain.once("SELECTION_CANCELLED", () => {
          console.log("Selection cancelled");
          selectionWindow.close();
          reject(new Error("Selection cancelled"));
        });
        selectionWindow.on("closed", () => {
          if (!selectionWindow.isDestroyed()) {
            reject(new Error("Selection window closed unexpectedly"));
          }
        });
      });
    } catch (error) {
      console.error("Screen capture error:", error);
      throw error;
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
