import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

// Create the context
const GameContext = createContext(null);

// Game screens
export const SCREENS = {
  LOGIN: 'login',
  LOBBY: 'lobby',
  PONG: 'pong'
};

export const GameProvider = ({ children }) => {
  const { socket, playerId } = useSocket();
  
  // Game state
  const [currentScreen, setCurrentScreen] = useState(SCREENS.LOGIN);
  const [pongGame, setPongGame] = useState({
    players: {},
    currentSide: null,
    scoreLeft: 0,
    scoreRight: 0,
    ballX: 400,
    ballY: 300,
    paddleY: 250,
    opponentPaddleY: 250,
    gameActive: false,
    waitingForOpponent: false,
  });
  const [gameResult, setGameResult] = useState({
    winner: null,
    showEndScreen: false
  });

  useEffect(() => {
    if (!socket) return;

    // Set up socket event handlers for game state
    socket.on('joinSuccess', () => {
      setCurrentScreen(SCREENS.LOBBY);
    });

    socket.on('pongPlayersUpdate', (players) => {
      setPongGame(prev => ({
        ...prev,
        players,
        waitingForOpponent: !(players.left && players.right)
      }));
    });

    socket.on('pongGameStart', () => {
      setPongGame(prev => ({
        ...prev,
        gameActive: true,
        waitingForOpponent: false
      }));
    });

    socket.on('opponentPaddleMove', (data) => {
      const oppositeSide = pongGame.currentSide === 'left' ? 'right' : 'left';
      if (data.side === oppositeSide) {
        setPongGame(prev => ({
          ...prev,
          opponentPaddleY: data.position
        }));
      }
    });

    socket.on('ballPosition', (data) => {
      setPongGame(prev => ({
        ...prev,
        ballX: data.x,
        ballY: data.y
      }));
    });

    socket.on('scoreUpdate', (data) => {
      setPongGame(prev => ({
        ...prev,
        scoreLeft: data.left,
        scoreRight: data.right
      }));
    });

    socket.on('gameEnd', (data) => {
      setPongGame(prev => ({
        ...prev,
        gameActive: false
      }));
      setGameResult({
        winner: data.winner,
        showEndScreen: true
      });
    });

    socket.on('playerLeftGame', () => {
      setPongGame(prev => ({
        ...prev,
        gameActive: false,
        waitingForOpponent: true
      }));
      setGameResult({
        winner: 'Opponent left the game',
        showEndScreen: true
      });
    });

    return () => {
      // Clean up all listeners when component unmounts
      socket.off('joinSuccess');
      socket.off('pongPlayersUpdate');
      socket.off('pongGameStart');
      socket.off('opponentPaddleMove');
      socket.off('ballPosition');
      socket.off('scoreUpdate');
      socket.off('gameEnd');
      socket.off('playerLeftGame');
    };
  }, [socket, pongGame.currentSide]);

  // Expose functions to join a Pong game
  const joinPongGame = (side) => {
    if (socket) {
      setPongGame(prev => ({
        ...prev,
        currentSide: side,
        waitingForOpponent: true
      }));
      socket.emit('joinPong', side);
    }
  };

  // Send paddle position to server
  const updatePaddlePosition = (position) => {
    if (socket && pongGame.gameActive) {
      setPongGame(prev => ({
        ...prev,
        paddleY: position
      }));
      socket.emit('paddleMove', position);
    }
  };

  // Return to lobby
  const returnToLobby = () => {
    setPongGame({
      players: {},
      currentSide: null,
      scoreLeft: 0,
      scoreRight: 0,
      ballX: 400,
      ballY: 300,
      paddleY: 250,
      opponentPaddleY: 250,
      gameActive: false,
      waitingForOpponent: false,
    });
    setGameResult({
      winner: null,
      showEndScreen: false
    });
    setCurrentScreen(SCREENS.LOBBY);
  };

  // Restart the game
  const playAgain = () => {
    setGameResult({
      winner: null,
      showEndScreen: false
    });
    joinPongGame(pongGame.currentSide);
  };

  return (
    <GameContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        pongGame,
        gameResult,
        joinPongGame,
        updatePaddlePosition,
        returnToLobby,
        playAgain
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 