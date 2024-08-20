import React from "react";
import WebRTCChatRoom from "./WebRTCChatRoom";
import mediaManager from "./utils/mediaManager";
import socketManager from "./utils/socket";

function ChatRoomContainer() {
  const handleStreamSelected = (stream) => {
    mediaManager.setLocalStream(stream);
    const videoElement = document.getElementById("localVideo");
    if (videoElement) {
      videoElement.srcObject = stream;
    }
    // Propagar el stream a todos los peers
    Object.values(peerConnections.current).forEach((pc) => {
      mediaManager.addTrackToPeerConnection(pc);
    });
  };

  const setupDataChannel = (channel, userId) => {
    channel.onopen = () => console.log(`Data channel opened with ${userId}`);

    channel.onmessage = (event) => {
      // Manejar el mensaje del data channel
      console.log(`Message from ${userId}:`, event.data);
    };

    dataChannels.current[userId] = channel;
  };

  const createDataChannel = (pc, userId) => {
    const channel = pc.createDataChannel("chat");
    setupDataChannel(channel, userId);

    pc.createOffer()
      .then((offer) => {
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        socketManager.emitMessage("webrtc", {
          type: "offer",
          data: pc.localDescription,
          to: userId,
          roomId,
        });
      })
      .catch((error) => console.error("Error creating offer:", error));
  };

  return (
    <WebRTCChatRoom
      handleStreamSelected={handleStreamSelected}
      setupDataChannel={setupDataChannel}
      createDataChannel={createDataChannel}
    />
  );
}

export default ChatRoomContainer;
