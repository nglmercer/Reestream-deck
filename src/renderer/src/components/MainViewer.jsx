import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const Viewer = ({ roomId }) => {
  const videoRef = useRef();
  const socketRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
    socketRef.current = io.connect('http://localhost:3000'); // Cambia esto por la URL de tu servidor

    socketRef.current.emit('join room', roomId);

    socketRef.current.on('all users', users => {
      if (users.length > 0) {
        const userToSignal = users[0];
        peerRef.current = createPeer(userToSignal, socketRef.current.id);
      }
    });

    socketRef.current.on('user joined', payload => {
      peerRef.current.signal(payload.signal);
    });

    socketRef.current.on('receiving returned signal', payload => {
      peerRef.current.signal(payload.signal);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const createPeer = (userToSignal, callerID) => {
    const peer = new window.SimplePeer({
      initiator: true,
      trickle: false,
    });

    peer.on('signal', signal => {
      socketRef.current.emit('sending signal', { userToSignal, callerID, signal });
    });

    peer.on('stream', stream => {
      videoRef.current.srcObject = stream;
    });

    return peer;
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
    </div>
  );
};

export default Viewer;
