import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import  AudioController  from './audioController';
import keynut from './keynut';
const expressApp = express();
const server = http.createServer(expressApp);

const io = socketIo(server, {
  cors: {
    origin: "*", // Permite conexiones desde cualquier origen
    methods: ["GET", "POST"]
  }
});
server.listen(3000, () => {
  console.log('Socket.IO server listening on port 3000');
});
const audioController = new AudioController();
const UPDATE_INTERVAL = 5000;

// console.log(keynut.getKeyboardControlsAsJSONKey());123
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('setMasterVolume', (volume) => {
    try {
      audioController.setMasterVolume(volume);
      socket.emit('masterVolumeChanged', volume);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('presskey', (key) => {
    console.log('Keypressed:', key);
    try {
      keynut.keyboardController.parseAndExecuteKeyCommand(key);
      socket.emit('keypressed', key);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('setVolume', ({ pid, volume }) => {
    try {
      audioController.setSessionVolume(pid, volume);
      socket.emit('volumeChanged', { pid, volume });
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  sendAudioData(socket);
  const intervalId = setInterval(() => sendAudioData(socket), UPDATE_INTERVAL);


  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    socket.emit('all-users', usersInRoom.filter(id => id !== socket.id));
    socket.to(roomId).emit('user-connected', socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('webrtc', (payload) => {
    const { type, data, to, roomId } = payload;
    console.log(`Received WebRTC message of type: ${type} from: ${socket.id} to: ${to}`);

    switch (type) {
      case 'offer':
      case 'answer':
        if (to) {
          io.to(to).emit('webrtc', { type, data, from: socket.id });
        }
        break;
      case 'candidate':
        if (to === 'all' || !to) {
          socket.to(roomId).emit('webrtc', { type, data, from: socket.id });
        } else {
          io.to(to).emit('webrtc', { type, data, from: socket.id });
        }
        break;
      default:
        console.warn(`Unhandled WebRTC event type: ${type}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-disconnected', socket.id);
      console.log(`User ${socket.id} disconnected from room ${socket.roomId}`);
    }
    clearInterval(intervalId);
  });
});
function sendAudioData(socket) {
  const sessions = audioController.getAllSessions();
  const masterVolume = audioController.getMasterVolume();
  const isMasterMuted = audioController.isMasterMuted();

  socket.emit('audioData', { sessions, masterVolume, isMasterMuted });
}
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    globalShortcut.register('Alt+F1', ToolDev);
    globalShortcut.register('Alt+F2', cdevTool);
    globalShortcut.register('Alt+F5', refreshPage);
    function ToolDev() {
      mainWindow.webContents.openDevTools();
    }
  
    function cdevTool() {
      mainWindow.webContents.closeDevTools();
    }
  
    function refreshPage() {
      mainWindow.webContents.reload(); // Reload the page on F5
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    expressApp.use(express.static(join(__dirname, '../renderer/index.html')));
    console.log(join(__dirname, '../renderer/index.html'))
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    // mainWindow.loadURL(`http://localhost:3000`);
  }
}
console.log("qweqweqweqwe",join(__dirname, '../renderer/index.html'))

expressApp.use(express.static(join(__dirname, '../renderer')));
expressApp.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../renderer/index.html'));
});

console.log("qweqweqweqwe",join(__dirname, '../renderer/index.html'))
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('toMain', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
