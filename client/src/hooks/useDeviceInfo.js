import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export const useDeviceInfo = () => {
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    socket.emit('deviceInfo', { isMobile });
    return () => {
      socket.off('deviceInfo');
    };
  }, [socket]);
}; 