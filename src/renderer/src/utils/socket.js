import { io } from "socket.io-client";
import { getHostname, getPort } from "./network";
class SocketManager {
  static instance = null;
  socket = null;

  static async create() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
      await SocketManager.instance.initialize();
    }
    return SocketManager.instance;
  }

  async initialize() {
    const port = await this.determinePort();
    const socketUrl = this.constructSocketUrl(port);
    this.socket = io(socketUrl);
  }

  async determinePort() {
    const windowPort = window.location.port;
    const defaultPort = windowPort - 1;
    return defaultPort === 5173 || defaultPort === 5172
      ? await this.fetchPort(3333)
      : await this.fetchPort(windowPort);
  }

  async fetchPort(fallbackPort) {
    const localhostname = getHostname();
    const protocol = window.location.protocol;
    const ipport = protocol === "file:" ? 3333 : await getPort(localhostname);
    const fetchurl = `http://${localhostname}:${ipport}`;
    console.log("fetchurl", fetchurl);
    try {
      const response = await fetch(
        `${fetchurl}/port`,
      );
      const { port } = await response.json();
      console.log("Socket.IO server port:", port);
      return port;
    } catch (error) {
      console.error("Error fetching port:", error);
      return fallbackPort;
    }
  }

  constructSocketUrl(port) {
    const { protocol, hostname } = window.location;
    return protocol.startsWith("file")
      ? `http://localhost:${port}`
      : `${protocol}//${hostname}:${port}`;
  }

  emitMessage(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    } else {
      console.error("Socket is not initialized");
    }
  }

  onMessage(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    } else {
      console.error("Socket is not initialized");
    }
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    } else {
      console.error("Socket is not initialized");
    }
  }
}

const socketManager = await SocketManager.create();
Object.freeze(socketManager);

export default socketManager;
