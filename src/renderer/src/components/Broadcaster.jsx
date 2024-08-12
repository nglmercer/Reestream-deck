  import React, { useEffect, useRef, useState } from 'react';
  import io from 'socket.io-client';
  
  const socket = io('http://localhost:3000');
  const CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    JOINING_ROOM: 'joining_room',
    IN_ROOM: 'in_room',
    STREAMING: 'streaming',
    SPECTATING: 'spectating',
  };
  
  function VideoStream() {
    const [roomId, setRoomId] = useState('');
    const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isSpectating, setIsSpectating] = useState(false);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const localVideoRef = useRef(null);
    const peerConnections = useRef({});
    const localStream = useRef(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [activeBroadcasters, setActiveBroadcasters] = useState(new Set());
    const [someoneBroadcasting, setSomeoneBroadcasting] = useState(false);
    const [dataChannels, setDataChannels] = useState({});

    const createPeerConnection = (userId) => {
      const pc = new RTCPeerConnection();
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('signal', { to: userId, candidate: event.candidate });
        }
      };
    
      pc.ontrack = (event) => {
        console.log('Receiving remote stream from:', userId);
        setRemoteStreams(prev => ({...prev, [userId]: event.streams[0]}));
        setActiveBroadcasters(prev => new Set(prev).add(userId));
      };
  
      pc.ondatachannel = (event) => {
        const channel = event.channel;
        channel.onmessage = (msg) => handleDataChannelMessage(userId, msg);
      };
    
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
      }
      const dataChannel = pc.createDataChannel('stateChannel');
      dataChannel.onopen = () => {
        console.log(`Data channel opened with ${userId}`);
        setDataChannels(prev => {
          console.log('Previous data channels:', prev, dataChannel);
          const updatedChannels = {...prev, [userId]: dataChannel};
          console.log('Updated data channels:', updatedChannels);
          return updatedChannels;
        });
      };
      
      dataChannel.onmessage = (event) => {
        console.log(`Raw message received from ${userId}:`, event.data);
        handleDataChannelMessage(userId, event);
      };
  
      return pc;
    };
  
    const handleDataChannelMessage = (userId, event) => {
      console.log(`Handling data channel message from ${userId}:`, event.data);
      try {
        const data = JSON.parse(event.data);
        console.log(`Parsed message from ${userId}:`, data);
        
        switch(data.type) {
          case 'startBroadcast':
            console.log(`User ${userId} started broadcasting`);
            setActiveBroadcasters(prev => new Set(prev).add(userId));
            break;
          case 'stopBroadcast':
            console.log(`User ${userId} stopped broadcasting`);
            setActiveBroadcasters(prev => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });
            break;
          case 'userJoined':
            console.log(`User ${data.userId} joined the room`);
            break;
          default:
            console.log(`Received unknown message type from ${userId}:`, data.type);
        }
      } catch (error) {
        console.error(`Error processing message from ${userId}:`, error);
        console.log('Raw message:', event.data);
      }
    };
    const createDataChannelAfterConnection = (userId, pc) => {
      const dataChannel = pc.createDataChannel('stateChannel');
      console.log('createDataChannelAfterConnection', dataChannel);
      dataChannel.onopen = () => {
        console.log(`Data channel opened with ${userId}`);
        setDataChannels(prev => {
          console.log('Previous data channels:', prev, dataChannel);
          const updatedChannels = {...prev, [userId]: dataChannel};
          console.log('Updated data channels:', updatedChannels);
          return updatedChannels;
        });
      };
      
      dataChannel.onmessage = (event) => {
        console.log(`Raw message received from ${userId}:`, event.data);
        handleDataChannelMessage(userId, event);
      };
    };
    const sendStateMessage = (type, data = {}) => {
      const message = JSON.stringify({ type, ...data });
      console.log('Sending state message:', message, dataChannels);
      Object.values(dataChannels).forEach(channel => {
        console.log('Checking data channel state:', channel.readyState,`from ${channel.peer}`, channel);
        if (channel) {
          console.log('Sending state message:', message);
          channel.send(message);
        } else {
          console.warn('Data channel not open, state:', channel.readyState);
          // Intenta enviar el mensaje cuando el canal se abra
          channel.onopen = () => {
            console.log('Data channel now open, sending delayed message');
            channel.send(message);
          };
        }
      });
    };
    const startStream = async () => {
      try {
        setConnectionState(CONNECTION_STATES.STREAMING);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;
        localStream.current = stream;
        setIsStreaming(true);
        setIsSpectating(false);
        sendStateMessage('startBroadcast');
      } catch (error) {
        console.warn("Error accessing media devices:", error);
        setConnectionState(CONNECTION_STATES.IN_ROOM);
      }
    };
  
    const stopStream = () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
        localStream.current = null;
        setIsStreaming(false);
        setConnectionState(CONNECTION_STATES.IN_ROOM);
      }
    };
  
    const joinRoom = () => {
      console.log(`Joining room: ${roomId}`);
      setConnectionState(CONNECTION_STATES.JOINING_ROOM);
      socket.emit('join-room', roomId);
      sendStateMessage('userJoined', { userId: socket.id });
    };
  
    useEffect(() => {
      socket.on('connect', () => {
        setConnectionState(CONNECTION_STATES.CONNECTED);
      });
  
      socket.on('user-connected', async (userId) => {
        console.log(`User connected: ${userId}`);
        setUsersInRoom(prev => [...prev, userId]);
        const pc = createPeerConnection(userId);
        peerConnections.current[userId] = pc;
      
        if (isStreaming) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('signal', { to: userId, offer });
          } catch (error) {
            console.warn("Error creating offer:", error);
          }
        }
        createDataChannelAfterConnection(userId, pc);
        const dataChannel = pc.createDataChannel('stateChannel');
        dataChannel.onopen = () => {
          console.log(`Data channel opened with ${userId}`);
          setDataChannels(prev => ({...prev, [userId]: dataChannel}));
        };
        dataChannel.onmessage = (event) => {
          console.log(`Raw message received from ${userId}:`, event.data);
          handleDataChannelMessage(userId, event);
        };
      });
  
      socket.on('all-users', (users) => {
        console.log('Users in room:', users);
        setUsersInRoom(users);
        users.forEach(userId => {
          if (!peerConnections.current[userId]) {
            peerConnections.current[userId] = createPeerConnection(userId);
          }
        });
        setConnectionState(CONNECTION_STATES.IN_ROOM);
      });
  
      socket.on('signal', async (payload) => {
        const pc = peerConnections.current[payload.from];
        if (!pc) {
          console.warn(`No peer connection for user ${payload.from}`);
          return;
        }
      
        try {
          if (payload.offer) {
            console.log(`Received offer from ${payload.from}`);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', { to: payload.from, answer });
          } else if (payload.answer) {
            console.log(`Received answer from ${payload.from}`);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } else if (payload.candidate) {
            console.log(`Received ICE candidate from ${payload.from}`);
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        } catch (error) {
          console.warn("Error handling signal:", error);
        }
      });
  
      socket.on('user-disconnected', (userId) => {
        console.log(`User disconnected: ${userId}`);
        if (peerConnections.current[userId]) {
          peerConnections.current[userId].close();
          delete peerConnections.current[userId];
        }
        setRemoteStreams(prev => {
          const newStreams = {...prev};
          delete newStreams[userId];
          return newStreams;
        });
        setUsersInRoom(prev => prev.filter(id => id !== userId));
      });
      return () => {
        socket.off('connect');
        socket.off('user-connected');
        socket.off('all-users');
        socket.off('signal');
        socket.off('user-disconnected');
      };
    }, [roomId, isStreaming]);
  
    useEffect(() => {
      if (usersInRoom.length > 1 && !someoneBroadcasting) {
        console.warn("More than one user in the room, but no one is broadcasting");
      }
    }, [usersInRoom, someoneBroadcasting]);
    return (
      <div>
        <input 
          type="text" 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)} 
          placeholder="Enter Room ID" 
        />
        <button onClick={joinRoom}>Join Room</button>
        <button onClick={isStreaming ? stopStream : startStream} disabled={connectionState !== CONNECTION_STATES.IN_ROOM}>
          {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
        </button>
        <button onClick={() => setIsSpectating(true)} disabled={connectionState !== CONNECTION_STATES.IN_ROOM || isStreaming}>
          Spectate
        </button>
        
        <p>Connection State: {connectionState}</p>
        <p>Users in Room: {usersInRoom.join(', ')}</p>
        <p>Active Broadcasters: {Array.from(activeBroadcasters).join(', ')}</p>
        
        <video ref={localVideoRef} autoPlay muted style={{ width: '200px', height: '150px', display: isStreaming ? 'block' : 'none' }} />
        
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <video 
            key={userId}
            autoPlay 
            style={{ width: '200px', height: '150px' }}
            ref={el => {
              if (el) el.srcObject = stream;
            }}
          />
        ))}
      </div>
    );
  }
  
  export default VideoStream;