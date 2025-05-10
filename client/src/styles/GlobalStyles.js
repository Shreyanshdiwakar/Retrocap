import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --primary: #8c00ff;     /* Neon purple */
    --secondary: #FF10F0;   /* Neon pink */
    --highlight: #0aefff;   /* Neon cyan */
    --dark: #120458;        /* Dark purple */
    --light: #33E1FF;       /* Light cyan */
    --background: #000000;  /* Black */
    --text: #ffffff;        /* White */
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Press Start 2P', cursive;
    background-color: var(--background);
    color: var(--text);
    overflow-x: hidden;
    line-height: 1.6;
  }

  /* CRT Effect */
  .crt {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: var(--background);
    overflow: hidden;
  }

  .crt::before {
    content: " ";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    z-index: 2;
    background-size: 100% 2px, 3px 100%;
    pointer-events: none;
  }

  .crt::after {
    content: " ";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgba(18, 16, 16, 0.1);
    opacity: 0;
    z-index: 2;
    pointer-events: none;
    animation: flicker 0.15s infinite;
  }

  @keyframes flicker {
    0% { opacity: 0.27861; }
    5% { opacity: 0.34769; }
    10% { opacity: 0.23604; }
    15% { opacity: 0.90626; }
    20% { opacity: 0.18128; }
    25% { opacity: 0.83891; }
    30% { opacity: 0.65583; }
    35% { opacity: 0.67807; }
    40% { opacity: 0.26559; }
    45% { opacity: 0.84693; }
    50% { opacity: 0.96019; }
    55% { opacity: 0.08594; }
    60% { opacity: 0.20313; }
    65% { opacity: 0.71988; }
    70% { opacity: 0.53455; }
    75% { opacity: 0.37288; }
    80% { opacity: 0.71428; }
    85% { opacity: 0.70419; }
    90% { opacity: 0.7003; }
    95% { opacity: 0.36108; }
    100% { opacity: 0.24387; }
  }

  /* Neon Text Effect */
  .neon-text {
    color: var(--text);
    text-shadow: 0 0 5px var(--text), 
                 0 0 10px var(--primary), 
                 0 0 20px var(--primary), 
                 0 0 30px var(--primary), 
                 0 0 40px var(--primary);
    animation: neon-pulse 1.5s infinite alternate;
  }

  @keyframes neon-pulse {
    from {
      text-shadow: 0 0 5px var(--text), 
                  0 0 10px var(--primary), 
                  0 0 20px var(--primary), 
                  0 0 30px var(--primary), 
                  0 0 40px var(--primary);
    }
    to {
      text-shadow: 0 0 5px var(--text), 
                  0 0 10px var(--highlight), 
                  0 0 20px var(--highlight), 
                  0 0 30px var(--highlight), 
                  0 0 40px var(--highlight);
    }
  }

  /* Spinners and loaders */
  .loader {
    width: 50px;
    height: 50px;
    border: 5px solid var(--dark);
    border-top: 5px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 20px auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Container and common layouts */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    position: relative;
    z-index: 1;
  }
`;

export default GlobalStyles; 