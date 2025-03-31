const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const grid = 48;
const gridGap = 10;

// Load the images
const filerImage = new Image();
filerImage.src = 'images/filer.png';
const filerCsvImage = new Image();
filerCsvImage.src = 'images/filer-csv.png';
const filerJsonImage = new Image();
filerJsonImage.src = 'images/filer-json.png';
const filerPdfImage = new Image();
filerPdfImage.src = 'images/filer-pdf.png';
const filerXmlImage = new Image();
filerXmlImage.src = 'images/filer-xml.png';

// Array of filer images to use in sequence
const filerImages = [filerImage, filerCsvImage, filerJsonImage, filerPdfImage, filerXmlImage];

const serverImage = new Image();
serverImage.src = 'images/server.png';
const wifiImage = new Image();
wifiImage.src = 'images/wifi.png';
const hackerImage = new Image();
hackerImage.src = 'images/hacker.png';
const networkIssueImage = new Image();
networkIssueImage.src = 'images/network-issue.png';
const badWifiImage = new Image();
badWifiImage.src = 'images/bad-wifi.png';
const badPacketImage = new Image();
badPacketImage.src = 'images/bad-packet.png';
const boxImage = new Image();
boxImage.src = 'images/box.png';
const awsImage = new Image();
awsImage.src = 'images/aws.png';
const azureImage = new Image();
azureImage.src = 'images/azure.png';
const dropboxImage = new Image();
dropboxImage.src = 'images/dropbox.png';
const googleCloudImage = new Image();
googleCloudImage.src = 'images/google-cloud.png';
const fiberCableImage = new Image();
fiberCableImage.src = 'images/fiber-cable.png';
const multiThreadImage = new Image();
multiThreadImage.src = 'images/multi-thread.png';
const automationImage = new Image();
automationImage.src = 'images/automation.png';
const storageCapacityImage = new Image();
storageCapacityImage.src = 'images/storage-capacity.png';

// a simple sprite prototype function
function Sprite(props) {
  // shortcut for assigning all object properties to the sprite
  Object.assign(this, props);
}
Sprite.prototype.render = function() {
  context.fillStyle = this.color;

  // draw an image sprite
  if (this.image) {
    // If imageHeight is specified, use it, otherwise use this.size for height
    const height = this.imageHeight || this.size;
    context.drawImage(this.image, this.x, this.y, this.size, height);
  }
  // draw a rectangle sprite
  else if (this.shape === 'rect') {
    // by using a size less than the grid we can ensure there is a visual space
    // between each row
    context.fillRect(this.x, this.y + gridGap / 2, this.size, grid - gridGap);
  }
  // draw a circle sprite
  else {
    context.beginPath();
    context.arc(
      this.x + this.size / 2, this.y + this.size / 2,
      this.size / 2 - gridGap / 2, 0, 2 * Math.PI
    );
    context.fill();
  }
}

const frogger = new Sprite({
  x: grid * 6,
  y: grid * 13,
  color: 'greenyellow',
  size: grid,
  image: filerImage
});
const scoredFroggers = [];

// a pattern describes each obstacle in the row
const patterns = [
  // end bank is safe
  null,

  // fiber cable (formerly log)
  {
    spacing: [2],      // how many grid spaces between each obstacle
    color: '#FFFFFF',  // color of the obstacle
    size: grid * 4,    // width of the obstacle
    shape: 'rect',     // shape of the obstacle (rect or circle)
    speed: 0.75,       // how fast the obstacle moves and which direction
    image: multiThreadImage,
    imageHeight: grid  // height of the image
  },

  // turtle (now wifi)
  {
    spacing: [0,0,1],
    color: '#C11F32',
    size: grid,
    shape: 'circle',
    speed: -1,
    image: wifiImage
  },

  // long fiber cable
  {
    spacing: [2],
    color: '#FFFFFF',
    size: grid * 7,
    shape: 'rect',
    speed: 1.5,
    image: fiberCableImage,
    imageHeight: grid
  },

  // multi-thread (formerly log)
  {
    spacing: [3],
    color: '#FFFFFF',
    size: grid * 3,
    shape: 'rect',
    speed: 0.5,
    image: multiThreadImage,
    imageHeight: grid
  },

  // turtle (now wifi)
  {
    spacing: [0,0,1],
    color: '#C11F32',
    size: grid,
    shape: 'circle',
    speed: -1,
    image: automationImage
  },

  // beach is safe
  null,

  // truck (now bad packet)
  {
    spacing: [3,8],
    color: '#A18D8C',
    size: grid * 1,
    shape: 'rect',
    speed: -1,
    image: badPacketImage
  },

  // network issue (formerly fast car)
  {
    spacing: [14],
    color: '#FFFFFF',
    size: grid,
    shape: 'rect',
    speed: 0.75,
    image: networkIssueImage
  },

  // wifi
  {
    spacing: [3,3,7],
    color: '#F76E70',
    size: grid,
    shape: 'rect',
    speed: -0.75,
    image: hackerImage
  },

  // storage capacity (formerly bulldozer)
  {
    spacing: [3,3,7],
    color: '#FF0000',
    size: grid,
    shape: 'rect',
    speed: 0.5,
    image: storageCapacityImage
  },

  // bad wifi (formerly car)
  {
    spacing: [4],
    color: '#FFFFFF',
    size: grid,
    shape: 'rect',
    speed: -0.5,
    image: badWifiImage
  },

  // start zone is safe
  null
];

// rows holds all the sprites for that row
const rows = [];
for (let i = 0; i < patterns.length; i++) {
  rows[i] = [];

  let x = 0;
  let index = 0;
  const pattern = patterns[i];

  // skip empty patterns (safe zones)
  if (!pattern) {
    continue;
  }

  // allow there to be 1 extra pattern offscreen so the loop is seamless
  // (especially for the long log)
  let totalPatternWidth =
    pattern.spacing.reduce((acc, space) => acc + space, 0) * grid +
    pattern.spacing.length * pattern.size;
  let endX = 0;
  while (endX < canvas.width) {
    endX += totalPatternWidth;
  }
  endX += totalPatternWidth;

  // populate the row with sprites
  while (x < endX) {
    rows[i].push(new Sprite({
      x,
      y: grid * (i + 1),
      index,
      patternIndex: i,  // Store the pattern index with each sprite
      ...pattern
    }));

    // move the next sprite over according to the spacing
    const spacing = pattern.spacing;
    x += pattern.size + spacing[index] * grid;
    index = (index + 1) % spacing.length;
  }
}

// Add at the top with other constants
const winScreen = document.getElementById('winScreen');
const leaderboard = document.getElementById('leaderboard');
const highScoreForm = document.getElementById('highScoreForm');
const normalModeButton = document.getElementById('normalMode');
const hardModeButton = document.getElementById('hardMode');
const settingsButton = document.getElementById('settingsButton');
const downloadCsvButton = document.getElementById('downloadCsv');
const clearLeaderboardButton = document.getElementById('clearLeaderboard');
let gameWon = false;
let score = 0;
let startTime = Date.now();
let collisions = 0;
let safePathBonus = 0;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let isHardMode = false;
let speedMultiplier = 1;
let selectedMode = 'normal'; // Track which mode is currently selected
let finalScore = 0; // Store the final score when game is won

// Store original speeds for resetting
const originalSpeeds = patterns.map(pattern => pattern ? pattern.speed : null);

// Add gamepad support variables at the top with other constants
let gamepadConnected = false;
let gamepadIndex = null;

// Add button state tracking with previous and current states
let buttonStates = {
  left: { current: false, previous: false },
  right: { current: false, previous: false },
  up: { current: false, previous: false },
  down: { current: false, previous: false }
};

// Add rumble effect function
async function triggerRumble() {
  if (!gamepadConnected || gamepadIndex === null) return;
  
  const gamepad = navigator.getGamepads()[gamepadIndex];
  if (!gamepad || !gamepad.vibrationActuator) return;

  try {
    // Rumble with high intensity for 100ms
    await gamepad.vibrationActuator.playEffect('dual-rumble', {
      startDelay: 0,
      duration: 100,
      weakMagnitude: 1.0,
      strongMagnitude: 1.0
    });
  } catch (error) {
    console.log('Rumble not supported on this gamepad');
  }
}

// Function to update mode selection UI
function updateModeSelection() {
  if (selectedMode === 'normal') {
    normalModeButton.classList.add('ring-4', 'ring-green-500', 'scale-110', 'transition-transform', 'duration-200');
    hardModeButton.classList.remove('ring-4', 'ring-red-500', 'scale-110', 'transition-transform', 'duration-200');
  } else {
    normalModeButton.classList.remove('ring-4', 'ring-green-500', 'scale-110', 'transition-transform', 'duration-200');
    hardModeButton.classList.add('ring-4', 'ring-red-500', 'scale-110', 'transition-transform', 'duration-200');
  }
}

// Function to handle mode selection keyboard events
function handleModeSelection(e) {
  // Handle both keyboard and gamepad input
  const input = e.type === 'keydown' ? e.which : e;
  
  switch(input) {
    case 38: // Up arrow
    case 12: // D-pad Up
      selectedMode = 'normal';
      updateModeSelection();
      e.preventDefault(); // Prevent default behavior
      break;
    case 40: // Down arrow
    case 14: // D-pad Down
      selectedMode = 'hard';
      updateModeSelection();
      e.preventDefault(); // Prevent default behavior
      break;
    case 13: // Enter/Return
    case 9:  // Start button
      startGame(selectedMode);
      e.preventDefault(); // Prevent default behavior
      break;
  }
}

// Add click handlers for mode buttons
normalModeButton.addEventListener('click', () => {
  selectedMode = 'normal';
  startGame('normal');
});

hardModeButton.addEventListener('click', () => {
  selectedMode = 'hard';
  startGame('hard');
});

// Add keyboard event listener for mode selection
document.addEventListener('keydown', handleModeSelection);

// Function to update the leaderboard display
function updateLeaderboard() {
  // Sort scores in descending order
  highScores.sort((a, b) => b.score - a.score);
  
  // Take only top 10 scores
  const topScores = highScores.slice(0, 10);
  
  // Update the leaderboard display
  leaderboard.innerHTML = topScores.map((entry, index) => `
    <div class="flex items-center justify-between p-2 ${index === 0 ? 'bg-green-900/30' : 'bg-gray-800/30'} rounded">
      <div class="flex items-center space-x-2">
        <span class="text-gray-400 w-6">${index + 1}</span>
        <span class="text-white">${entry.displayName}</span>
      </div>
      <div class="text-right">
        <div class="text-green-400">${entry.score}</div>
        <div class="text-xs text-gray-400">${entry.company}</div>
      </div>
    </div>
  `).join('');
}

// Function to handle form submission
function handleFormSubmit(e) {
  e.preventDefault();
  
  const formData = {
    displayName: document.getElementById('displayName').value,
    email: document.getElementById('email').value,
    company: document.getElementById('company').value,
    score: finalScore,  // Use the stored final score
    mode: isHardMode ? 'Hard' : 'Normal',
    date: new Date().toISOString()
  };
  
  // Add new score to high scores
  highScores.push(formData);
  
  // Save to localStorage
  localStorage.setItem('highScores', JSON.stringify(highScores));
  
  // Update leaderboard
  updateLeaderboard();
  
  // Hide the win screen
  winScreen.classList.add('hidden');
  
  // Show mode selection buttons
  document.getElementById('modeSelection').classList.remove('hidden');
  
  // Reset selection to normal mode
  selectedMode = 'normal';
  updateModeSelection();
}

// Add form submit handler
highScoreForm.addEventListener('submit', handleFormSubmit);

// Function to update pattern speeds based on mode
function updatePatternSpeeds() {
  // First reset all speeds to original values
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i]) {
      patterns[i].speed = originalSpeeds[i];
    }
  }
  
  // Then apply the speed multiplier
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i]) {
      patterns[i].speed = patterns[i].speed * speedMultiplier;
    }
  }
  
  // Update all existing sprites with new speeds
  for (let r = 0; r < rows.length; r++) {
    if (rows[r]) {
      for (let sprite of rows[r]) {
        // Use the stored pattern index to get the correct speed
        sprite.speed = patterns[sprite.patternIndex].speed;
      }
    }
  }
}

// Function to start the game with selected mode
function startGame(mode) {
  isHardMode = mode === 'hard';
  speedMultiplier = isHardMode ? 2 : 1;
  
  // Hide mode selection buttons
  document.getElementById('modeSelection').classList.add('hidden');
  
  // Remove pulse animation from buttons
  normalModeButton.classList.remove('animate-pulse-slow');
  hardModeButton.classList.remove('animate-pulse-slow');
  
  // Show and animate START text
  const startText = document.getElementById('startText');
  startText.classList.remove('hidden');
  startText.classList.remove('opacity-0');
  
  // Reset game state
  scoredFroggers.length = 0;
  gameWon = false;
  score = 0;
  collisions = 0;
  safePathBonus = 0;
  startTime = Date.now();
  
  // Reset destination indicators
  for (let i = 1; i <= 5; i++) {
    const destElement = document.getElementById(`dest${i}`);
    if (destElement) {
      destElement.classList.remove('bg-green-500');
      destElement.classList.add('bg-gray-700');
      destElement.textContent = '0';
    }
  }
  
  // Reset frogger position and image
  frogger.x = grid * 6;
  frogger.y = grid * 13;
  frogger.speed = 0;
  frogger.image = filerImage;  // Reset to original filer image
  
  // Update patterns with new speeds
  updatePatternSpeeds();
  
  // Update the leaderboard display
  updateLeaderboard();
  
  // Hide START text after 1 second
  setTimeout(() => {
    startText.classList.add('hidden');
  }, 1000);
}

// Function to check if the game has been won
function checkWinCondition() {
  // Check if we have exactly 5 scored froggers (one for each destination)
  if (scoredFroggers.length === 5) {
    gameWon = true;
    
    // Calculate final score details
    const timeBonus = Math.max(0, 1000 - (Date.now() - startTime) / 1000);
    finalScore = Math.round(score + timeBonus);
    
    // Update score details in win screen
    const scoreDetails = document.querySelector('.score-details');
    scoreDetails.innerHTML = `
      <p class="text-xl text-green-400">Final Score: ${finalScore}</p>
    `;
    
    // Show win screen
    winScreen.classList.remove('hidden');
    
    // Focus on the display name input field
    document.getElementById('displayName').focus();
    
    // Trigger a big confetti celebration
    confetti({
      particleCount: 300,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      colors: [
        '#FF0000',
        '#0000FF',
        '#FFFF00',
        '#00FF00',
        '#FFA500',
        '#800080'
      ],
      startVelocity: 30,
      gravity: 0.5,
      ticks: 500,
      shapes: ['square'],
      scalar: 1.5,
      zIndex: 100
    });
  }
}

// Function to download scores as CSV
function downloadScoresAsCsv() {
  // Create CSV header
  let csvContent = "Display Name,Email,Company,Score,Mode,Date\n";
  
  // Add each score as a row
  highScores.forEach(score => {
    csvContent += `${score.displayName},${score.email},${score.company},${score.score},${score.mode},${score.date}\n`;
  });
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `filer-scores-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to clear leaderboard
function clearLeaderboard() {
  if (confirm('Are you sure you want to clear the leaderboard? This action cannot be undone.')) {
    // Default entries from popular fictional media
    highScores = [
      {
        displayName: "Mark Scout",
        email: "mark.scout@lumon.com",
        company: "Lumon Industries",
        score: 700,
        mode: "Hard",
        date: "2024-03-15T10:30:00.000Z"
      },
      {
        displayName: "Tony Stark",
        email: "tony.stark@starkindustries.com",
        company: "Stark Industries",
        score: 600,
        mode: "Hard",
        date: "2024-03-14T15:45:00.000Z"
      },
      {
        displayName: "Richard Hendricks",
        email: "richard@piedpiper.com",
        company: "Pied Piper",
        score: 500,
        mode: "Normal",
        date: "2024-03-13T09:15:00.000Z"
      },
      {
        displayName: "Billy Butcher",
        email: "billy.butcher@cia.gov",
        company: "The Boys",
        score: 400,
        mode: "Hard",
        date: "2024-03-12T14:20:00.000Z"
      },
      {
        displayName: "Homer Simpson",
        email: "homer.simpson@springfieldnuclear.com",
        company: "Springfield Nuclear",
        score: 300,
        mode: "Normal",
        date: "2024-03-11T11:10:00.000Z"
      }
    ];
    
    localStorage.setItem('highScores', JSON.stringify(highScores));
    updateLeaderboard();
  }
}

// Add event listeners for settings buttons
downloadCsvButton.addEventListener('click', downloadScoresAsCsv);
clearLeaderboardButton.addEventListener('click', clearLeaderboard);

// Add settings dropdown toggle functionality
const settingsDropdown = document.getElementById('settingsDropdown');

settingsButton.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsDropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!settingsButton.contains(e.target) && !settingsDropdown.contains(e.target)) {
    settingsDropdown.classList.add('hidden');
  }
});

// Function to handle gamepad connection/disconnection
function handleGamepadConnection(e) {
  if (e.type === 'gamepadconnected') {
    gamepadConnected = true;
    gamepadIndex = e.gamepad.index;
    console.log('Gamepad connected:', e.gamepad.id);
  } else if (e.type === 'gamepaddisconnected') {
    gamepadConnected = false;
    gamepadIndex = null;
    console.log('Gamepad disconnected');
  }
}

// Add gamepad connection event listeners
window.addEventListener('gamepadconnected', handleGamepadConnection);
window.addEventListener('gamepaddisconnected', handleGamepadConnection);

// Function to handle gamepad input
function handleGamepadInput() {
  if (!gamepadConnected || gamepadIndex === null) return;

  const gamepad = navigator.getGamepads()[gamepadIndex];
  if (!gamepad) return;

  // Update button states
  buttonStates.left.previous = buttonStates.left.current;
  buttonStates.right.previous = buttonStates.right.current;
  buttonStates.up.previous = buttonStates.up.current;
  buttonStates.down.previous = buttonStates.down.current;

  buttonStates.left.current = gamepad.buttons[14].pressed;
  buttonStates.right.current = gamepad.buttons[15].pressed;
  buttonStates.up.current = gamepad.buttons[12].pressed;
  buttonStates.down.current = gamepad.buttons[13].pressed;

  // Check if mode selection modal is visible
  const modeSelection = document.getElementById('modeSelection');
  if (!modeSelection.classList.contains('hidden')) {
    // Handle D-pad buttons for mode selection
    if (buttonStates.up.current && !buttonStates.up.previous) {
      selectedMode = 'normal';
      updateModeSelection();
    }
    if (buttonStates.down.current && !buttonStates.down.previous) {
      selectedMode = 'hard';
      updateModeSelection();
    }

    // Handle Start button to start game
    if (gamepad.buttons[9].pressed) { // Start button
      startGame(selectedMode);
    }
    return; // Skip game controls while in mode selection
  }

  // Handle D-pad buttons for game controls with improved debouncing
  if (buttonStates.left.current && !buttonStates.left.previous) { // Left
    frogger.x -= grid;
  }
  if (buttonStates.right.current && !buttonStates.right.previous) { // Right
    frogger.x += grid;
  }
  if (buttonStates.up.current && !buttonStates.up.previous) { // Up
    frogger.y -= grid;
  }
  if (buttonStates.down.current && !buttonStates.down.previous) { // Down
    frogger.y += grid;
  }

  // Handle Select button for restart
  if (gamepad.buttons[8].pressed) { // Select button
    // Hide win screen if it's showing
    winScreen.classList.add('hidden');
    // Show mode selection buttons
    document.getElementById('modeSelection').classList.remove('hidden');
    // Reset selection to normal mode
    selectedMode = 'normal';
    updateModeSelection();
  }
}

// Modify the game loop to include gamepad input
function loop() {
  requestAnimationFrame(loop);
  
  // Handle gamepad input
  handleGamepadInput();
  
  context.clearRect(0,0,canvas.width,canvas.height);

  // draw the game background
  // water
  context.fillStyle = '#020817';
  context.fillRect(0, grid, canvas.width, grid * 6);

  // road
  context.fillStyle = '#374151';  // A nice dark gray color
  context.fillRect(0, grid * 8, canvas.width, grid * 5);

  // end bank
  context.fillStyle = '#059669';  // Matching green from our theme
  context.fillRect(0, grid, canvas.width, 5);
  context.fillRect(0, grid, 5, grid);
  context.fillRect(canvas.width - 5, grid, 5, grid);

  // Draw cloud provider destinations with branded zones
  const cloudImages = [awsImage, azureImage, dropboxImage, googleCloudImage, boxImage];
  const cloudZoneColors = [
    ['#1F2937', '#374151'], // Dark gray gradient for slots
    ['#1F2937', '#374151'], // Dark gray gradient for slots
    ['#1F2937', '#374151'], // Dark gray gradient for slots
    ['#1F2937', '#374151'], // Dark gray gradient for slots
    ['#1F2937', '#374151']  // Dark gray gradient for slots
  ];

  // Draw end zone background first (green)
  context.fillStyle = '#059669';  // Matching green from our theme
  context.fillRect(0, grid, canvas.width, grid);

  // Draw Box logo in the leftmost green space
  context.drawImage(
    boxImage,
    grid - 48,  // Move slightly more to the left
    grid,
    grid,
    grid
  );

  for (let i = 0; i < 5; i++) {
    // Create gradient for each zone
    const zoneGradient = context.createLinearGradient(
      grid + grid * 3 * i, 
      grid, 
      grid + grid * 3 * i + grid * 2, 
      grid * 2
    );
    zoneGradient.addColorStop(0, cloudZoneColors[i][0]);
    zoneGradient.addColorStop(1, cloudZoneColors[i][1]);
    
    // Draw gray zone background
    context.fillStyle = zoneGradient;
    context.fillRect(grid + grid * 3 * i, grid, grid * 2, grid);
    
    // Add oblique cross-hatch pattern only to gray zones
    context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    context.lineWidth = 1;
    context.save();  // Save the current context state
    
    // Create clipping region for the gray zone
    context.beginPath();
    context.rect(grid + grid * 3 * i, grid, grid * 2, grid);
    context.clip();
    
    // Diagonal lines (top-left to bottom-right)
    for (let j = -grid; j < grid * 3; j += 10) {
      context.beginPath();
      context.moveTo(grid + grid * 3 * i + j, grid);
      context.lineTo(grid + grid * 3 * i + j + grid, grid * 2);
      context.stroke();
    }
    
    // Diagonal lines (top-right to bottom-left)
    for (let j = -grid; j < grid * 3; j += 10) {
      context.beginPath();
      context.moveTo(grid + grid * 3 * i + j, grid);
      context.lineTo(grid + grid * 3 * i + j - grid, grid * 2);
      context.stroke();
    }
    
    context.restore();  // Restore the context state to remove clipping

    // Draw cloud provider logo to the right of each zone
    context.drawImage(
      cloudImages[i],
      grid + grid * 3 * i + grid * 2, // Center over the green area between zones
      grid,                           // At the top of the zone
      grid,                          // Full grid size
      grid
    );
  }

  // Safe zone (formerly beach) - Create a secure network pattern
  const safeZoneGradient = context.createLinearGradient(0, 7 * grid, canvas.width, 7 * grid + grid);
  safeZoneGradient.addColorStop(0, '#1E40AF');  // Darker blue
  safeZoneGradient.addColorStop(1, '#3B82F6');  // Lighter blue
  context.fillStyle = safeZoneGradient;
  context.fillRect(0, 7 * grid, canvas.width, grid);
  
  // Add network pattern to safe zone
  context.strokeStyle = '#60A5FA';
  context.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 20) {
    context.beginPath();
    context.moveTo(i, 7 * grid);
    context.lineTo(i + 10, 7 * grid + grid);
    context.stroke();
  }

  // Add text to safe zone
  context.font = 'bold 20px sans-serif';
  context.fillStyle = '#93C5FD';  // Light blue color
  context.textAlign = 'center';
  context.fillText('RIDE FILES.COM FEATURES TO YOUR DESTINATION', canvas.width / 2, 7 * grid + grid/2 + 8);

  // Start zone - Create a secure starting area pattern
  const startZoneGradient = context.createLinearGradient(0, canvas.height - grid * 2, canvas.width, canvas.height - grid);
  startZoneGradient.addColorStop(0, '#059669');  // Darker green
  startZoneGradient.addColorStop(1, '#10B981');  // Lighter green
  context.fillStyle = startZoneGradient;
  context.fillRect(0, canvas.height - grid * 2, canvas.width, grid);

  // Add text to start zone
  context.font = 'bold 20px sans-serif';
  context.fillStyle = '#34D399';
  context.textAlign = 'center';
  context.fillText('YOUR ON-PREMISE NETWORK', canvas.width / 2, canvas.height - grid - 10);

  // Add servers to the corners of the start zone
  context.drawImage(serverImage, 0, canvas.height - grid * 2, grid, grid); // Left server
  context.drawImage(serverImage, canvas.width - grid, canvas.height - grid * 2, grid, grid); // Right server

  // update and draw obstacles
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    for (let i = 0; i < row.length; i++) {
      const sprite = row[i]
      sprite.x += sprite.speed;
      sprite.render();

      // loop sprite around the screen
      // sprite is moving to the left and goes offscreen
      if (sprite.speed < 0 && sprite.x < 0 - sprite.size) {

        // find the rightmost sprite
        let rightMostSprite = sprite;
        for (let j = 0; j < row.length; j++) {
          if (row[j].x > rightMostSprite.x) {
            rightMostSprite = row[j];
          }
        }

        // move the sprite to the next spot in the pattern so it continues
        const spacing = patterns[r].spacing;
        sprite.x =
          rightMostSprite.x + rightMostSprite.size +
          spacing[rightMostSprite.index] * grid;
        sprite.index = (rightMostSprite.index + 1) % spacing.length;
      }

      // sprite is moving to the right and goes offscreen
      if (sprite.speed > 0 && sprite.x > canvas.width) {

        // find the leftmost sprite
        let leftMostSprite = sprite;
        for (let j = 0; j < row.length; j++) {
          if (row[j].x < leftMostSprite.x) {
            leftMostSprite = row[j];
          }
        }

        // move the sprite to the next spot in the pattern so it continues
        const spacing = patterns[r].spacing;
        let index = leftMostSprite.index - 1;
        index = index >= 0 ? index : spacing.length - 1;
        sprite.x = leftMostSprite.x - spacing[index] * grid - sprite.size;
        sprite.index = index;
      }
    }
  }

  // draw frogger
  frogger.x += frogger.speed || 0;
  frogger.render();

  // draw scored froggers
  scoredFroggers.forEach(frog => frog.render());

  // check for collision with all sprites in the same row as frogger
  const froggerRow = frogger.y / grid - 1 | 0;
  let collision = false;
  for (let i = 0; i < rows[froggerRow].length; i++) {
    let sprite = rows[froggerRow][i];

    // axis-aligned bounding box (AABB) collision check
    // treat any circles as rectangles for the purposes of collision
    if (frogger.x < sprite.x + sprite.size - gridGap &&
        frogger.x + grid - gridGap > sprite.x &&
        frogger.y < sprite.y + grid &&
        frogger.y + grid > sprite.y) {
      collision = true;

      // reset frogger if got hit by car
      if (froggerRow > rows.length / 2) {
        frogger.x = grid * 6;
        frogger.y = grid * 13;
      }
      // move frogger along with obstacle
      else {
        frogger.speed = sprite.speed;
      }
    }
  }

  if (collision) {
    collisions++;
    score = Math.max(0, score - 50); // Penalty for collision
    
    // reset frogger if got hit by car
    if (froggerRow > rows.length / 2) {
      frogger.x = grid * 6;
      frogger.y = grid * 13;
      // Trigger rumble effect only when player resets to beginning
      triggerRumble();
    }
    // move frogger along with obstacle
    else {
      frogger.speed = sprite.speed;
    }
  }

  if (!collision) {
    // if fogger isn't colliding reset speed
    frogger.speed = 0;

    // frogger got to end bank (goal every 3 cols)
    const col = (frogger.x + grid / 2) / grid | 0;
    if (froggerRow === 0 && col % 3 === 0 &&
        // check to see if there isn't a scored frog already there
        !scoredFroggers.find(frog => frog.x === col * grid)) {
      
      // Base points for reaching a cloud provider
      score += 100;
      
      // Bonus for using safe paths
      if (froggerRow === 1 || froggerRow === 3 || froggerRow === 4 || froggerRow === 5) {
        safePathBonus += 25;
        score += 25;
      }

      // Create a celebratory confetti burst with primary and secondary colors
      confetti({
        particleCount: 150,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: [
          '#FF0000',
          '#0000FF',
          '#FFFF00',
          '#00FF00',
          '#FFA500',
          '#800080'
        ],
        startVelocity: 25,
        gravity: 0.5,
        ticks: 300,
        shapes: ['square'],
        scalar: 1,
        zIndex: 100
      });

      // Add the scored frogger with the current filer image
      scoredFroggers.push(new Sprite({
        ...frogger,
        x: col * grid,
        y: frogger.y + 5,
        image: frogger.image  // Use the current filer image instead of the original
      }));

      // Update the destination indicator
      const destIndex = scoredFroggers.length - 1;
      const destElement = document.getElementById(`dest${destIndex + 1}`);
      if (destElement) {
        destElement.classList.remove('bg-gray-700');
        destElement.classList.add('bg-green-500');
        destElement.textContent = '✓';
      }

      // Update the active filer's image to the next one in sequence
      const nextFilerIndex = (scoredFroggers.length) % filerImages.length;
      frogger.image = filerImages[nextFilerIndex];

      // Check for win condition after adding a new scored frogger
      checkWinCondition();
    }

    // reset frogger if not on obstacle in river
    if (froggerRow < rows.length / 2 - 1) {
      frogger.x = grid * 6;
      frogger.y = grid * 13;
      // Trigger rumble effect when falling off a safe riding element
      triggerRumble();
    }
  }
}

// listen to keyboard events to move frogger
document.addEventListener('keydown', function(e) {
  // Restart game with 'R' key only if win screen is hidden
  if (e.which === 82 && winScreen.classList.contains('hidden')) { // 82 is the key code for 'R'
    // Hide win screen if it's showing
    winScreen.classList.add('hidden');
    // Show mode selection buttons
    document.getElementById('modeSelection').classList.remove('hidden');
    // Reset selection to normal mode
    selectedMode = 'normal';
    updateModeSelection();
    return;
  }

  // Only handle game controls if the win screen is hidden and mode selection is hidden
  if (!winScreen.classList.contains('hidden') || !document.getElementById('modeSelection').classList.contains('hidden')) {
    return;
  }

  // left arrow key
  if (e.which === 37) {
    frogger.x -= grid;
  }
  // right arrow key
  else if (e.which === 39) {
    frogger.x += grid;
  }
  // up arrow key
  else if (e.which === 38) {
    frogger.y -= grid;
  }
  // down arrow key
  else if (e.which === 40) {
    frogger.y += grid;
  }

  // clamp frogger position to stay on screen
  frogger.x = Math.min(Math.max(0, frogger.x), canvas.width - grid);
  frogger.y = Math.min(Math.max(grid, frogger.y), canvas.height - grid * 2);
});

// start the game
requestAnimationFrame(loop); 