import { useState, useEffect, useRef } from 'react';

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
  const keysRef = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Log key press to help with debugging
      console.log('Key down:', e.key);
      
      // Special handling for arrow keys which can sometimes be problematic
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (preventDefault) e.preventDefault();
      }
      
      if (stopPropagation) e.stopPropagation();
      
      // Update ref immediately for more responsive controls
      keysRef.current = {
        ...keysRef.current,
        [e.key]: true
      };
      
      // Update state for React rendering
      setKeys(prevKeys => ({
        ...prevKeys,
        [e.key]: true
      }));
    };

    const handleKeyUp = (e) => {
      // Special handling for arrow keys
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (preventDefault) e.preventDefault();
      }
      
      if (stopPropagation) e.stopPropagation();
      
      // Update ref immediately
      keysRef.current = {
        ...keysRef.current,
        [e.key]: false
      };
      
      // Update state for React rendering
      setKeys(prevKeys => ({
        ...prevKeys,
        [e.key]: false
      }));
    };

    // Make sure to focus on the document when the component mounts
    document.body.focus();
    
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