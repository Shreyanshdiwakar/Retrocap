import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useGame } from '../context/GameContext';
import useKeyboard from '../hooks/useKeyboard';

// Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 8;
const PADDLE_OFFSET = 30;

const GameContainer = styled.div`
  padding: 20px 0;
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 2rem;
  gap: 20px;
`;

const ScoreDivider = styled.div``;

const BackButton = styled.button`
  padding: 8px 15px;
  background: var(--primary);
  border: none;
  border-radius: 5px;
  color: var(--text);
  font-family: 'Press Start 2P', cursive;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 10px var(--primary);
  text-transform: uppercase;
  
  &:hover {
    background: var(--secondary);
    box-shadow: 0 0 20px var(--secondary);
    transform: translateY(-2px);
  }
`;

const CanvasContainer = styled.div`
  position: relative;
  width: 800px;
  height: 600px;
  margin: 0 auto;
  background: var(--background);
  border: 4px solid var(--primary);
  border-radius: 5px;
  overflow: hidden;
  
  @media (max-width: 900px) {
    width: 100%;
    height: auto;
    aspect-ratio: 4/3;
  }
`;

const Canvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

const OverlayTitle = styled.h3`
  margin-bottom: 20px;
  color: var(--text);
`;

const SideSelection = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
`;

const SideButton = styled.button`
  padding: 10px 20px;
  background: var(--primary);
  border: none;
  border-radius: 5px;
  color: var(--text);
  font-family: 'Press Start 2P', cursive;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: var(--secondary);
    transform: translateY(-2px);
  }
`;

const ActionButton = styled(SideButton)`
  margin-top: 20px;
`;

const Loader = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid var(--dark);
  border-top: 5px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-top: 20px;
`;

const PongGame = () => {
  const { 
    pongGame,
    gameResult, 
    joinPongGame, 
    updatePaddlePosition, 
    returnToLobby,
    playAgain 
  } = useGame();
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const keys = useKeyboard({ preventDefault: true });

  // Debug keyboard state
  useEffect(() => {
    console.log('Keyboard state:', keys);
  }, [keys]);

  // Define drawGame before we use it in useEffect
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw center line
    ctx.strokeStyle = '#FFFFFF';
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 0);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = '#FFFFFF';
    
    // Left paddle
    const leftPaddleY = pongGame.currentSide === 'left' ? pongGame.paddleY : pongGame.opponentPaddleY;
    ctx.fillRect(PADDLE_OFFSET, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    // Right paddle
    const rightPaddleY = pongGame.currentSide === 'right' ? pongGame.paddleY : pongGame.opponentPaddleY;
    ctx.fillRect(GAME_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    // Draw ball
    ctx.fillStyle = '#0aefff';
    ctx.beginPath();
    ctx.arc(pongGame.ballX, pongGame.ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect to ball
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0aefff';
    ctx.beginPath();
    ctx.arc(pongGame.ballX, pongGame.ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [pongGame.ballX, pongGame.ballY, pongGame.currentSide, pongGame.opponentPaddleY, pongGame.paddleY]);

  // Game loop
  useEffect(() => {
    if (!pongGame.gameActive) return;
    
    const handleFrame = () => {
      // Move paddle based on keyboard input
      if (keys.ArrowUp && pongGame.paddleY > 0) {
        console.log('Moving paddle up');
        updatePaddlePosition(pongGame.paddleY - PADDLE_SPEED);
      }
      if (keys.ArrowDown && pongGame.paddleY < GAME_HEIGHT - PADDLE_HEIGHT) {
        console.log('Moving paddle down');
        updatePaddlePosition(pongGame.paddleY + PADDLE_SPEED);
      }
      
      // Also check for WASD controls as an alternative
      if (keys.w && pongGame.paddleY > 0) {
        console.log('Moving paddle up (w key)');
        updatePaddlePosition(pongGame.paddleY - PADDLE_SPEED);
      }
      if (keys.s && pongGame.paddleY < GAME_HEIGHT - PADDLE_HEIGHT) {
        console.log('Moving paddle down (s key)');
        updatePaddlePosition(pongGame.paddleY + PADDLE_SPEED);
      }
      
      // Draw the game
      drawGame();
      
      // Continue animation
      animationRef.current = requestAnimationFrame(handleFrame);
    };
    
    animationRef.current = requestAnimationFrame(handleFrame);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pongGame.gameActive, keys, pongGame.paddleY, updatePaddlePosition, drawGame]);

  // Touch controls for mobile
  const handleTouchMove = useCallback((e) => {
    if (!pongGame.gameActive) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleY = GAME_HEIGHT / rect.height;
    const touch = e.touches[0];
    const y = (touch.clientY - rect.top) * scaleY - PADDLE_HEIGHT / 2;
    
    if (y >= 0 && y <= GAME_HEIGHT - PADDLE_HEIGHT) {
      updatePaddlePosition(y);
    }
  }, [pongGame.gameActive, updatePaddlePosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchmove', handleTouchMove);
      
      return () => {
        canvas.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [pongGame.gameActive, handleTouchMove]);

  return (
    <GameContainer>
      <GameHeader>
        <Title className="neon-text">PONG</Title>
        <ScoreContainer>
          <div>{pongGame.scoreLeft}</div>
          <ScoreDivider>:</ScoreDivider>
          <div>{pongGame.scoreRight}</div>
        </ScoreContainer>
        <BackButton onClick={returnToLobby}>Back to Lobby</BackButton>
      </GameHeader>
      
      <CanvasContainer>
        {/* Side selection overlay */}
        {!pongGame.currentSide && (
          <Overlay>
            <OverlayTitle>Choose your side</OverlayTitle>
            <SideSelection>
              <SideButton onClick={() => joinPongGame('left')}>LEFT</SideButton>
              <SideButton onClick={() => joinPongGame('right')}>RIGHT</SideButton>
            </SideSelection>
          </Overlay>
        )}
        
        {/* Waiting for opponent overlay */}
        {pongGame.waitingForOpponent && (
          <Overlay>
            <OverlayTitle>Waiting for opponent...</OverlayTitle>
            <Loader />
          </Overlay>
        )}
        
        {/* Game end overlay */}
        {gameResult.showEndScreen && (
          <Overlay>
            <OverlayTitle>{gameResult.winner} wins!</OverlayTitle>
            <ActionButton onClick={playAgain}>Play Again</ActionButton>
          </Overlay>
        )}
        
        <Canvas 
          ref={canvasRef} 
          width={GAME_WIDTH} 
          height={GAME_HEIGHT} 
        />
      </CanvasContainer>
    </GameContainer>
  );
};

export default PongGame; 