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
    <div className="card bg-base-100 shadow-xl m-4 p-4">
      <h1 className="text-3xl font-bold flex m-4 text-center text-blue-600">Conectarse a un chat WebRTC</h1>
      <div className="flex m-2">
        <input
          type="text"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          className="flex-grow mr-2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          onClick={joinRoom}
        >
          Join Room
        </button>
      </div>
      <div className="flex m-4">
        <h2 className="text-xl font-semibold mb-2 text-sky-700">Connected Users:</h2>
        <ul className="bg-gray-400/10 rounded-lg p-3 shadow">
          {connectedUsers.map(user => (
            <li key={user} className="mb-1 text-sky-600">{user}</li>
          ))}
        </ul>
      </div>
      <div className="flex m-4">
        <h2 className="text-xl font-semibold mb-2 text-sky-700">Messages:</h2>
        <ul className="bg-gray-400/10 rounded-lg p-3 shadow max-h-60 overflow-y-auto">
          {messages.map((msg, index) => (
            <li key={index} className="mb-2">
              <strong className="text-blue-600">{msg.sender}:</strong> 
              <span className="text-white">{msg.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-grow mr-2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;