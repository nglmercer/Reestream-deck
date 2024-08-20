import socketIo from "socket.io";
import AudioController from "../audioController";
import keynut from "../keynut";

const audioController = new AudioController();
const UPDATE_INTERVAL = 5000;

export function initializeSocketServer(server) {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    sendAudioData(socket);
    const intervalId = setInterval(
      () => sendAudioData(socket),
      UPDATE_INTERVAL,
    );

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      socket.roomId = roomId;
      const usersInRoom = Array.from(
        io.sockets.adapter.rooms.get(roomId) || [],
      );
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
        console.log(
          `User ${socket.id} disconnected from room ${socket.roomId}`,
        );
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

  return io;
}
