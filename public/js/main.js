// Connect to the server via Socket.IO
const socket = io();

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
const pongScreen = document.getElementById('pongScreen');
const playerNameInput = document.getElementById('playerName');
const joinButton = document.getElementById('joinButton');
const playersList = document.getElementById('playersList');
const leaderboardBody = document.getElementById('leaderboardBody');
const pongCanvas = document.getElementById('pongCanvas');
const pongSelectSide = document.getElementById('pongSelectSide');
const waitingOverlay = document.getElementById('waitingOverlay');
const gameEndOverlay = document.getElementById('gameEndOverlay');
const selectLeft = document.getElementById('selectLeft');
const selectRight = document.getElementById('selectRight');
const backToLobby = document.getElementById('backToLobby');
const playAgain = document.getElementById('playAgain');
const leftScore = document.getElementById('leftScore');
const rightScore = document.getElementById('rightScore');
const winnerMessage = document.getElementById('winnerMessage');

// Game variables
let playerId;
let playerName;
let currentSide = null;
let opponentPaddleY = 300;
let ctx;
let pongGame;
let keys = {};
let paddleY = 250;
let gameActive = false;
let ballX = 400;
let ballY = 300;

// Constants for Pong game
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 8;
const PADDLE_OFFSET = 30;

// Audio effects (optional)
const paddleHitSound = new Audio();
const wallHitSound = new Audio();
const scoreSound = new Audio();

// Function to add beep sounds
function initSounds() {
  // Simple beep sounds using the Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  function createBeepSound(freq, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.value = freq;
    gainNode.gain.value = 0.1;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, duration);
  }
  
  paddleHitSound.play = () => createBeepSound(220, 50);
  wallHitSound.play = () => createBeepSound(180, 50);
  scoreSound.play = () => createBeepSound(120, 200);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Set up the game canvas
  ctx = pongCanvas.getContext('2d');
  
  // Add event listeners
  joinButton.addEventListener('click', joinGame);
  playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinGame();
  });
  
  document.querySelector('.join-game[data-game="pong"]').addEventListener('click', () => {
    showScreen(pongScreen);
    showElement(pongSelectSide);
    hideElement(waitingOverlay);
    hideElement(gameEndOverlay);
  });
  
  selectLeft.addEventListener('click', () => joinPongGame('left'));
  selectRight.addEventListener('click', () => joinPongGame('right'));
  backToLobby.addEventListener('click', returnToLobby);
  playAgain.addEventListener('click', () => {
    hideElement(gameEndOverlay);
    joinPongGame(currentSide);
  });
  
  // Keyboard events for paddle movement
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
  });
  
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });
  
  // Mobile touch controls
  pongCanvas.addEventListener('touchmove', handleTouchMove);
  
  // Initialize sounds (optional)
  //initSounds();
});

// Socket.IO event handlers
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('playersList', (players) => {
  updatePlayersList(players);
});

socket.on('joinSuccess', (id) => {
  playerId = id;
  showScreen(lobbyScreen);
});

socket.on('leaderboardUpdate', (leaderboard) => {
  updateLeaderboard(leaderboard);
});

socket.on('pongPlayersUpdate', (players) => {
  // Update UI to show who's playing
  if (players.left && players.right) {
    hideElement(waitingOverlay);
  }
});

socket.on('pongGameStart', () => {
  hideElement(pongSelectSide);
  hideElement(waitingOverlay);
  gameActive = true;
  startPongGame();
});

socket.on('opponentPaddleMove', (data) => {
  const oppositeSide = currentSide === 'left' ? 'right' : 'left';
  if (data.side === oppositeSide) {
    opponentPaddleY = data.position;
  }
});

socket.on('ballPosition', (data) => {
  ballX = data.x;
  ballY = data.y;
});

socket.on('scoreUpdate', (data) => {
  leftScore.textContent = data.left;
  rightScore.textContent = data.right;
  scoreSound.play && scoreSound.play();
});

socket.on('gameEnd', (data) => {
  gameActive = false;
  winnerMessage.textContent = `${data.winner} wins!`;
  showElement(gameEndOverlay);
  updateLeaderboard(data.leaderboard);
});

socket.on('playerLeftGame', (data) => {
  if (gameActive) {
    gameActive = false;
    winnerMessage.textContent = `Opponent left the game!`;
    showElement(gameEndOverlay);
  }
});

// Game functions
function joinGame() {
  playerName = playerNameInput.value.trim();
  if (playerName) {
    socket.emit('playerJoin', playerName);
  }
}

function joinPongGame(side) {
  currentSide = side;
  hideElement(pongSelectSide);
  showElement(waitingOverlay);
  socket.emit('joinPong', side);
}

function startPongGame() {
  // Set up game loop
  if (pongGame) cancelAnimationFrame(pongGame);
  pongGame = requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (!gameActive) return;
  
  // Move paddle based on keyboard input
  if (keys['ArrowUp'] && paddleY > 0) paddleY -= PADDLE_SPEED;
  if (keys['ArrowDown'] && paddleY < GAME_HEIGHT - PADDLE_HEIGHT) paddleY += PADDLE_SPEED;
  
  // Send paddle position to server
  socket.emit('paddleMove', paddleY);
  
  // Draw game
  drawPongGame();
  
  // Continue game loop
  pongGame = requestAnimationFrame(gameLoop);
}

function drawPongGame() {
  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  
  // Draw center line
  ctx.strokeStyle = '#FFFFFF';
  ctx.setLineDash([10, 15]);
  ctx.beginPath();
  ctx.moveTo(GAME_WIDTH / 2, 0);
  ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw paddles
  ctx.fillStyle = '#FFFFFF';
  
  // Left paddle
  const leftPaddleY = currentSide === 'left' ? paddleY : opponentPaddleY;
  ctx.fillRect(PADDLE_OFFSET, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
  
  // Right paddle
  const rightPaddleY = currentSide === 'right' ? paddleY : opponentPaddleY;
  ctx.fillRect(GAME_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Draw ball with position from server
  ctx.fillStyle = '#0aefff';
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  
  // Add glow effect to ball
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#0aefff';
  ctx.beginPath();
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function handleTouchMove(e) {
  if (!gameActive) return;
  
  e.preventDefault();
  const rect = pongCanvas.getBoundingClientRect();
  const scale = GAME_HEIGHT / rect.height;
  const touch = e.touches[0];
  const y = (touch.clientY - rect.top) * scale - PADDLE_HEIGHT / 2;
  
  if (y >= 0 && y <= GAME_HEIGHT - PADDLE_HEIGHT) {
    paddleY = y;
    socket.emit('paddleMove', paddleY);
  }
}

function returnToLobby() {
  gameActive = false;
  if (pongGame) cancelAnimationFrame(pongGame);
  currentSide = null;
  showScreen(lobbyScreen);
}

// UI helper functions
function showScreen(screen) {
  // Hide all screens
  loginScreen.classList.remove('active');
  lobbyScreen.classList.remove('active');
  pongScreen.classList.remove('active');
  
  // Show the target screen
  screen.classList.add('active');
}

function showElement(element) {
  element.style.display = 'flex';
}

function hideElement(element) {
  element.style.display = 'none';
}

function updatePlayersList(players) {
  playersList.innerHTML = '';
  players.forEach(player => {
    const li = document.createElement('li');
    li.textContent = player.name;
    if (player.id === playerId) {
      li.textContent += ' (You)';
      li.classList.add('current-player');
    }
    playersList.appendChild(li);
  });
}

function updateLeaderboard(leaderboard) {
  leaderboardBody.innerHTML = '';
  leaderboard.forEach((player, index) => {
    const tr = document.createElement('tr');
    
    const rankTd = document.createElement('td');
    rankTd.textContent = index + 1;
    
    const nameTd = document.createElement('td');
    nameTd.textContent = player.name;
    
    const scoreTd = document.createElement('td');
    scoreTd.textContent = player.score;
    
    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);
    
    leaderboardBody.appendChild(tr);
  });
} 