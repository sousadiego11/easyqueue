import { app, BrowserWindow, ipcMain, nativeImage } from "electron"
import path from "path"
import fs from "fs"
import { IPC_CHANNELS } from "@easyqueue/shared"
import { ConnectionService } from "./services/ConnectionService"
import { QueueService } from "./services/QueueService"
import { MessageService } from "./services/MessageService"
import { registerAllHandlers } from "./ipc"

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const iconPath = path.join(__dirname, "../resources/icon.svg")
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : undefined

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    icon,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => mainWindow?.minimize())
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => mainWindow?.close())

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"))
  }
}

app.whenReady().then(async () => {
  const connectionService = new ConnectionService()
  await connectionService.loadFromDisk()

  const queueService = new QueueService(connectionService)
  const messageService = new MessageService(connectionService)

  registerAllHandlers(connectionService, queueService, messageService)
  createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
