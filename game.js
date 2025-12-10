const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game Constants
const TILE_SIZE = 20;
const ROW_COUNT = 20; // 400 / 20
const COL_COUNT = 20; // 400 / 20
const PACMAN_SPEED = 10; // Frames per move, lower is faster? No, let's use pixels per update or grid based.
// Grid based movement is smoother for classic arcade feel.

// 1 = Wall, 0 = Pellet, 2 = Empty, 3 = Power Pellet (Simplified to 0 for now), 4 = Pacman Spawn, 5 = Ghost Spawn
const mapLayout = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2,2],
    [1,1,1,1,0,1,2,1,1,5,1,1,2,1,0,1,1,1,1,1],
    [2,2,2,2,0,2,2,1,5,5,5,1,2,2,0,2,2,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2,2],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,4,0,0,0,0,0,1,0,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Directions
const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };
const LEFT = { x: -1, y: 0 };
const RIGHT = { x: 1, y: 0 };
const NONE = { x: 0, y: 0 };

let score = 0;
let gameOver = false;

// Entities
class Pacman {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = NONE;
        this.nextDirection = NONE;
        this.radius = TILE_SIZE / 2 - 2;
        this.mouthOpen = 0;
        this.mouthSpeed = 0.2;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2);
        
        let rotation = 0;
        if (this.direction === UP) rotation = -Math.PI / 2;
        if (this.direction === DOWN) rotation = Math.PI / 2;
        if (this.direction === LEFT) rotation = Math.PI;
        ctx.rotate(rotation);

        ctx.beginPath();
        
        // Simple mouth animation
        const angle = Math.abs(Math.sin(Date.now() / 100)) * 0.2 * Math.PI;
        
        ctx.arc(0, 0, this.radius, angle, 2 * Math.PI - angle);
        ctx.lineTo(0, 0);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    move() {
        // Try to turn
        if (this.nextDirection !== NONE) {
            if (!this.checkCollision(this.x + this.nextDirection.x, this.y + this.nextDirection.y)) {
                this.direction = this.nextDirection;
                this.nextDirection = NONE;
            }
        }

        if (this.direction !== NONE) {
            const nextX = this.x + this.direction.x;
            const nextY = this.y + this.direction.y;
            
            if (!this.checkCollision(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
            } else {
                // Stop if hitting a wall
                // this.direction = NONE; 
                // Keep trying to move in current direction (classic behavior) to allow cornering?? 
                // Actually strictly simply, just stop updating coord.
            }
        }
        
        // Wrap around (Teleport)
        if (this.x < 0) this.x = COL_COUNT - 1;
        if (this.x >= COL_COUNT) this.x = 0;
    }

    checkCollision(x, y) {
        if (x < 0 || x >= COL_COUNT || y < 0 || y >= ROW_COUNT) return false; // Handled by wrap
        return mapLayout[y][x] === 1;
    }

    eat() {
        if (mapLayout[this.y][this.x] === 0) {
            mapLayout[this.y][this.x] = 2; // Empty
            score += 10;
            scoreElement.textContent = score;
        }
    }
}

// Simple Ghost Placeholder
class Ghost {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.direction = NONE;
        this.moveTimer = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        const cx = this.x * TILE_SIZE + TILE_SIZE / 2;
        const cy = this.y * TILE_SIZE + TILE_SIZE / 2;
        const r = TILE_SIZE / 2 - 2;

        ctx.beginPath();
        ctx.arc(cx, cy - 2, r, Math.PI, 0);
        ctx.lineTo(cx + r, cy + r);
        ctx.lineTo(cx - r, cy + r);
        ctx.fill();
        ctx.closePath();
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 5, 3, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 5, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 5, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    move() {
        if (this.moveTimer++ < 15) return; // Slow down ghosts
        this.moveTimer = 0;

        const directions = [UP, DOWN, LEFT, RIGHT];
        const possibleMoves = directions.filter(dir => {
            const nextX = this.x + dir.x;
            const nextY = this.y + dir.y;
             if (nextX < 0 || nextX >= COL_COUNT || nextY < 0 || nextY >= ROW_COUNT) return false;
            return mapLayout[nextY][nextX] !== 1;
        });

        if (possibleMoves.length > 0) {
            // Simple random movement for now
            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.x += move.x;
            this.y += move.y;
        }
    }
}


let pacman;
let ghosts = [];

function init() {
    let pacSpawn = {x:1, y:1};
    let ghostSpawns = [];
    
    // Parse map for spawns
    for(let y=0; y<ROW_COUNT; y++) {
        for(let x=0; x<COL_COUNT; x++) {
            if (mapLayout[y][x] === 4) {
                pacSpawn = {x, y};
                mapLayout[y][x] = 2; // Clear spawn
            } else if (mapLayout[y][x] === 5) {
                ghostSpawns.push({x, y});
                mapLayout[y][x] = 2; // Clear spawn is ok but ghosts might verify house?
            }
        }
    }

    pacman = new Pacman(pacSpawn.x, pacSpawn.y);
    const colors = ['red', 'pink', 'cyan', 'orange'];
    ghosts = ghostSpawns.map((s, i) => new Ghost(s.x, s.y, colors[i % colors.length]));
}


function drawMap() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROW_COUNT; y++) {
        for (let x = 0; x < COL_COUNT; x++) {
            const type = mapLayout[y][x];
            if (type === 1) {
                ctx.fillStyle = 'blue';
                // Draw simplified wall
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                // Make it look a bit better
                ctx.fillStyle = 'black';
                ctx.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                // Inner blue line
                ctx.strokeStyle = '#1919A6';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * TILE_SIZE + 6, y * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12);
            } else if (type === 0) {
                ctx.fillStyle = '#ffb8ae';
                ctx.beginPath();
                ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function update() {
    if (gameOver) return;

    // Move Pacman - simplified grid movement at interval? 
    // To make it smooth we need interpolation, but let's stick to grid logic for MVP
    // We slow down the update loop or use a timer?
    // Let's use a simple frame counter for movement speed control
    
    if (frameCount % 8 === 0) { // Move every 8 frames
        pacman.move();
        pacman.eat();
    }
    
    ghosts.forEach(ghost => ghost.move());

    // Check Ghost Collision
    ghosts.forEach(ghost => {
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
            console.log("Game Over");
            gameOver = true;
            alert("GAME OVER! Score: " + score);
            location.reload();
        }
    });
}

function draw() {
    drawMap();
    pacman.draw();
    ghosts.forEach(g => g.draw());
}

let frameCount = 0;
function gameLoop() {
    update();
    draw();
    frameCount++;
    requestAnimationFrame(gameLoop);
}

// Input
window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': pacman.nextDirection = UP; break;
        case 'ArrowDown': pacman.nextDirection = DOWN; break;
        case 'ArrowLeft': pacman.nextDirection = LEFT; break;
        case 'ArrowRight': pacman.nextDirection = RIGHT; break;
    }
});

init();
gameLoop();
