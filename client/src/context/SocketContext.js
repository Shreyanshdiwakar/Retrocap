import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create the context
const SocketContext = createContext(null);

// URL for the socket connection - use dynamic IP detection
const getSocketUrl = () => {
  // In production, use the current origin
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  
  // In development, try to use the IP address shown in Network URL
  // This ensures both localhost and external devices connect to the same server
  const hostName = window.location.hostname;
  if (hostName !== 'localhost' && hostName !== '127.0.0.1') {
    return `http://${hostName}:8080`;
  }
  
  // Fallback for localhost development
  return 'http://localhost:8080';
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const SOCKET_URL = getSocketUrl();
    console.log('Attempting to connect to Socket.IO server at:', SOCKET_URL);
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });
    
    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server with ID:', newSocket.id);
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    newSocket.on('connect_timeout', () => {
      console.error('Socket connection timeout');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect (${attemptNumber})`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server, reason:', reason);
      setConnected(false);
    });

    newSocket.on('playersList', (playersList) => {
      console.log('Received players list:', playersList);
      setPlayers(playersList);
    });

    newSocket.on('joinSuccess', (id) => {
      console.log('Join successful, assigned ID:', id);
      setPlayerId(id);
    });

    newSocket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data);
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Function to join the game with a player name
  const joinGame = (playerName) => {
    if (socket && playerName.trim()) {
      console.log('Emitting playerJoin event with name:', playerName);
      socket.emit('playerJoin', playerName);
    } else {
      console.error('Cannot join game: socket not connected or player name missing');
      if (!socket) console.error('Socket is not initialized');
      if (!playerName.trim()) console.error('Player name is empty');
    }
  };

  return (
    <SocketContext.Provider 
      value={{ 
        socket, 
        connected, 
        playerId, 
        players, 
        leaderboard, 
        joinGame 
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 