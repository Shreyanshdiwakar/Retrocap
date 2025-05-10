import { useState, useEffect } from 'react';

/**
 * Custom hook for keyboard controls
 * @param {object} options - Configuration options
 * @param {boolean} options.preventDefault - Whether to prevent default behavior
 * @param {boolean} options.stopPropagation - Whether to stop propagation
 * @returns {object} Object containing pressed keys state
 */
const useKeyboard = (options = {}) => {
  const { preventDefault = true, stopPropagation = false } = options;
  const [keys, setKeys] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      
      setKeys(prevKeys => ({
        ...prevKeys,
        [e.key]: true
      }));
    };

    const handleKeyUp = (e) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      
      setKeys(prevKeys => ({
        ...prevKeys,
        [e.key]: false
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [preventDefault, stopPropagation]);

  return keys;
};

export default useKeyboard; 