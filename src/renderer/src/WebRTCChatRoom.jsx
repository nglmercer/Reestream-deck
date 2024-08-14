import React, { useState, useEffect, useRef } from 'react';
import socketManager from './utils/socket';
import ChatInterface from './components/ChatInterface';
import MediaStreamSelector from './components/MediaStreamSelector';

function WebRTCChatRoom() {
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const peerConnections = useRef({});
  const dataChannels = useRef({});
  const localStream = useRef(null); // Stream de video local
  const remoteStreams = useRef({}); // Stream de video remoto
  const socket = socketManager.socket;

  useEffect(() => {
    socketManager.onMessage('connect', () => console.log('Connected to server'));
    socketManager.onMessage('connect_error', (error) => console.error('Connection error:', error));

    socketManager.onMessage('all-users', handleAllUsers);
    socketManager.onMessage('user-connected', handleUserConnected);
    socketManager.onMessage('user-disconnected', handleUserDisconnected);
    socketManager.onMessage('webrtc', handleWebRTCSignal);

    return () => {
      socket.off('all-users', handleAllUsers); 
      socket.off('user-connected', handleUserConnected);
      socket.off('user-disconnected', handleUserDisconnected);
      socket.off('webrtc', handleWebRTCSignal);
      stopLocalStream(); // Detener el stream local al desmontar el componente

    };
  }, []);
  const stopLocalStream = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleStreamSelected = (stream) => {
    localStream.current = stream;
    const videoElement = document.getElementById('localVideo');
    if (videoElement) {
      videoElement.srcObject = stream;
    }
    Object.values(dataChannels.current).forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify({ type: 'video-started', userId: socket.id }));
      }
    });
    // Añadir el stream local al PeerConnection existente o futuro
    Object.values(peerConnections.current).forEach(pc => {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
  });
};
  const handleAllUsers = (users) => {
    console.log('All users in room:', users);
    setConnectedUsers(users);
    users.forEach(createPeerConnection);
  };

  const handleUserConnected = (userId) => {
    console.log('User connected:', userId);
    setConnectedUsers(prev => [...prev, userId]);
    createPeerConnection(userId);
  };

  const handleUserDisconnected = (userId) => {
    console.log('User disconnected:', userId);
    setConnectedUsers(prev => prev.filter(id => id !== userId));
    closePeerConnection(userId);
  };

  const handleWebRTCSignal = async ({ type, data, from }) => {
    console.log('Received WebRTC signal:', type, 'from:', from);
    if (!peerConnections.current[from]) {
        createPeerConnection(from);
    }
    const pc = peerConnections.current[from];

    try {
        if (type === 'offer') {
            if (pc.signalingState !== 'stable') {
                console.warn('Skipping offer because signalingState is not stable:', pc.signalingState);
                return;
            }
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc', { type: 'answer', data: answer, to: from, roomId });
        } else if (type === 'answer') {
            if (pc.signalingState !== 'have-local-offer') {
                console.warn('Skipping answer because signalingState is not have-local-offer:', pc.signalingState);
                return;
            }
            await pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (type === 'candidate') {
            if (pc.signalingState === 'stable' || pc.signalingState === 'have-remote-offer') {
                await pc.addIceCandidate(new RTCIceCandidate(data));
            } else {
                console.warn('Skipping ICE candidate because signalingState is not appropriate:', pc.signalingState);
            }
        }
    } catch (error) {
        console.error('Error handling WebRTC signal:', error);
    }
};


const setupDataChannel = (channel, userId) => {
  channel.onopen = () => console.log(`Data channel opened with ${userId}`);

  channel.onmessage = event => {
    let message;
    
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.log(`Received non-JSON message from ${userId}:`, event.data);
      setMessages(prev => [...prev, { sender: userId, text: event.data }]);
      return;
    }

    if (message.type === 'video-started') {
      console.log(`User ${message.userId} started transmitting video`);
      // Solicitar una nueva oferta al remitente
      const pc = peerConnections.current[message.userId];
      if (pc) {
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit('webrtc', {
              type: 'offer',
              data: pc.localDescription,
              to: message.userId,
              roomId
            });
          })
          .catch(error => console.error('Error creating offer:', error));
      }
    } else {
      console.log(`Received message from ${userId}:`, message.text);
      setMessages(prev => [...prev, { sender: userId, text: message.text }]);
    }
  };

  dataChannels.current[userId] = channel;
};



const closePeerConnection = (userId) => {
  console.log('Closing peer connection with:', userId);
  if (peerConnections.current[userId]) {
    peerConnections.current[userId].close();
    delete peerConnections.current[userId];
  }
  if (dataChannels.current[userId]) {
    dataChannels.current[userId].close();
    delete dataChannels.current[userId];
  }
  if (remoteStreams.current[userId]) {
    remoteStreams.current[userId].getTracks().forEach(track => track.stop());
    delete remoteStreams.current[userId];
  }
};

  const createDataChannel = (pc, userId) => {
    console.log('Creating data channel with:', userId);
    const channel = pc.createDataChannel('chat');
    setupDataChannel(channel, userId);

    pc.createOffer()
      .then(offer => {
        console.log('Created offer for:', userId, offer);
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        console.log('Sending offer to:', userId);
        socket.emit('webrtc', {
          type: 'offer',
          data: pc.localDescription,
          to: userId,
          roomId
        });
      })
      .catch(error => console.error('Error creating offer:', error));
  };

  const createPeerConnection = (userId) => {
    if (peerConnections.current[userId]) return;
  
    console.log('Creating new RTCPeerConnection for:', userId);
    const pc = new RTCPeerConnection();
  
    // Verificar si se ha añadido el stream local
    if (localStream.current) {
      console.log(`Adding local stream tracks to PeerConnection for user ${userId}`);
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    } else {
      console.warn(`No local stream available for user ${userId}`);
    }
  
    // Configuración de eventos
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to:', userId);
        socket.emit('webrtc', {
          type: 'candidate',
          data: event.candidate,
          to: userId,
          roomId
        });
      }
    };
  
    pc.ontrack = (event) => {
      console.log('Track received from:', userId, event);
      remoteStreams.current[userId] = event.streams[0];
      const videoElement = document.getElementById(`remoteVideo-${userId}`);
      if (videoElement) {
        videoElement.srcObject = event.streams[0];
      } else {
        console.warn(`No video element found for remote user ${userId}`);
      }
      Object.values(dataChannels.current).forEach(channel => {
        if (channel.readyState === 'open') {
          channel.send(JSON.stringify({ type: 'video-started', userId: socket.id }));
        }
      });
      Object.values(peerConnections.current).forEach(pc => {
          console.log('Adding tracks to peer connection:', pc);
      });
    };
  
    pc.ondatachannel = (event) => {
      console.log('Data channel received from:', userId);
      setupDataChannel(event.channel, userId);
    };
  
    peerConnections.current[userId] = pc;
  
    // Crear oferta si somos el iniciador
    if (socket.id < userId) {
      createDataChannel(pc, userId);
    }
  };
  

  const joinRoom = () => {
    if (roomId) {
      socketManager.emitMessage('join-room', roomId);
    }
  };

  const sendMessage = () => {
    if (message) {
      console.log('Sending message:', message);
      Object.values(dataChannels.current).forEach(channel => {
        if (channel.readyState === 'open') {
          channel.send(message);
        }
      });
      setMessages(prev => [...prev, { sender: 'Me', text: message }]);
      setMessage('');
    }
  };
  return (
    <div>
      <ChatInterface
        roomId={roomId}
        setRoomId={setRoomId}
        message={message}
        setMessage={setMessage}
        messages={messages}
        connectedUsers={connectedUsers}
        joinRoom={joinRoom}
        sendMessage={sendMessage}
      />
  <div className="divider divider-neutral">chat room</div>

            <MediaStreamSelector onStreamSelected={handleStreamSelected} />
      <video id="localVideo" autoPlay muted></video>
      {connectedUsers.map(userId => (
        <video key={userId} id={`remoteVideo-${userId}`} autoPlay></video>
      ))}
    </div>
  );
}


export default WebRTCChatRoom;