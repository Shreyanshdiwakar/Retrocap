# Retro Arcade in a Browser

A multiplayer retro arcade system that runs in the browser, letting players join via QR code and play classic games like Pong in real-time with a nostalgic CRT-styled interface.

![Retro Arcade](public/qrcode.png)

## Features

- **Multiplayer Lobby**: See who's connected and choose a game to play
- **Real-time Pong**: Classic Pong game with multiplayer support
- **Leaderboard**: Track scores and wins across players
- **Retro UI**: Pixel fonts, CRT filter, and neon aesthetics
- **QR Code Joining**: Easy access for new players via generated QR code
- **Mobile Support**: Play on any device with a modern browser

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Graphics**: HTML5 Canvas
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **QR Code Generation**: qrcode library

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/retro-arcade-in-a-browser.git
   cd retro-arcade-in-a-browser
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Joining a Game

1. When the server starts, it automatically generates a QR code that lets other devices on the same network join.
2. The QR code is displayed on the main page and saved as `public/qrcode.png`.
3. Other players can scan this code to join from their devices.

## How to Play Pong

1. Enter your name on the login screen.
2. From the lobby, click "PLAY PONG".
3. Choose a side (LEFT or RIGHT).
4. Wait for another player to join the other side.
5. Use arrow keys (↑/↓) to move your paddle up and down.
6. On mobile, touch and drag to move the paddle.
7. First player to reach 10 points wins!

## Extending the Arcade

### Adding More Games

1. Create new game screens in `public/index.html`.
2. Add game logic in new JavaScript files.
3. Update the server to handle the new game's socket communications.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Classic arcade game designers who inspired this project
- The Socket.IO team for making real-time communication easy
- All retro game enthusiasts! 