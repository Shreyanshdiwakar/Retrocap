import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create the context
const SocketContext = createContext(null);

// URL for the socket connection
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL);
    
    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('playersList', (playersList) => {
      setPlayers(playersList);
    });

    newSocket.on('joinSuccess', (id) => {
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
      socket.emit('playerJoin', playerName);
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