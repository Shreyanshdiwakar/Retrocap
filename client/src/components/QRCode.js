import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const QRContainer = styled.div`
  flex: 1;
  max-width: 200px;
  margin: 0 auto;
`;

const QRTitle = styled.h2`
  font-size: 1rem;
  margin-bottom: 10px;
`;

const QRImageContainer = styled.div`
  padding: 10px;
  background: var(--text);
  border-radius: 5px;
  margin-top: 10px;
`;

const QRImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const QRCode = () => {
  const [qrImageUrl, setQRImageUrl] = useState('/static/qrcode.png');
  
  useEffect(() => {
    // If we're in development mode, update the URL to include the timestamp
    // to avoid caching when the QR code changes
    if (process.env.NODE_ENV === 'development') {
      setQRImageUrl(`/static/qrcode.png?t=${new Date().getTime()}`);
    }
  }, []);

  return (
    <QRContainer>
      <QRTitle>Join the game!</QRTitle>
      <QRImageContainer>
        <QRImage src={qrImageUrl} alt="QR Code to join the game" />
      </QRImageContainer>
    </QRContainer>
  );
};

export default QRCode; 