// socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

export const emitMessage = (eventName, data) => {
  socket.emit(eventName, data);
};

export const onMessage = (eventName, callback) => {
  socket.on(eventName, callback);
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export default socket;
