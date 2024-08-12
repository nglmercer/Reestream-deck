import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Adjust the URL as needed

function WebRTCChatRoom() {
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const peerConnections = useRef({});
  const dataChannels = useRef({});

  useEffect(() => {
    socket.on('connect', () => console.log('Connected to server'));
    socket.on('connect_error', (error) => console.error('Connection error:', error));

    socket.on('all-users', handleAllUsers);
    socket.on('user-connected', handleUserConnected);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('webrtc', handleWebRTCSignal);

    return () => {
      socket.off('all-users');
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('webrtc');
    };
  }, []);

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
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc', { type: 'answer', data: answer, to: from, roomId });
      } else if (type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (type === 'candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      }
    } catch (error) {
      console.error('Error handling WebRTC signal:', error);
    }
  };

  const createPeerConnection = (userId) => {
    if (peerConnections.current[userId]) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc', {
          type: 'candidate',
          data: event.candidate,
          to: userId,
          roomId
        });
      }
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      setupDataChannel(channel, userId);
    };

    peerConnections.current[userId] = pc;

    // Create offer if we are the initiator
    if (socket.id < userId) {
      createDataChannel(pc, userId);
    }
  };

  const createDataChannel = (pc, userId) => {
    const channel = pc.createDataChannel('chat');
    setupDataChannel(channel, userId);

    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit('webrtc', {
          type: 'offer',
          data: pc.localDescription,
          to: userId,
          roomId
        });
      })
      .catch(error => console.error('Error creating offer:', error));
  };

  const setupDataChannel = (channel, userId) => {
    channel.onopen = () => console.log(`Data channel opened with ${userId}`);
    channel.onmessage = event => {
      setMessages(prev => [...prev, { sender: userId, text: event.data }]);
    };
    dataChannels.current[userId] = channel;
  };

  const closePeerConnection = (userId) => {
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
    if (dataChannels.current[userId]) {
      dataChannels.current[userId].close();
      delete dataChannels.current[userId];
    }
  };

  const joinRoom = () => {
    if (roomId) {
      socket.emit('join-room', roomId);
    }
  };

  const sendMessage = () => {
    if (message) {
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
      <h1>WebRTC Chat Room</h1>
      <input
        type="text"
        value={roomId}
        onChange={e => setRoomId(e.target.value)}
        placeholder="Enter Room ID"
      />
      <button onClick={joinRoom}>Join Room</button>
      <div>
        <h2>Connected Users:</h2>
        <ul>
          {connectedUsers.map(user => <li key={user}>{user}</li>)}
        </ul>
      </div>
      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}><strong>{msg.sender}:</strong> {msg.text}</li>
          ))}
        </ul>
      </div>
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default WebRTCChatRoom;