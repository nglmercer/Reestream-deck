import { app, shell, BrowserWindow, ipcMain, globalShortcut } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import express from "express";
import http from "http";
import https from "https";
import socketIo from "socket.io";
import AudioController from "./audioController";
import keynut from "./keynut";
import { showQRModal } from "./qrModal";
import path from "path";
import FileOpener from "./FileOpener";
import cors from "cors";
import fs from "fs";
import fileIndexer from "./FindFiles";
// import { initializeSocketServer } from './server/socketServer';

let Port = 3000;
const fileOpener = new FileOpener();
console.log(fileOpener.getAvailableAppIdentifiers());
const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());

let server;
let io;
// let privateKey, certificate, credentials;
if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
  console.log("SSL credentials not found. Starting HTTP server...");
  server = http.createServer(expressApp);
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  server.listen(0, () => {
    console.log("Socket.IO server listening on port", server.address().port);
  });
  const expressserver = expressApp.listen(0, () => {
    console.log(
      "Express server listening on port",
      expressserver.address().port,
    );
    Port = expressserver.address().port;
  });
} else {
  // try {
  //   // privateKey = fs.readFileSync(join(__dirname, '../../credentials/key.pem'), 'utf8');
  //   console.log(join(__dirname, '../../credentials/key.pem'));
  //   console.log(join(__dirname, '../../credentials/cert.pem'));
  //   privateKey = fs.readFileSync(join(__dirname, '../../credentials/key.pem'), 'utf8');
  //   certificate = fs.readFileSync(join(__dirname, '../../credentials/cert.pem'), 'utf8');
  //   credentials = { key: privateKey, cert: certificate };

  //   // Si las credenciales existen, inicia el servidor en HTTPS
  //   server = https.createServer(credentials, expressApp);
  //   io = socketIo(server, {
  //     cors: {
  //       origin: "*", // Permite conexiones desde cualquier origen
  //       methods: ["GET", "POST"]
  //     }
  //   });
  //   server.listen(0, () => {
  //     console.log('Socket.IO server listening on port', server.address().port);
  //   });
  //   console.log("SSL credentials found. Starting HTTPS server...");
  // } catch (error) {
  console.log("SSL credentials not found. Starting HTTP server...");

  // Si no hay credenciales, inicia el servidor en HTTP
  server = http.createServer(expressApp);
  io = socketIo(server, {
    cors: {
      origin: "*", // Permite conexiones desde cualquier origen
      methods: ["GET", "POST"],
    },
  });
  server.listen(0, () => {
    console.log("Socket.IO server listening on port 3000");
  });
  // }
}

expressApp.get("/port", (req, res) => {
  console.log("Port:", server.address().port, "req resp");
  res.json({ port: server.address().port });
});
expressApp.get("/apps", async (req, res) => {
  const apps = await getInstalledApplications();
  console.log("apps", apps);
  res.json(apps);
});
expressApp.post("/openapp", async (req, res) => {
  console.log("openapp", req.body);
  const { data } = req.body;
  console.log("openapp", data);
  res.json({ success: true });
});

function getInstalledApplications() {
  return fileIndexer.searchFiles(".lnk");
}
const audioController = new AudioController();
const UPDATE_INTERVAL = 5000;

// console.log(keynut.getKeyboardControlsAsJSONKey());123
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  sendAudioData(socket);
  const intervalId = setInterval(() => sendAudioData(socket), UPDATE_INTERVAL);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    socket.emit(
      "all-users",
      usersInRoom.filter((id) => id !== socket.id),
    );
    socket.to(roomId).emit("user-connected", socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("webrtc", (payload) => {
    const { type, data, to, roomId } = payload;
    console.log(
      `Received WebRTC message of type: ${type} from: ${socket.id} to: ${to}`,
    );

    switch (type) {
      case "offer":
      case "answer":
        if (to) {
          io.to(to).emit("webrtc", { type, data, from: socket.id });
        }
        break;
      case "candidate":
        if (to === "all" || !to) {
          socket.to(roomId).emit("webrtc", { type, data, from: socket.id });
        } else {
          io.to(to).emit("webrtc", { type, data, from: socket.id });
        }
        break;
      default:
        console.warn(`Unhandled WebRTC event type: ${type}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (socket.roomId) {
      socket.to(socket.roomId).emit("user-disconnected", socket.id);
      console.log(`User ${socket.id} disconnected from room ${socket.roomId}`);
    }
    clearInterval(intervalId);
  });
  socket.on("setMasterVolume", (volume) => {
    try {
      audioController.setMasterVolume(volume);
      socket.emit("masterVolumeChanged", volume);
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("presskey", (key) => {
    console.log("Keypressed:", key);
    try {
      keynut.keyboardController.parseAndExecuteKeyCommand(key);
      socket.emit("keypressed", key);
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("setVolume", ({ pid, volume }) => {
    try {
      audioController.setSessionVolume(pid, volume);
      socket.emit("volumeChanged", { pid, volume });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });
  socket.on("openapp", (data) => {
    console.log("openapp", data);
    fileOpener.openDefault(data.path);
    socket.emit("openapp", data);
  });
});
function sendAudioData(socket) {
  const sessions = audioController.getAllSessions();
  const masterVolume = audioController.getMasterVolume();
  const isMasterMuted = audioController.isMasterMuted();

  socket.emit("audioData", { sessions, masterVolume, isMasterMuted });
}
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    globalShortcut.register("Alt+F1", ToolDev);
    globalShortcut.register("Alt+F2", cdevTool);
    globalShortcut.register("Alt+F5", refreshPage);
    function ToolDev() {
      mainWindow.webContents.openDevTools();
    }

    function cdevTool() {
      mainWindow.webContents.closeDevTools();
    }

    function refreshPage() {
      mainWindow.webContents.reload(); // Reload the page on F5
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    // mainWindow.loadURL(`http://localhost:${Port}`);
    console.log(process.env["ELECTRON_RENDERER_URL"]);
    console.log(Port);
    expressApp.use(express.static(join(__dirname, "../renderer/index.html")));
    console.log(join(__dirname, "../renderer/index.html"));
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

expressApp.use(express.static(join(__dirname, "../renderer")));
expressApp.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../renderer/index.html"));
});
expressApp.use(express.json());

expressApp.post("/file-info", (req, res) => {
  const { path: filePath } = req.body;
  console.log("filePath", filePath);
  openfile(filePath);
  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error obtaining file information");
      return;
    }

    const fileDetails = {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      fileType: path.extname(filePath),
    };

    res.json(fileDetails);
  });
});
function openfile(path) {
  fileOpener.openDefault(path);
  console.log("openfile", path);
}
console.log("join", join(__dirname, "../renderer/index.html"));

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("toMain", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
async function startserver() {
  const port = 3333;
  const success = await listenOnPort(port);
  if (success) {
    console.log(`Successfully started server on port ${port}`);
  } else {
    console.log(`Failed to start server on port ${port}`);
  }
}
startserver();
function listenOnPort(port) {
  return new Promise((resolve) => {
    const server = expressApp.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(true);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is already in use`);
        resolve(false);
      } else {
        console.error(`Error starting server on port ${port}:`, err);
        resolve(false);
      }
    });
  });
}
