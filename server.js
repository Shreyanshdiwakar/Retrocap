const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const QRCode = require('qrcode');
const os = require('os');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Create express app and server
const app = express();
const server = http.createServer(app);

// Enable trust proxy to fix express-rate-limit warning
app.set('trust proxy', 1);

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
app.use(limiter);

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] // Replace with your actual domain
    : ['http://localhost:3001', 'http://192.168.29.60:3001', '*'],
  methods: ["GET", "POST"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Configure Socket.IO with proper CORS
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow all origins for Socket.IO connections
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'] // Ensure both transport methods are available
});

// Add error handling for socket connections
io.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

// Add connection rate limiting
const socketLimiter = new Map();
const MAX_CONNECTIONS_PER_IP = 5;
const CONNECTION_WINDOW_MS = 60000; // 1 minute

io.use((socket, next) => {
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  const now = Date.now();
  
  if (!socketLimiter.has(ip)) {
    socketLimiter.set(ip, { count: 1, timestamp: now });
    return next();
  }
  
  const data = socketLimiter.get(ip);
  if (now - data.timestamp > CONNECTION_WINDOW_MS) {
    socketLimiter.set(ip, { count: 1, timestamp: now });
    return next();
  }
  
  if (data.count >= MAX_CONNECTIONS_PER_IP) {
    return next(new Error('Too many connections from this IP'));
  }
  
  data.count++;
  next();
});

// Create the public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  console.log('Creating public directory for QR code...');
  fs.mkdirSync(publicDir);
}

// In development, serve static QR code
app.use('/static', express.static(path.join(__dirname, 'public')));

// Add a route for mobile users joining via QR code
app.get('/join', (req, res) => {
  // Get IP address for React app
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = req.headers.host.split(':')[0]; // Extract hostname from request
  
  // Use the request's hostname as fallback if we can't determine IP
  if (ipAddress === 'localhost') {
    // Find a non-internal IPv4 address
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          ipAddress = iface.address;
        }
      });
    });
  }

  // Here's the key change: use the same host as the request came from
  // This ensures proper redirection on the mobile device
  const sameHost = req.headers.host.split(':')[0];
  const reactAppUrl = `http://${sameHost}:3001`;
  
  console.log(`Redirecting to React app at: ${reactAppUrl}`);
  console.log(`Client IP: ${req.ip}, Headers: ${JSON.stringify(req.headers)}`);
  
  // Redirect to the React app
  res.redirect(reactAppUrl);
});

// Add a simple response for the root path in development
app.get('/', (req, res) => {
  res.send('Retro Arcade API Server is running. Connect from your React app at http://localhost:3001');
});

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
    interval: null,
    frameRate: 60, // Default frame rate
    lastFrameTime: 0,
    frameTimeHistory: [], // For frame rate calculation
    isMobile: false, // Track if any player is on mobile
    paddleHitCooldown: 100 // 100ms cooldown period
  }
};

const leaderboard = [];

// Generate a QR code for the server address
function generateQRCode() {
  console.log('Generating QR code...');
  // Get IP address
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  
  // Find a non-internal IPv4 address
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddress = iface.address;
        console.log(`Found IPv4 address: ${ipAddress}`);
      }
    });
  });

  // Create a URL that users can access the React app from mobile devices
  // Point to a /join path which the server will handle
  const serverUrl = `http://${ipAddress}:9876/join`;
  console.log(`Generated server URL: ${serverUrl}`);
  
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
        console.log(`QR Code generated at ${path.join(__dirname, 'public', 'qrcode.png')}`);
        console.log(`Open ${serverUrl} in your browser to play`);
      }
    }
  );
  
  return serverUrl;
}

// Frame rate adaptation
function calculateOptimalFrameRate() {
  const pong = games.pong;
  const now = Number(process.hrtime.bigint()) / 1000000; // Convert to milliseconds
  const frameTime = now - pong.lastFrameTime;
  pong.lastFrameTime = now;
  
  // Keep track of last 60 frame times
  pong.frameTimeHistory.push(frameTime);
  if (pong.frameTimeHistory.length > 60) {
    pong.frameTimeHistory.shift();
  }
  
  // Calculate average frame time
  const avgFrameTime = pong.frameTimeHistory.reduce((a, b) => a + b, 0) / pong.frameTimeHistory.length;
  
  // Adjust frame rate based on performance
  if (avgFrameTime > 20) { // If frame time > 20ms (50 FPS)
    pong.frameRate = Math.max(30, pong.frameRate - 5); // Decrease frame rate but not below 30
  } else if (avgFrameTime < 12 && !pong.isMobile) { // If frame time < 12ms (83 FPS) and not mobile
    pong.frameRate = Math.min(60, pong.frameRate + 5); // Increase frame rate but not above 60
  }
  
  return pong.frameRate;
}

// Modified startPongGameLoop with frame rate adaptation
function startPongGameLoop() {
  if (games.pong.interval) {
    clearInterval(games.pong.interval);
  }
  
  resetBall();
  games.pong.scoreLeft = 0;
  games.pong.scoreRight = 0;
  games.pong.active = true;
  games.pong.lastFrameTime = Number(process.hrtime.bigint()) / 1000000; // Convert to milliseconds
  games.pong.frameTimeHistory = [];
  
  io.to('pong').emit('scoreUpdate', {
    left: games.pong.scoreLeft,
    right: games.pong.scoreRight
  });
  
  function gameLoop() {
    if (!games.pong.active) {
      return;
    }
    
    const frameRate = calculateOptimalFrameRate();
    updatePongGame();
    
    // Schedule next frame
    games.pong.interval = setTimeout(gameLoop, 1000 / frameRate);
  }
  
  gameLoop();
}

function updatePongGame() {
  const pong = games.pong;
  const ball = pong.ball;
  
  // Store previous position for collision detection
  const prevX = ball.x;
  const prevY = ball.y;
  
  // Move the ball
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  // Safeguard against extremely slow horizontal movement
  // If horizontal speed is too low, increase it while maintaining direction
  const minHorizontalSpeed = pong.isMobile ? 1.5 : 2.0;
  if (Math.abs(ball.dx) < minHorizontalSpeed) {
    ball.dx = (ball.dx >= 0 ? 1 : -1) * minHorizontalSpeed;
    console.log(`Applied minimum horizontal speed: ${ball.dx.toFixed(2)}`);
  }
  
  // Safeguard against extremely fast speeds that can cause physics issues
  const maxTotalSpeed = pong.isMobile ? 12 : 9;
  const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
  if (currentSpeed > maxTotalSpeed) {
    // Scale both components down proportionally
    const scaleFactor = maxTotalSpeed / currentSpeed;
    ball.dx *= scaleFactor;
    ball.dy *= scaleFactor;
    console.log(`Reduced excessive speed: dx=${ball.dx.toFixed(2)}, dy=${ball.dy.toFixed(2)}`);
  }
  
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
  
  // Enhanced Left paddle collision with trajectory check
  if (ball.dx < 0) { 
    // Check if ball is moving left toward paddle
    const leftPaddleRight = pong.paddleOffset + pong.paddleWidth;
    const ballLeft = ball.x - ball.radius;
    
    // Check if ball crossed paddle in this frame or is inside paddle
    if ((prevX - ball.radius > leftPaddleRight && ballLeft <= leftPaddleRight) ||
        (ballLeft <= leftPaddleRight && ballLeft >= pong.paddleOffset)) {
      
      // Check vertical position
      if (ball.y + ball.radius >= pong.leftPaddleY && 
          ball.y - ball.radius <= pong.leftPaddleY + pong.paddleHeight) {
        
        // Place ball at paddle edge to prevent sticking or sliding past
        ball.x = leftPaddleRight + ball.radius + 1; // Add 1px extra space
        
        // Adjust angle based on where the ball hit the paddle
        const hitPosition = (ball.y - pong.leftPaddleY) / pong.paddleHeight;
        adjustBallTrajectory(hitPosition);
        
        // Log collision for debugging
        console.log("Left paddle collision detected!");
        
        // Add flag to prevent multiple collisions in the same area
        ball.lastLeftPaddleHit = Date.now();
      }
    }
  }
  
  // Enhanced Right paddle collision with trajectory check
  if (ball.dx > 0) {
    // Check if ball is moving right toward paddle
    const rightPaddleLeft = pong.gameWidth - pong.paddleOffset - pong.paddleWidth;
    const ballRight = ball.x + ball.radius;
    
    // Check if ball crossed paddle in this frame or is inside paddle
    if ((prevX + ball.radius < rightPaddleLeft && ballRight >= rightPaddleLeft) ||
        (ballRight >= rightPaddleLeft && ballRight <= pong.gameWidth - pong.paddleOffset)) {
      
      // Check vertical position
      if (ball.y + ball.radius >= pong.rightPaddleY && 
          ball.y - ball.radius <= pong.rightPaddleY + pong.paddleHeight) {
        
        // Place ball at paddle edge to prevent sticking or sliding past
        ball.x = rightPaddleLeft - ball.radius - 1; // Add 1px extra space
        
        // Adjust angle based on where the ball hit the paddle
        const hitPosition = (ball.y - pong.rightPaddleY) / pong.paddleHeight;
        adjustBallTrajectory(hitPosition);
        
        // Log collision for debugging
        console.log("Right paddle collision detected!");
        
        // Add flag to prevent multiple collisions in the same area
        ball.lastRightPaddleHit = Date.now();
      }
    }
  }
  
  // Ball out of bounds - scoring
  // Only register scoring if we haven't just hit the paddle (prevent sliding through)
  const now = Date.now();
  const paddleHitCooldown = pong.paddleHitCooldown; // 100ms cooldown period
  
  if (ball.x - ball.radius < 0 && 
      (!ball.lastLeftPaddleHit || now - ball.lastLeftPaddleHit > paddleHitCooldown)) {
    // Right player scores - only if not immediately after paddle hit
    pong.scoreRight += 1;
    io.to('pong').emit('scoreUpdate', {
      left: pong.scoreLeft,
      right: pong.scoreRight
    });
    
    checkGameEnd();
    resetBall();
  } else if (ball.x + ball.radius > pong.gameWidth && 
            (!ball.lastRightPaddleHit || now - ball.lastRightPaddleHit > paddleHitCooldown)) {
    // Left player scores - only if not immediately after paddle hit
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
  
  // Set minimum speed to prevent ball from stopping
  const minSpeed = games.pong.isMobile ? 3.5 : 4.0;
  
  // Use either current speed or minimum speed, whichever is higher
  const effectiveSpeed = Math.max(speed, minSpeed);
  
  // Save the current direction before changing it (for debugging)
  const oldDx = games.pong.ball.dx;
  
  // Determine direction based on current dx value
  // If dx is positive, ball is moving right and should now go left
  // If dx is negative, ball is moving left and should now go right
  const direction = games.pong.ball.dx > 0 ? -1 : 1;
  
  // Calculate new velocity components with proper direction
  games.pong.ball.dx = direction * Math.abs(effectiveSpeed) * Math.cos(angle);
  games.pong.ball.dy = effectiveSpeed * Math.sin(angle);
  
  // Increase speed slightly with each hit, but with a max cap
  // Use different speed increases and caps based on device type
  const maxSpeed = games.pong.isMobile ? 12 : 9;
  const speedIncreaseFactor = games.pong.isMobile ? 1.03 : 1.02;
  
  // Apply speed increase only if below max
  if (effectiveSpeed < maxSpeed) {
    games.pong.ball.dx *= speedIncreaseFactor;
    games.pong.ball.dy *= speedIncreaseFactor;
  } else {
    // If we're already at max speed, normalize to ensure consistent speed
    const currentSpeed = Math.sqrt(games.pong.ball.dx * games.pong.ball.dx + games.pong.ball.dy * games.pong.ball.dy);
    const normalizer = maxSpeed / currentSpeed;
    games.pong.ball.dx *= normalizer;
    games.pong.ball.dy *= normalizer;
  }
  
  // Enhanced debug logging
  console.log(`Ball trajectory adjusted:`);
  console.log(`  - Previous dx: ${oldDx.toFixed(2)} → New dx: ${games.pong.ball.dx.toFixed(2)}`);
  console.log(`  - Direction: ${direction > 0 ? 'right' : 'left'}, Angle: ${(angle * 180 / Math.PI).toFixed(2)}°`);
  console.log(`  - Final speed: dx=${games.pong.ball.dx.toFixed(2)}, dy=${games.pong.ball.dy.toFixed(2)}`);
}

function resetBall() {
  const pong = games.pong;
  const ball = pong.ball;
  
  // Reset ball to center
  ball.x = pong.gameWidth / 2;
  ball.y = pong.gameHeight / 2;
  
  // Clear paddle hit flags
  ball.lastLeftPaddleHit = null;
  ball.lastRightPaddleHit = null;
  
  // Random direction, but avoid extreme angles
  const angle = (Math.random() * Math.PI / 3) - Math.PI / 6; // -30 to 30 degrees for more horizontal movement
  const direction = Math.random() < 0.5 ? -1 : 1;
  
  // Base speed - device specific
  const baseSpeed = pong.isMobile ? 4 : 4.5;
  
  // Ensure minimum x velocity component to prevent ball from moving mostly vertical
  ball.dx = direction * baseSpeed * Math.cos(angle);
  ball.dy = baseSpeed * Math.sin(angle);
  
  // Ensure the horizontal speed component is sufficient
  const minHorizontalSpeed = pong.isMobile ? 2.5 : 3.5;
  if (Math.abs(ball.dx) < minHorizontalSpeed) {
    // Maintain the sign but increase the magnitude
    ball.dx = (ball.dx >= 0 ? 1 : -1) * minHorizontalSpeed;
  }
  
  // Ensure vertical speed is not too high
  const maxVerticalSpeed = pong.isMobile ? 2.5 : 2.0;
  if (Math.abs(ball.dy) > maxVerticalSpeed) {
    // Maintain the sign but reduce the magnitude
    ball.dy = (ball.dy >= 0 ? 1 : -1) * maxVerticalSpeed;
  }
  
  // Debug log
  console.log(`Ball reset with speed: dx=${ball.dx.toFixed(2)}, dy=${ball.dy.toFixed(2)}, isMobile=${pong.isMobile}`);
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
  console.log('Socket handshake details:', socket.handshake.address, socket.handshake.headers.origin);
  
  // Log all active connections
  console.log('Current connections:', Object.keys(io.sockets.sockets).length);
  
  // Send initial leaderboard data
  socket.emit('leaderboardUpdate', leaderboard);
  
  // Player joins
  socket.on('playerJoin', (playerName) => {
    console.log(`Player ${playerName} (${socket.id}) attempting to join the game`);
    
    // Only add player if not already in the list
    if (!players[socket.id]) {
      players[socket.id] = {
        id: socket.id,
        name: playerName,
        score: 0
      };
      
      console.log(`Added new player ${playerName}. Total players:`, Object.keys(players).length);
      io.emit('playersList', Object.values(players));
      socket.emit('joinSuccess', socket.id);
      console.log(`Player ${playerName} (${socket.id}) joined the game`);
      
      // Update leaderboard after new player joins
      updateLeaderboard();
    } else {
      console.log(`Player ${playerName} (${socket.id}) already in game, sending refresh`);
      socket.emit('joinSuccess', socket.id);
    }
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
    // Validate position is a number
    if (typeof position !== 'number') {
      console.error('Invalid paddle position received:', position);
      return;
    }
    
    // Determine if player is left or right
    let side = null;
    if (games.pong.players.left === socket.id) side = 'left';
    if (games.pong.players.right === socket.id) side = 'right';
    
    if (side) {
      console.log(`Player ${side} moved paddle to position: ${position}`);
      
      // Update paddle position
      if (side === 'left') {
        games.pong.leftPaddleY = position;
      } else {
        games.pong.rightPaddleY = position;
      }
      
      // Broadcast paddle position to other player
      socket.to('pong').emit('opponentPaddleMove', { side, position });
    } else {
      console.error(`Player ${socket.id} tried to move paddle but is not assigned to a side`);
    }
  });
  
  // Socket error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  // Socket disconnection
  socket.on('disconnect', (reason) => {
    console.log('Player disconnected:', socket.id, 'Reason:', reason);
    
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

  // Add mobile detection to socket connection
  socket.on('deviceInfo', (info) => {
    if (info.isMobile) {
      games.pong.isMobile = true;
      // Adjust game parameters for mobile
      games.pong.paddleHeight = 150; // Larger paddles for mobile
      games.pong.ball.radius = 15; // Larger ball for mobile
      games.pong.frameRate = 30; // Lower frame rate for mobile
    }
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
const PORT = process.env.PORT || 9876;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const serverUrl = generateQRCode();
}); 