import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  text-align: center;
  margin-top: 40px;
  padding: 20px;
  border-top: 4px solid var(--primary);
  font-size: 0.8rem;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <p>© {currentYear} Retro Arcade - Press Start to Play!</p>
    </FooterContainer>
  );
};

export default Footer; 