const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const QRCode = require('qrcode');
const os = require('os');

// Create express app and server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
const players = {};
const games = {
  pong: {
    players: {},
    ball: { x: 400, y: 300, dx: 5, dy: 5, radius: 10 },
    gameWidth: 800,
    gameHeight: 600,
    paddleHeight: 100,
    paddleWidth: 10,
    paddleOffset: 30,
    leftPaddleY: 250,
    rightPaddleY: 250,
    scoreLeft: 0,
    scoreRight: 0,
    active: false,
    interval: null
  }
};

const leaderboard = [];

// Generate a QR code for the server address
function generateQRCode() {
  // Get IP address
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  
  // Find a non-internal IPv4 address
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address;
      }
    });
  });

  const serverUrl = `http://${ipAddress}:3000`;
  
  // Generate QR code and save it
  QRCode.toFile(
    path.join(__dirname, 'public', 'qrcode.png'),
    serverUrl,
    {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 8,
      color: {
        dark: '#8c00ff',  // Neon purple for the dark part
        light: '#ffffff'  // White for the light part
      }
    },
    (err) => {
      if (err) {
        console.error('Error generating QR code:', err);
      } else {
        console.log(`QR Code generated at ${serverUrl}`);
        console.log(`Open ${serverUrl} in your browser to play`);
      }
    }
  );
  
  return serverUrl;
}

// Pong game physics
function startPongGameLoop() {
  // Clear existing interval if any
  if (games.pong.interval) {
    clearInterval(games.pong.interval);
  }
  
  // Reset ball and scores
  resetBall();
  games.pong.scoreLeft = 0;
  games.pong.scoreRight = 0;
  games.pong.active = true;
  
  io.to('pong').emit('scoreUpdate', {
    left: games.pong.scoreLeft,
    right: games.pong.scoreRight
  });
  
  // Start game loop
  games.pong.interval = setInterval(() => {
    if (!games.pong.active) {
      clearInterval(games.pong.interval);
      games.pong.interval = null;
      return;
    }
    
    updatePongGame();
  }, 1000 / 60); // 60 FPS
}

function updatePongGame() {
  const pong = games.pong;
  const ball = pong.ball;
  
  // Move the ball
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  // Ball collision with top and bottom walls
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > pong.gameHeight) {
    ball.dy = -ball.dy;
    // Keep ball in bounds
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
    } else if (ball.y + ball.radius > pong.gameHeight) {
      ball.y = pong.gameHeight - ball.radius;
    }
  }
  
  // Left paddle collision
  if (ball.dx < 0 && 
      ball.x - ball.radius <= pong.paddleOffset + pong.paddleWidth &&
      ball.x - ball.radius >= pong.paddleOffset &&
      ball.y >= pong.leftPaddleY &&
      ball.y <= pong.leftPaddleY + pong.paddleHeight) {
    
    ball.dx = -ball.dx;
    // Adjust angle based on where the ball hit the paddle
    const hitPosition = (ball.y - pong.leftPaddleY) / pong.paddleHeight;
    adjustBallTrajectory(hitPosition);
  }
  
  // Right paddle collision
  if (ball.dx > 0 && 
      ball.x + ball.radius >= pong.gameWidth - pong.paddleOffset - pong.paddleWidth &&
      ball.x + ball.radius <= pong.gameWidth - pong.paddleOffset &&
      ball.y >= pong.rightPaddleY &&
      ball.y <= pong.rightPaddleY + pong.paddleHeight) {
    
    ball.dx = -ball.dx;
    // Adjust angle based on where the ball hit the paddle
    const hitPosition = (ball.y - pong.rightPaddleY) / pong.paddleHeight;
    adjustBallTrajectory(hitPosition);
  }
  
  // Ball out of bounds - scoring
  if (ball.x - ball.radius < 0) {
    // Right player scores
    pong.scoreRight += 1;
    io.to('pong').emit('scoreUpdate', {
      left: pong.scoreLeft,
      right: pong.scoreRight
    });
    
    checkGameEnd();
    resetBall();
  } else if (ball.x + ball.radius > pong.gameWidth) {
    // Left player scores
    pong.scoreLeft += 1;
    io.to('pong').emit('scoreUpdate', {
      left: pong.scoreLeft,
      right: pong.scoreRight
    });
    
    checkGameEnd();
    resetBall();
  }
  
  // Send ball position to clients
  io.to('pong').emit('ballPosition', {
    x: ball.x,
    y: ball.y
  });
}

function adjustBallTrajectory(hitPosition) {
  // Adjust angle based on where the ball hit the paddle
  // hitPosition is between 0 (top of paddle) and 1 (bottom of paddle)
  // We want to give a range of angles from -45 to 45 degrees
  const angle = (hitPosition - 0.5) * Math.PI / 2; // -PI/4 to PI/4 radians
  
  // Calculate new velocity components based on angle
  const speed = Math.sqrt(games.pong.ball.dx * games.pong.ball.dx + games.pong.ball.dy * games.pong.ball.dy);
  games.pong.ball.dx = Math.abs(games.pong.ball.dx) * Math.cos(angle);
  games.pong.ball.dy = speed * Math.sin(angle);
  
  // Increase speed slightly with each hit
  games.pong.ball.dx *= 1.05;
  games.pong.ball.dy *= 1.05;
}

function resetBall() {
  const pong = games.pong;
  const ball = pong.ball;
  
  // Reset ball to center
  ball.x = pong.gameWidth / 2;
  ball.y = pong.gameHeight / 2;
  
  // Random direction
  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // -45 to 45 degrees
  const direction = Math.random() < 0.5 ? -1 : 1;
  
  // Base speed
  const speed = 5;
  
  ball.dx = direction * speed * Math.cos(angle);
  ball.dy = speed * Math.sin(angle);
}

function checkGameEnd() {
  if (games.pong.scoreLeft >= 10) {
    endPongGame('left');
  } else if (games.pong.scoreRight >= 10) {
    endPongGame('right');
  }
}

function endPongGame(winningSide) {
  games.pong.active = false;
  
  if (games.pong.interval) {
    clearInterval(games.pong.interval);
    games.pong.interval = null;
  }
  
  const winnerId = games.pong.players[winningSide];
  if (players[winnerId]) {
    players[winnerId].score += 1;
    
    // Update leaderboard
    updateLeaderboard();
    
    // Notify clients
    io.to('pong').emit('gameEnd', {
      winner: players[winnerId].name,
      leaderboard: leaderboard.slice(0, 10) // Top 10
    });
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  // Player joins
  socket.on('playerJoin', (playerName) => {
    players[socket.id] = {
      id: socket.id,
      name: playerName,
      score: 0
    };
    
    io.emit('playersList', Object.values(players));
    socket.emit('joinSuccess', socket.id);
    console.log(`Player ${playerName} (${socket.id}) joined the game`);
  });
  
  // Player joins Pong game
  socket.on('joinPong', (side) => {
    if (side === 'left' && !games.pong.players.left) {
      games.pong.players.left = socket.id;
    } else if (side === 'right' && !games.pong.players.right) {
      games.pong.players.right = socket.id;
    } else {
      return socket.emit('gameJoinFailed', 'Position already taken');
    }
    
    socket.join('pong');
    io.to('pong').emit('pongPlayersUpdate', games.pong.players);
    
    // Start game if both players are ready
    if (games.pong.players.left && games.pong.players.right) {
      io.to('pong').emit('pongGameStart');
      console.log('Pong game started');
      startPongGameLoop();
    }
  });
  
  // Player paddle movement
  socket.on('paddleMove', (position) => {
    // Determine if player is left or right
    let side = null;
    if (games.pong.players.left === socket.id) side = 'left';
    if (games.pong.players.right === socket.id) side = 'right';
    
    if (side) {
      // Update paddle position
      if (side === 'left') {
        games.pong.leftPaddleY = position;
      } else {
        games.pong.rightPaddleY = position;
      }
      
      // Broadcast paddle position to other player
      socket.to('pong').emit('opponentPaddleMove', { side, position });
    }
  });
  
  // Player disconnects
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Remove from pong game if playing
    if (games.pong.players.left === socket.id) {
      games.pong.players.left = null;
      io.to('pong').emit('playerLeftGame', { side: 'left' });
      
      // Stop game
      games.pong.active = false;
      if (games.pong.interval) {
        clearInterval(games.pong.interval);
        games.pong.interval = null;
      }
    } else if (games.pong.players.right === socket.id) {
      games.pong.players.right = null;
      io.to('pong').emit('playerLeftGame', { side: 'right' });
      
      // Stop game
      games.pong.active = false;
      if (games.pong.interval) {
        clearInterval(games.pong.interval);
        games.pong.interval = null;
      }
    }
    
    // Remove from players list
    delete players[socket.id];
    io.emit('playersList', Object.values(players));
  });
});

function updateLeaderboard() {
  leaderboard.length = 0;
  
  Object.values(players)
    .sort((a, b) => b.score - a.score)
    .forEach(player => {
      leaderboard.push({
        name: player.name,
        score: player.score
      });
    });
  
  io.emit('leaderboardUpdate', leaderboard);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const serverUrl = generateQRCode();
}); 