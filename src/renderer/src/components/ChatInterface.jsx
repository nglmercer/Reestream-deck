import React from 'react';

function ChatInterface({
  roomId,
  setRoomId,
  message,
  setMessage,
  messages,
  connectedUsers,
  joinRoom,
  sendMessage
}) {
  return (
    <div>
      <h1>WebRTC Chat Room</h1>
      <input
        type="text"
        value={roomId}
        onChange={e => setRoomId(e.target.value)}
        placeholder="Enter Room ID"
      />
      <button className='btn btn-primary' onClick={joinRoom}>Join Room</button>
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
      <button className='btn btn-primary' onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatInterface;