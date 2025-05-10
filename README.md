# Retro Arcade in a Browser

A browser-based multiplayer retro arcade game platform featuring classic games like Pong with mobile device support for controllers.

## Features

- Classic Pong game with multiplayer support
- Mobile device integration as controllers via QR code scanning
- Real-time gameplay using Socket.IO
- Responsive design for various screen sizes
- Leaderboard system to track player scores

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.IO
- **QR Code Generation**: qrcode

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Retro-Arcade-in-a-Browser.git
   cd Retro-Arcade-in-a-Browser
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Install client dependencies:
   ```
   cd client
   npm install
   cd ..
   ```

4. Create a `.env` file in the root directory (optional):
   ```
   PORT=9876
   NODE_ENV=development
   ```

## Running the Application

1. Start the development server and client:
   ```
   npm run dev
   ```

   Or run server and client separately:
   ```
   npm run server
   npm run client
   ```

2. Open your browser and navigate to:
   - React app: http://localhost:3001
   - Server: http://localhost:9876

3. To use a mobile device as a controller, scan the QR code displayed on the game screen with your mobile device.

## How to Play

1. Open the application in your browser
2. Select "Pong" from the game menu
3. Choose which side you want to play (left or right)
4. Use arrow keys or W/S keys to move your paddle up and down
5. For mobile controllers, scan the QR code and use touch controls on your device
6. First player to reach 10 points wins

## Development

- Server code is in `server.js` in the root directory
- React frontend code is in the `client` directory
- Game logic is primarily handled on the server side with Socket.IO for real-time communication

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by classic arcade games
- Built with modern web technologies for a retro gaming experience


- Built with modern web technologies for a retro gaming experience

