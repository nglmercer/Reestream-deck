import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    if (!SocketManager.instance) {
      const socketUrl = `${window.location.protocol}//${window.location.hostname}:3000`; // URL relativa
      this.socket = io(socketUrl); // Ajusta la URL según sea necesario
      SocketManager.instance = this;
    }
    return SocketManager.instance;
  }

  emitMessage(eventName, data) {
    this.socket.emit(eventName, data);
  }

  onMessage(eventName, callback) {
    this.socket.on(eventName, callback);
  }

  disconnectSocket() {
    this.socket.disconnect();
  }
}

// Asegura que la misma instancia se reutiliza
const socketManager = new SocketManager();
Object.freeze(socketManager);

export default socketManager;
