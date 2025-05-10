import React from 'react';
import styled from 'styled-components';
import QRCode from './QRCode';

const HeaderContainer = styled.header`
  text-align: center;
  padding: 20px 0;
  border-bottom: 4px solid var(--primary);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  letter-spacing: 3px;
  flex: 1;
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Title className="neon-text">RETRO ARCADE</Title>
      <QRCode />
    </HeaderContainer>
  );
};

export default Header; 