const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const grid = 48;
const gridGap = 10;

// Load the images
const filerImage = new Image();
filerImage.src = 'images/filer.png';
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
const playAgainButton = document.getElementById('playAgain');
const playAgainContainer = document.getElementById('playAgainContainer');
const leaderboard = document.getElementById('leaderboard');
const highScoreForm = document.getElementById('highScoreForm');
const modeScreen = document.getElementById('modeScreen');
const normalModeButton = document.getElementById('normalMode');
const hardModeButton = document.getElementById('hardMode');
let gameWon = false;
let score = 0;
let startTime = Date.now();
let collisions = 0;
let safePathBonus = 0;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let isHardMode = false;
let speedMultiplier = 1;
let selectedMode = 'normal'; // Track which mode is currently selected

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
  if (modeScreen.classList.contains('hidden')) return;

  switch(e.which) {
    case 38: // Up arrow
      selectedMode = 'normal';
      updateModeSelection();
      break;
    case 40: // Down arrow
      selectedMode = 'hard';
      updateModeSelection();
      break;
    case 13: // Enter
      startGame(selectedMode);
      break;
  }
}

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
    score: score,
    mode: isHardMode ? 'Hard' : 'Normal',
    date: new Date().toISOString()
  };
  
  // Add new score to high scores
  highScores.push(formData);
  
  // Save to localStorage
  localStorage.setItem('highScores', JSON.stringify(highScores));
  
  // Update leaderboard
  updateLeaderboard();
  
  // Hide the form and show play again button
  highScoreForm.style.display = 'none';
  playAgainContainer.classList.remove('hidden');
}

// Add form submit handler
highScoreForm.addEventListener('submit', handleFormSubmit);

// Function to start the game with selected mode
function startGame(mode) {
  isHardMode = mode === 'hard';
  speedMultiplier = isHardMode ? 2 : 1;
  
  // Hide mode selection screen
  modeScreen.classList.add('hidden');
  
  // Reset game state
  scoredFroggers.length = 0;
  gameWon = false;
  score = 0;
  collisions = 0;
  safePathBonus = 0;
  startTime = Date.now();
  
  // Reset frogger position
  frogger.x = grid * 6;
  frogger.y = grid * 13;
  frogger.speed = 0;
  
  // Update patterns with new speeds
  updatePatternSpeeds();
}

// Function to update pattern speeds based on mode
function updatePatternSpeeds() {
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i]) {
      patterns[i].speed = patterns[i].speed * speedMultiplier;
    }
  }
  
  // Update all existing sprites with new speeds
  for (let r = 0; r < rows.length; r++) {
    if (rows[r]) {
      for (let sprite of rows[r]) {
        sprite.speed = sprite.speed * speedMultiplier;
      }
    }
  }
}

// Modify the play again functionality to reset the form
playAgainButton.addEventListener('click', () => {
  // Reset game state
  scoredFroggers.length = 0;
  gameWon = false;
  winScreen.classList.add('hidden');
  
  // Reset score
  score = 0;
  collisions = 0;
  safePathBonus = 0;
  startTime = Date.now();
  
  // Reset form and show play again button
  highScoreForm.reset();
  highScoreForm.style.display = 'block';
  playAgainContainer.classList.add('hidden');
  
  // Show mode selection screen and reset selection
  modeScreen.classList.remove('hidden');
  selectedMode = 'normal';
  updateModeSelection();
  
  // Reset frogger position
  frogger.x = grid * 6;
  frogger.y = grid * 13;
  frogger.speed = 0;
});

// Function to restart the game
function restartGame() {
  // Reset game state
  scoredFroggers.length = 0;
  gameWon = false;
  winScreen.classList.add('hidden');
  
  // Reset score and stats
  score = 0;
  collisions = 0;
  safePathBonus = 0;
  startTime = Date.now();
  
  // Reset frogger position
  frogger.x = grid * 6;
  frogger.y = grid * 13;
  frogger.speed = 0;
  
  // Show mode selection screen and reset selection
  modeScreen.classList.remove('hidden');
  selectedMode = 'normal';
  updateModeSelection();
}

// Initialize mode selection UI
updateModeSelection();

// Initialize leaderboard on game start
updateLeaderboard();

// game loop
function loop() {
  requestAnimationFrame(loop);
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

      scoredFroggers.push(new Sprite({
        ...frogger,
        x: col * grid,
        y: frogger.y + 5,
        image: filerImage
      }));

      // Check for win condition after adding a new scored frogger
      checkWinCondition();
    }

    // reset frogger if not on obstacle in river
    if (froggerRow < rows.length / 2 - 1) {
      frogger.x = grid * 6;
      frogger.y = grid * 13;
    }
  }
}

// listen to keyboard events to move frogger
document.addEventListener('keydown', function(e) {
  // Restart game with 'R' key
  if (e.which === 82) { // 82 is the key code for 'R'
    restartGame();
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
  frogger.x = Math.min( Math.max(0, frogger.x), canvas.width - grid);
  frogger.y = Math.min( Math.max(grid, frogger.y), canvas.height - grid * 2);
});

// start the game
requestAnimationFrame(loop); 