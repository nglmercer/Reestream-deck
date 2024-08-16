class SocketManager {
  constructor(server) {
    this.io = require('socket.io')(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.initializeSocketEvents();
  }

  initializeSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('setMasterVolume', (volume) => this.handleSetMasterVolume(socket, volume));
      socket.on('presskey', (key) => this.handlePressKey(socket, key));
      socket.on('setVolume', (data) => this.handleSetVolume(socket, data));
      socket.on('join-room', (roomId) => this.handleJoinRoom(socket, roomId));
      socket.on('webrtc', (payload) => this.handleWebRTC(socket, payload));

      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  handleSetMasterVolume(socket, volume) {
    try {
      audioController.setMasterVolume(volume);
      socket.emit('masterVolumeChanged', volume);
    } catch (error) {
      socket.emit('error', error.message);
    }
  }

  handlePressKey(socket, key) {
    console.log('Keypressed:', key);
    try {
      keynut.keyboardController.parseAndExecuteKeyCommand(key);
      socket.emit('keypressed', key);
    } catch (error) {
      socket.emit('error', error.message);
    }
  }

  handleSetVolume(socket, { pid, volume }) {
    try {
      audioController.setSessionVolume(pid, volume);
      socket.emit('volumeChanged', { pid, volume });
    } catch (error) {
      socket.emit('error', error.message);
    }
  }

  handleJoinRoom(socket, roomId) {
    socket.join(roomId);
    socket.roomId = roomId;
    const usersInRoom = Array.from(this.io.sockets.adapter.rooms.get(roomId) || []);
    socket.emit('all-users', usersInRoom.filter(id => id !== socket.id));
    socket.to(roomId).emit('user-connected', socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  }

  handleWebRTC(socket, payload) {
    const { type, data, to, roomId } = payload;
    console.log(`Received WebRTC message of type: ${type} from: ${socket.id} to: ${to}`);

    switch (type) {
      case 'offer':
      case 'answer':
        if (to) {
          this.io.to(to).emit('webrtc', { type, data, from: socket.id });
        }
        break;
      case 'candidate':
        if (to === 'all' || !to) {
          socket.to(roomId).emit('webrtc', { type, data, from: socket.id });
        } else {
          this.io.to(to).emit('webrtc', { type, data, from: socket.id });
        }
        break;
      default:
        console.warn(`Unhandled WebRTC event type: ${type}`);
    }
  }

  handleDisconnect(socket) {
    console.log('Client disconnected:', socket.id);
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-disconnected', socket.id);
      console.log(`User ${socket.id} disconnected from room ${socket.roomId}`);
    }
  }

  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }
  socketon(event, callback) {
    this.io.on(event, callback);
  }
  socketemit(event, data) {
    this.io.emit(event, data);
  }
  socketoff(event, callback) {
    this.io.off(event, callback);
  }
}
