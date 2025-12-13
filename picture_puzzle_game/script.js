const gameArea = document.getElementById('game-area');
const board = document.getElementById('board');
const resetBtn = document.getElementById('reset-btn');
const messageEl = document.getElementById('message');

const ROWS = 4;
const COLS = 4;
const TILE_SIZE = 100; // px
const BOARD_SIZE = 400; // px

let pieces = [];
let dropZones = [];

function initGame() {
    createBoard();
    createPieces();
    scatterPieces();
}

function createBoard() {
    board.innerHTML = '';
    dropZones = [];

    // Create drop zones (grid slots)
    // The board uses CSS grid, so we just append divs.
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const zone = document.createElement('div');
            zone.classList.add('drop-zone');
            zone.dataset.row = r;
            zone.dataset.col = c;
            // The expected correct value for this zone
            zone.dataset.expected = r * COLS + c;

            board.appendChild(zone);
            dropZones.push(zone);
        }
    }
}

function createPieces() {
    // Remove any existing pieces from gameArea (except board)
    const existingPieces = document.querySelectorAll('.piece');
    existingPieces.forEach(p => p.remove());

    pieces = [];

    for (let i = 0; i < ROWS * COLS; i++) {
        const piece = document.createElement('div');
        piece.classList.add('piece');

        const r = Math.floor(i / COLS);
        const c = i % COLS;

        // Background positioning
        const bgX = -(c * TILE_SIZE);
        const bgY = -(r * TILE_SIZE);
        piece.style.backgroundPosition = `${bgX}px ${bgY}px`;

        piece.dataset.value = i;

        // Add Drag Events
        addDragLogic(piece);

        gameArea.appendChild(piece);
        pieces.push(piece);
    }
}

function scatterPieces() {
    messageEl.textContent = '';
    const areaRect = gameArea.getBoundingClientRect();
    // We want to scatter them in the game-area but NOT on the board initially if possible, 
    // or just randomly anywhere. Randomly anywhere is fine, user sorts them.

    // Define the range for random position
    // Available width/height minus piece size
    const maxX = areaRect.width - TILE_SIZE;
    const maxY = areaRect.height - TILE_SIZE;

    pieces.forEach(piece => {
        // Reset state
        piece.style.left = '0px';
        piece.style.top = '0px';
        piece.style.zIndex = '10';

        // Random pos
        const randX = Math.random() * maxX;
        const randY = Math.random() * maxY;

        piece.style.left = `${randX}px`;
        piece.style.top = `${randY}px`;
    });
}

function addDragLogic(el) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const onMouseDown = (e) => {
        // Prevent default only if necessary, but for mouse interaction usually ok
        // e.preventDefault(); 
        isDragging = true;

        // Get mouse position relative to viewport
        // Use clientX/Y
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        startX = clientX;
        startY = clientY;

        // Get current element position relative to gameArea
        initialLeft = parseFloat(el.style.left || 0);
        initialTop = parseFloat(el.style.top || 0);

        el.style.zIndex = '100'; // Bring to front
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // crucial for touch

        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        el.style.left = `${initialLeft + deltaX}px`;
        el.style.top = `${initialTop + deltaY}px`;
    };

    const onMouseUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        el.style.zIndex = '10'; // Reset z-index

        checkDrop(el);
    };

    // Mouse events
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch events
    el.addEventListener('touchstart', onMouseDown, { passive: false });
    window.addEventListener('touchmove', onMouseMove, { passive: false });
    window.addEventListener('touchend', onMouseUp);
}

function checkDrop(piece) {
    const pieceRect = piece.getBoundingClientRect();
    const pieceCenter = {
        x: pieceRect.left + pieceRect.width / 2,
        y: pieceRect.top + pieceRect.height / 2
    };

    // Find if the center is within any drop zone
    let droppedZone = null;
    let minDistance = Infinity;

    dropZones.forEach(zone => {
        const zoneRect = zone.getBoundingClientRect();
        const zoneCenter = {
            x: zoneRect.left + zoneRect.width / 2,
            y: zoneRect.top + zoneRect.height / 2
        };

        // Simple distance check to find nearest zone if overlapping
        const dist = Math.hypot(pieceCenter.x - zoneCenter.x, pieceCenter.y - zoneCenter.y);

        if (dist < TILE_SIZE / 2) { // Threshold to snap
            if (dist < minDistance) {
                minDistance = dist;
                droppedZone = zone;
            }
        }
    });

    if (droppedZone) {
        snapToZone(piece, droppedZone);
    }
}

function snapToZone(piece, zone) {
    // We need to calculate the relative position of the zone within the gameArea
    // Since piece is absolute inside gameArea
    const gameAreaRect = gameArea.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();

    const relativeLeft = zoneRect.left - gameAreaRect.left;
    const relativeTop = zoneRect.top - gameAreaRect.top;

    piece.style.left = `${relativeLeft}px`;
    piece.style.top = `${relativeTop}px`;

    // Store where the piece is dropped
    piece.dataset.currentZoneIndex = zone.dataset.expected;

    checkWin();
}

function checkWin() {
    let correctCount = 0;

    pieces.forEach(piece => {
        const pieceVal = parseInt(piece.dataset.value);
        // We need to know which zone satisfies the condition
        // A piece is "correct" if its position matches the position of the corresponding zone
        // But since we just snapped it, we can check if it matches the zone's coordinates
        // OR easier: We could assign the piece to the zone logically.

        // Let's do a position check.
        // Get current snapped position
        const pieceLeft = Math.round(parseFloat(piece.style.left));
        const pieceTop = Math.round(parseFloat(piece.style.top));

        // Find expected zone
        const expectedZone = dropZones[pieceVal]; // The zone that this piece BELONGS to

        // Calculate expected position
        const gameAreaRect = gameArea.getBoundingClientRect();
        const zoneRect = expectedZone.getBoundingClientRect();
        const expectedLeft = Math.round(zoneRect.left - gameAreaRect.left);
        const expectedTop = Math.round(zoneRect.top - gameAreaRect.top);

        // Allow small margin of error (pixel rounding)
        if (Math.abs(pieceLeft - expectedLeft) < 2 && Math.abs(pieceTop - expectedTop) < 2) {
            correctCount++;
        }
    });

    if (correctCount === ROWS * COLS) {
        messageEl.textContent = '축하합니다! 모든 퍼즐을 맞추셨습니다!';
    }
}

resetBtn.addEventListener('click', scatterPieces);

initGame();
