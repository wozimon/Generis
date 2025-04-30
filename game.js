const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelCounterElement = document.getElementById('level-counter');

const GRID_SIZE = 16;
const TILE_SIZE = canvas.width / GRID_SIZE;

const COLORS = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    GRAY: '#808080',
    WALL_STROKE: '#FFFFFF',
};

const TILE_TYPES = {
    EMPTY: 0,
    WALL: 1,
};

let grid = [];
let playerPos = { x: 0, y: 0 };
let goalPos = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
let currentLevel = 1;
let gameRunning = true;

function isValid(x, y) {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function getRandomPos(excludePos = null) {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (excludePos && pos.x === excludePos.x && pos.y === excludePos.y);
    return pos;
}

function bfsPathExists(currentGrid, start, end) {
    if (!isValid(start.x, start.y) || currentGrid[start.y][start.x] === TILE_TYPES.WALL) return false;
    if (!isValid(end.x, end.y) || currentGrid[end.y][end.x] === TILE_TYPES.WALL) return false;
    const queue = [start];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);
    while (queue.length > 0) {
        const current = queue.shift();
        if (current.x === end.x && current.y === end.y) return true;
        const neighbors = [
            { x: current.x, y: current.y - 1 }, { x: current.x, y: current.y + 1 },
            { x: current.x - 1, y: current.y }, { x: current.x + 1, y: current.y }
        ];
        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (isValid(neighbor.x, neighbor.y) &&
                currentGrid[neighbor.y][neighbor.x] === TILE_TYPES.EMPTY &&
                !visited.has(key))
            {
                visited.add(key);
                queue.push(neighbor);
            }
        }
    }
    return false;
}

function generateLevel(playerStart, goalStart) {
    console.log(`Создание уровня ${currentLevel} координаты: ${playerStart.x},${playerStart.y} цель: ${goalStart.x},${goalStart.y}`);
    let newGrid;
    let pathFound = false;
    let attempts = 0;
    const maxAttempts = 1000;
    while (!pathFound && attempts < maxAttempts) {
        attempts++;
        newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(TILE_TYPES.EMPTY));
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if ((x !== playerStart.x || y !== playerStart.y) && (x !== goalStart.x || y !== goalStart.y)) {
                    if (Math.random() < 0.35) {
                        newGrid[y][x] = TILE_TYPES.WALL;
                    }
                }
            }
        }
        if(isValid(playerStart.x, playerStart.y)) newGrid[playerStart.y][playerStart.x] = TILE_TYPES.EMPTY;
        if(isValid(goalStart.x, goalStart.y)) newGrid[goalStart.y][goalStart.x] = TILE_TYPES.EMPTY;
        pathFound = bfsPathExists(newGrid, playerStart, goalStart);
    }
     if (!pathFound) {
        console.error(`Ошибка генерации ${maxAttempts} попыток`);
    }
    return newGrid;
}

function drawGame() {
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === TILE_TYPES.WALL) {
                ctx.strokeStyle = COLORS.WALL_STROKE;
                ctx.lineWidth = 1;
                ctx.strokeRect(x * TILE_SIZE + 0.5, y * TILE_SIZE + 0.5, TILE_SIZE -1, TILE_SIZE -1);
            }
        }
    }
    ctx.fillStyle = COLORS.GRAY;
    ctx.fillRect(goalPos.x * TILE_SIZE, goalPos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = COLORS.WHITE;
    ctx.fillRect(playerPos.x * TILE_SIZE, playerPos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function handleKeyDown(event) {
    let moved = false;
    let newX = playerPos.x;
    let newY = playerPos.y;

    switch (event.key) {
        case 'ArrowUp': newY -= 1; moved = true; break;
        case 'ArrowDown': newY += 1; moved = true; break;
        case 'ArrowLeft': newX -= 1; moved = true; break;
        case 'ArrowRight': newX += 1; moved = true; break;
    }

    if (moved) {
        event.preventDefault();
        if (isValid(newX, newY) && grid[newY][newX] === TILE_TYPES.EMPTY) {
            playerPos.x = newX;
            playerPos.y = newY;

            if (playerPos.x === goalPos.x && playerPos.y === goalPos.y) {
                console.log(`Уровень ${currentLevel} закончен, генерирую следующий`);
                currentLevel++;
                startNewLevel();
                if (levelCounterElement) {
                    levelCounterElement.textContent = currentLevel;
                }
            }
        }
    }
}

window.addEventListener('keydown', handleKeyDown);

let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    drawGame();
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function startNewLevel() {
    playerPos = getRandomPos();
    goalPos = getRandomPos(playerPos);
    grid = generateLevel(playerPos, goalPos);
     if (levelCounterElement) {
        levelCounterElement.textContent = currentLevel;
    }
}

function initGame() {
    console.log("Инициализирую игру");
    currentLevel = 1;
    startNewLevel();
    requestAnimationFrame(gameLoop);
}

initGame();