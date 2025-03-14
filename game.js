const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-canvas',
    backgroundColor: '#1a472a', // Dark green background
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game constants
const GRID_SIZE = 40; // Smaller grid size
const LANE_HEIGHT = 48; // Smaller lane height
const OBSTACLE_BASE_SPEED = 1.5; // Base speed for obstacles
const MOVE_DELAY = 100; // Slightly faster movement response

// Sprite scales
const PLAYER_SCALE = 0.15;
const OBSTACLE_SCALE = 0.12;
const SERVER_SCALE = 0.2;

// Lane configuration
const LANES = [
    { y: 560, type: 'safe' },    // Bottom safe zone
    { y: 512, type: 'road', speed: 2 },
    { y: 464, type: 'road', speed: -2.5 },
    { y: 416, type: 'water', speed: 3 },
    { y: 368, type: 'water', speed: -2 },
    { y: 320, type: 'road', speed: 2.5 },
    { y: 272, type: 'water', speed: -3 },
    { y: 224, type: 'road', speed: 2 },
    { y: 176, type: 'water', speed: -2.5 },
    { y: 128, type: 'road', speed: 3 },
    { y: 80, type: 'safe' }      // Top safe zone
];

let player;
let cursors;
let obstacles = [];
let score = 0;
let scoreText;
let gameStarted = false;
let server;
let lastMoveTime = 0;

function preload() {
    // Load custom assets
    this.load.image('player', 'images/filer.png');
    this.load.image('hacker', 'images/hacker.png');
    this.load.image('wifi', 'images/wifi.png');
    this.load.image('doc', 'images/doc.png');
    this.load.image('folder', 'images/folder.png');
    this.load.image('server', 'images/server.png');
}

function create() {
    // Create background lanes
    createLanes(this);

    // Add server at the top
    server = this.add.sprite(400, 80, 'server');
    server.setScale(SERVER_SCALE);

    // Create player
    player = this.add.sprite(400, 560, 'player');
    player.setScale(PLAYER_SCALE);

    // Setup controls
    cursors = this.input.keyboard.createCursorKeys();

    // Create score text
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4
    });

    // Create obstacles for each lane
    LANES.forEach(lane => {
        if (lane.type !== 'safe') {
            createObstaclesForLane(this, lane);
        }
    });

    // Add start screen interaction
    this.input.keyboard.on('keydown-SPACE', () => {
        if (!gameStarted) {
            document.getElementById('start-screen').style.display = 'none';
            gameStarted = true;
        }
    });
}

function createLanes(scene) {
    // Create alternating background lanes
    LANES.forEach(lane => {
        const color = lane.type === 'safe' ? 0x2d5a27 :
                     lane.type === 'road' ? 0x4a4a4a : 0x0066cc;
        scene.add.rectangle(400, lane.y, 800, LANE_HEIGHT, color);
    });
}

function createObstaclesForLane(scene, lane) {
    const obstacleTypes = lane.type === 'road' ? ['hacker', 'folder'] : ['wifi', 'doc'];
    const numObstacles = lane.type === 'road' ? 5 : 4; // More obstacles per lane
    const spacing = 800 / numObstacles;
    
    for (let i = 0; i < numObstacles; i++) {
        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const startX = lane.speed > 0 ? -50 + (i * spacing) : 850 - (i * spacing);
        
        const obstacle = scene.add.sprite(startX, lane.y, obstacleType);
        obstacle.setScale(OBSTACLE_SCALE);
        
        // Flip sprite if moving left
        if (lane.speed < 0) {
            obstacle.setFlipX(true);
        }
        
        obstacles.push({
            sprite: obstacle,
            speed: lane.speed,
            laneY: lane.y,
            type: lane.type
        });
    }
}

function update() {
    if (!gameStarted) return;

    const currentTime = Date.now();
    
    // Handle player movement
    if (currentTime - lastMoveTime > MOVE_DELAY) {
        let moved = false;
        
        if (cursors.left.isDown && player.x > GRID_SIZE) {
            player.x -= GRID_SIZE;
            player.setFlipX(true);
            moved = true;
        } else if (cursors.right.isDown && player.x < 800 - GRID_SIZE) {
            player.x += GRID_SIZE;
            player.setFlipX(false);
            moved = true;
        } else if (cursors.up.isDown && player.y > GRID_SIZE) {
            player.y -= GRID_SIZE;
            moved = true;
        } else if (cursors.down.isDown && player.y < 600 - GRID_SIZE) {
            player.y += GRID_SIZE;
            moved = true;
        }

        if (moved) {
            lastMoveTime = currentTime;
        }
    }

    // Move obstacles
    obstacles.forEach(obstacle => {
        // Move obstacle
        obstacle.sprite.x += obstacle.speed;
        
        // Reset obstacle position when it goes off screen
        if (obstacle.speed > 0 && obstacle.sprite.x > 850) {
            obstacle.sprite.x = -50;
        } else if (obstacle.speed < 0 && obstacle.sprite.x < -50) {
            obstacle.sprite.x = 850;
        }

        // Check collision with adjusted hitbox
        const playerBounds = player.getBounds();
        const obstacleBounds = obstacle.sprite.getBounds();
        
        // Reduce the collision bounds for more forgiving gameplay
        playerBounds.width *= 0.5;
        playerBounds.height *= 0.5;
        obstacleBounds.width *= 0.5;
        obstacleBounds.height *= 0.5;

        if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, obstacleBounds)) {
            gameOver();
        }
    });

    // Check if player reached the server
    if (Math.abs(player.y - server.y) < GRID_SIZE && Math.abs(player.x - server.x) < GRID_SIZE) {
        score += 100;
        scoreText.setText('Score: ' + score);
        resetPlayer();
        
        // Add success effect
        this.tweens.add({
            targets: server,
            scale: SERVER_SCALE * 1.2,
            duration: 200,
            yoyo: true,
            repeat: 1
        });
    }
}

function resetPlayer() {
    player.x = 400;
    player.y = 560;
    player.setFlipX(false);
}

function gameOver() {
    gameStarted = false;
    document.getElementById('start-screen').style.display = 'flex';
    document.getElementById('start-screen').innerHTML = `
        <h1 class="text-4xl font-bold mb-4 frogger-text">Game Over</h1>
        <p class="text-xl mb-4 frogger-text">Score: ${score}</p>
        <p class="text-xl mb-8 frogger-text">Press SPACE to Restart</p>
    `;
    score = 0;
    scoreText.setText('Score: 0');
    resetPlayer();
} 