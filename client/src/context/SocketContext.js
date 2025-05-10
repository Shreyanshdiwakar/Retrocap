import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Get the host dynamically - this will work on both computer and mobile devices
const getSocketURL = () => {
  // In production, use the current origin
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }

  // In development, if we're accessing from a phone/external device, use the IP address
  const currentHost = window.location.hostname;
  if (currentHost !== 'localhost') {
    return `http://${currentHost}:9876`;
  }

  // Localhost development
  return 'http://localhost:9876';
};

const SOCKET_URL = getSocketURL();

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  // Add back the players state and playerId
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    console.log(`Connecting to Socket.IO server at: ${SOCKET_URL}`);
    
    const socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected with ID:', socketInstance.id);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      setReconnectAttempts(0);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      reconnectAttemptsRef.current += 1;
      setReconnectAttempts(reconnectAttemptsRef.current);
      
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
        // You might want to show a user-friendly message here
      }
    });
    
    // Add listeners for player events
    socketInstance.on('playersList', (playersList) => {
      console.log('Received players list:', playersList);
      setPlayers(playersList);
    });

    socketInstance.on('joinSuccess', (id) => {
      console.log('Join successful, assigned ID:', id);
      setPlayerId(id);
    });

    socketInstance.on('leaderboardUpdate', (data) => {
      console.log('Received leaderboard update:', data);
      setLeaderboard(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off('playersList');
      socketInstance.off('joinSuccess');
      socketInstance.off('leaderboardUpdate');
      socketInstance.close();
    };
  }, []);

  // Add the joinGame function
  const joinGame = useCallback((playerName) => {
    if (socket && playerName.trim()) {
      console.log('Attempting to join game with name:', playerName);
      socket.emit('playerJoin', playerName);
    } else {
      console.error('Cannot join game: socket not connected or player name missing');
      if (!socket) console.error('Socket is not initialized');
      if (!playerName.trim()) console.error('Player name is empty');
    }
  }, [socket]);

  const value = {
    socket,
    isConnected,
    reconnectAttempts,
    players,
    playerId,
    leaderboard,
    joinGame
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 