import React, { useState } from 'react';
import styled from 'styled-components';
import { useSocket } from '../context/SocketContext';

const LoginContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 40px;
  background: rgba(18, 4, 88, 0.7);
  border: 2px solid var(--primary);
  border-radius: 5px;
  text-align: center;
`;

const Title = styled.h2`
  margin-bottom: 30px;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px;
  margin-bottom: 20px;
  background: var(--dark);
  border: 2px solid var(--primary);
  border-radius: 5px;
  color: var(--text);
  font-family: 'Press Start 2P', cursive;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 15px 30px;
  background: var(--primary);
  border: none;
  border-radius: 5px;
  color: var(--text);
  font-family: 'Press Start 2P', cursive;
  font-size: 16px;
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

const LoginScreen = () => {
  const [playerName, setPlayerName] = useState('');
  const { joinGame } = useSocket();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      joinGame(playerName);
    }
  };

  return (
    <LoginContainer>
      <Title className="neon-text">Enter Your Name</Title>
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Player Name"
          maxLength={10}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <Button type="submit">Join Arcade</Button>
      </form>
    </LoginContainer>
  );
};

export default LoginScreen; 