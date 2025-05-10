import React from 'react';
import styled from 'styled-components';
import { useSocket } from '../context/SocketContext';
import { useGame, SCREENS } from '../context/GameContext';
import Leaderboard from './Leaderboard';

const LobbyContainer = styled.div`
  padding: 20px 0;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 30px;
`;

const FlexContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
`;

const Section = styled.div`
  flex: 1;
  min-width: 300px;
  background: rgba(18, 4, 88, 0.7);
  border: 2px solid var(--primary);
  border-radius: 5px;
  padding: 20px;
`;

const SectionTitle = styled.h3`
  color: var(--light);
  margin-bottom: 15px;
  border-bottom: 2px solid var(--primary);
  padding-bottom: 10px;
`;

const PlayersList = styled.ul`
  list-style: none;
`;

const PlayerItem = styled.li`
  padding: 10px;
  margin-bottom: 5px;
  background: var(--dark);
  border-radius: 3px;
  
  &.current-player {
    border-left: 4px solid var(--highlight);
  }
`;

const GameCard = styled.div`
  background: var(--dark);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 20px;
  border: 2px solid transparent;
  transition: all 0.3s;
  
  &:hover {
    border-color: var(--highlight);
    transform: translateY(-5px);
  }
`;

const GameTitle = styled.div`
  background: var(--primary);
  padding: 10px;
  text-align: center;
  font-weight: bold;
`;

const GameThumbnail = styled.div`
  height: 150px;
  background: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const PongPreview = styled.div`
  width: 90%;
  height: 70%;
  position: relative;
  border: 2px solid var(--light);
`;

const PongPaddle = styled.div`
  position: absolute;
  width: 10px;
  height: 40px;
  background: var(--text);
  
  ${props => props.left ? `
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
  ` : `
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  `}
`;

const PongBall = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--highlight);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const GameButton = styled.button`
  width: 100%;
  padding: 15px;
  background: var(--primary);
  border: none;
  color: var(--text);
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: var(--secondary);
  }
`;

const LobbyScreen = () => {
  const { players, playerId } = useSocket();
  const { setCurrentScreen } = useGame();

  const startPongGame = () => {
    setCurrentScreen(SCREENS.PONG);
  };

  return (
    <LobbyContainer>
      <Title className="neon-text">Game Lobby</Title>
      
      <FlexContainer>
        <Section>
          <SectionTitle>Players Online</SectionTitle>
          <PlayersList>
            {players.map(player => (
              <PlayerItem 
                key={player.id} 
                className={player.id === playerId ? 'current-player' : ''}
              >
                {player.name} {player.id === playerId && '(You)'}
              </PlayerItem>
            ))}
            {players.length === 0 && <PlayerItem>No players online</PlayerItem>}
          </PlayersList>
        </Section>
        
        <Section>
          <SectionTitle>Available Games</SectionTitle>
          <GameCard>
            <GameTitle>PONG</GameTitle>
            <GameThumbnail>
              <PongPreview>
                <PongPaddle left />
                <PongBall />
                <PongPaddle />
              </PongPreview>
            </GameThumbnail>
            <GameButton onClick={startPongGame}>PLAY PONG</GameButton>
          </GameCard>
          {/* More games can be added here */}
        </Section>
      </FlexContainer>
      
      <Leaderboard />
    </LobbyContainer>
  );
};

export default LobbyScreen; 