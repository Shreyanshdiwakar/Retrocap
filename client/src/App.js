import React from 'react';
import styled from 'styled-components';
import { SocketProvider } from './context/SocketContext';
import { GameProvider, useGame, SCREENS } from './context/GameContext';
import GlobalStyles from './styles/GlobalStyles';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginScreen from './components/LoginScreen';
import LobbyScreen from './components/LobbyScreen';
import PongGame from './components/PongGame';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import './App.css';

// Import Google Font
const googleFontLink = document.createElement('link');
googleFontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
googleFontLink.rel = 'stylesheet';
document.head.appendChild(googleFontLink);

const CRTEffect = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: var(--background);
  overflow: hidden;
`;

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 1;
`;

const MainContent = styled.main``;

// Switch between screens based on current game state
const ScreenSwitcher = () => {
  const { currentScreen } = useGame();
  
  switch (currentScreen) {
    case SCREENS.LOGIN:
      return <LoginScreen />;
    case SCREENS.LOBBY:
      return <LobbyScreen />;
    case SCREENS.PONG:
      return <PongGame />;
    default:
      return <LoginScreen />;
  }
};

// Component to handle device info
const DeviceInfoHandler = ({ children }) => {
  useDeviceInfo();
  return children;
};

function App() {
  return (
    <>
      <GlobalStyles />
      <SocketProvider>
        <GameProvider>
          <DeviceInfoHandler>
            <CRTEffect className="crt">
              <Container className="container">
                <Header />
                <MainContent>
                  <ScreenSwitcher />
                </MainContent>
                <Footer />
              </Container>
            </CRTEffect>
          </DeviceInfoHandler>
        </GameProvider>
      </SocketProvider>
    </>
  );
}

export default App;
