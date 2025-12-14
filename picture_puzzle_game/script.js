const gameArea = document.getElementById('game-area');
const board = document.getElementById('board');
const resetBtn = document.getElementById('reset-btn');
const messageEl = document.getElementById('message');
const changeImageBtn = document.getElementById('change-image-btn');
const controls = document.getElementById('controls');

const timerEl = document.getElementById('timer');
const completionPopup = document.getElementById('completion-popup');
const finalTimeEl = document.getElementById('final-time');
const closePopupBtn = document.getElementById('close-popup');

// 게임 결과 저장 관련 요소
const saveResultBtn = document.getElementById('save-result-btn');
const saveResultPopup = document.getElementById('save-result-popup');
const playerNameInput = document.getElementById('player-name-input');
const confirmSaveBtn = document.getElementById('confirm-save-btn');
const cancelSaveBtn = document.getElementById('cancel-save-btn');
const gameHistorySection = document.getElementById('game-history-section');
const historyContainer = document.getElementById('history-container');

// 이미지 선택 팝업 관련 요소
const imageSelectPopup = document.getElementById('image-select-popup');
const startGameBtn = document.getElementById('start-game-btn');
const cancelPopupBtn = document.getElementById('cancel-popup-btn');
const imageListContainer = document.getElementById('image-list-container');
const imageGrid = document.getElementById('image-grid');
const imageUploadContainer = document.getElementById('image-upload-container');
const imageUploadInput = document.getElementById('image-upload-input');
const imageUploadBtn = document.getElementById('image-upload-btn');
const uploadPreview = document.getElementById('upload-preview');
const puzzleRowsInput = document.getElementById('puzzle-rows');
const puzzleColsInput = document.getElementById('puzzle-cols');

let selectedImagePath = '';
let uploadedImageFile = null;

let startTime = null;
let timerInterval = null;
let isGameComplete = false;

let ROWS = 4;
let COLS = 4;

// CSS 변수에서 크기를 가져오는 함수
function getTileSize() {
    const board = document.getElementById('board');
    if (board) {
        const computedStyle = window.getComputedStyle(board);
        const boardSize = parseFloat(computedStyle.width);
        return boardSize / COLS; // 동적 그리드 크기
    }
    return 100; // 기본값
}

function getBoardSize() {
    const board = document.getElementById('board');
    if (board) {
        const computedStyle = window.getComputedStyle(board);
        return parseFloat(computedStyle.width);
    }
    return 400; // 기본값
}

// 사용 가능한 이미지 목록
const availableImages = [
    'images/Main_Yard_Scene.png',
    'images/episode_1_delicious_lunch.png',
    'images/episode_2_full_ball_play.png',
    'images/episode_3_sweet_nap_time.png'
];

let pieces = [];
let dropZones = [];
let currentImage = '';

// 타이머 시작
function startTimer() {
    startTime = Date.now();
    isGameComplete = false;
    timerInterval = setInterval(updateTimer, 100);
}

// 타이머 업데이트
function updateTimer() {
    if (!startTime || isGameComplete) return;
    
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 타이머 정지
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 시간 포맷팅
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 축하 SVG 애니메이션 생성
function createCelebrationAnimation() {
    const animationEl = document.getElementById('celebration-animation');
    animationEl.innerHTML = `
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <!-- 별들 -->
            <g id="stars">
                <circle cx="50" cy="50" r="3" fill="#FFD700">
                    <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0s"/>
                    <animateTransform attributeName="transform" type="scale" values="0;1.5;0" dur="1s" repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="150" cy="50" r="3" fill="#FFD700">
                    <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0.2s"/>
                    <animateTransform attributeName="transform" type="scale" values="0;1.5;0" dur="1s" repeatCount="indefinite" begin="0.2s"/>
                </circle>
                <circle cx="50" cy="150" r="3" fill="#FFD700">
                    <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0.4s"/>
                    <animateTransform attributeName="transform" type="scale" values="0;1.5;0" dur="1s" repeatCount="indefinite" begin="0.4s"/>
                </circle>
                <circle cx="150" cy="150" r="3" fill="#FFD700">
                    <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0.6s"/>
                    <animateTransform attributeName="transform" type="scale" values="0;1.5;0" dur="1s" repeatCount="indefinite" begin="0.6s"/>
                </circle>
            </g>
            
            <!-- 중앙 별 -->
            <g id="center-star">
                <path d="M100,60 L105,75 L120,75 L108,85 L113,100 L100,90 L87,100 L92,85 L80,75 L95,75 Z" fill="#FFD700">
                    <animateTransform attributeName="transform" type="rotate" values="0 100 80;360 100 80" dur="2s" repeatCount="indefinite"/>
                </path>
            </g>
            
            <!-- 폭죽 효과 -->
            <g id="fireworks">
                <circle cx="100" cy="100" r="2" fill="#FF6B6B">
                    <animate attributeName="r" values="2;30;2" dur="1.5s" repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="opacity" values="1;0;0" dur="1.5s" repeatCount="indefinite" begin="0s"/>
                </circle>
                <circle cx="100" cy="100" r="2" fill="#4ECDC4">
                    <animate attributeName="r" values="2;25;2" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
                    <animate attributeName="opacity" values="1;0;0" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
                </circle>
                <circle cx="100" cy="100" r="2" fill="#FFE66D">
                    <animate attributeName="r" values="2;35;2" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
                    <animate attributeName="opacity" values="1;0;0" dur="1.5s" repeatCount="indefinite" begin="0.6s"/>
                </circle>
            </g>
            
            <!-- 하트 -->
            <g id="hearts">
                <path d="M100,120 C95,115 85,115 85,120 C85,125 95,130 100,135 C105,130 115,125 115,120 C115,115 105,115 100,120 Z" fill="#FF69B4">
                    <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" begin="0s"/>
                    <animateTransform attributeName="transform" type="scale" values="0.5;1;1;0.5" dur="2s" repeatCount="indefinite" begin="0s"/>
                </path>
            </g>
        </svg>
    `;
}

// 완성 팝업 표시
function showCompletionPopup() {
    if (!startTime) return;
    
    const elapsed = Date.now() - startTime;
    finalTimeEl.textContent = formatTime(elapsed);
    
    createCelebrationAnimation();
    completionPopup.classList.remove('hidden');
    stopTimer();
}

// 완성 팝업 닫기
if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => {
        completionPopup.classList.add('hidden');
    });
}

function initGame(imagePath) {
    currentImage = imagePath;
    isGameComplete = false;
    stopTimer(); // 기존 타이머 정지
    
    // 보드 생성
    createBoard();
    
    // DOM이 업데이트되고 레이아웃이 계산된 후 조각 생성
    // setTimeout을 사용하여 보드가 완전히 렌더링된 후 조각 생성
    setTimeout(() => {
        createPieces(imagePath);
        scatterPieces();
        startTimer(); // 새 게임 시작 시 타이머 시작
    }, 50);
}

function changeToRandomImage() {
    // 랜덤 이미지 선택
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const randomImage = availableImages[randomIndex];
    
    // 기존 퍼즐 조각 제거
    const existingPieces = document.querySelectorAll('.piece');
    existingPieces.forEach(p => p.remove());
    pieces = [];
    messageEl.textContent = '';
    
    stopTimer();
    // 새 이미지로 게임 시작
    initGame(randomImage);
}

function createBoard() {
    board.innerHTML = '';
    dropZones = [];

    // CSS 그리드 템플릿 동적 설정 - 명시적으로 설정하여 CSS 기본값을 덮어씀
    board.style.setProperty('grid-template-columns', `repeat(${COLS}, 1fr)`, 'important');
    board.style.setProperty('grid-template-rows', `repeat(${ROWS}, 1fr)`, 'important');

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

function createPieces(imagePath) {
    // Remove any existing pieces from gameArea (except board)
    const existingPieces = document.querySelectorAll('.piece');
    existingPieces.forEach(p => p.remove());

    pieces = [];

    // 보드가 DOM에 추가되고 레이아웃이 계산된 후 크기를 가져옴
    // 동적 타일 크기 계산 (보드 크기를 기준으로)
    const boardSize = getBoardSize();
    const tileSize = boardSize / COLS; // COLS를 사용하여 정확한 타일 크기 계산

    for (let i = 0; i < ROWS * COLS; i++) {
        const piece = document.createElement('div');
        piece.classList.add('piece');

        const r = Math.floor(i / COLS);
        const c = i % COLS;

        // 조각 크기를 명시적으로 설정 (동적 크기)
        piece.style.width = `${tileSize}px`;
        piece.style.height = `${tileSize}px`;

        // Background image 설정
        piece.style.backgroundImage = `url('${imagePath}')`;
        
        // Background positioning - 동적 크기 사용
        const bgX = -(c * tileSize);
        const bgY = -(r * tileSize);
        piece.style.backgroundPosition = `${bgX}px ${bgY}px`;
        piece.style.backgroundSize = `${boardSize}px ${boardSize}px`;

        piece.dataset.value = i;

        // Add Drag Events
        addDragLogic(piece);

        gameArea.appendChild(piece);
        pieces.push(piece);
    }
    
    // 디버깅: 조각이 제대로 생성되었는지 확인
    console.log(`조각 ${pieces.length}개 생성 완료`);
}

function scatterPieces() {
    messageEl.textContent = '';
    
    // gameArea의 실제 크기 사용 (offsetWidth/offsetHeight는 padding 포함, border 제외)
    const areaWidth = gameArea.offsetWidth;
    const areaHeight = gameArea.offsetHeight;
    
    // 동적 타일 크기 가져오기
    const tileSize = getTileSize();
    const boardSize = getBoardSize();
    
    // 보드의 실제 위치 계산 (gameArea 기준)
    const gameAreaRect = gameArea.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const boardLeft = boardRect.left - gameAreaRect.left;
    const boardTop = boardRect.top - gameAreaRect.top;
    const boardRight = boardLeft + boardSize;
    const boardBottom = boardTop + boardSize;
    
    // 보드 영역을 피해서 배치할 수 있는 영역들 정의
    const safeZones = [];
    
    // 보드 위쪽 영역
    if (boardTop > tileSize) {
        safeZones.push({
            left: 0,
            top: 0,
            right: areaWidth,
            bottom: boardTop - 10 // 보드와 10px 간격
        });
    }
    
    // 보드 아래쪽 영역
    if (boardBottom < areaHeight - tileSize) {
        safeZones.push({
            left: 0,
            top: boardBottom + 10, // 보드와 10px 간격
            right: areaWidth,
            bottom: areaHeight
        });
    }
    
    // 보드 왼쪽 영역
    if (boardLeft > tileSize) {
        safeZones.push({
            left: 0,
            top: Math.max(0, boardTop - 10),
            right: boardLeft - 10, // 보드와 10px 간격
            bottom: Math.min(areaHeight, boardBottom + 10)
        });
    }
    
    // 보드 오른쪽 영역
    if (boardRight < areaWidth - tileSize) {
        safeZones.push({
            left: boardRight + 10, // 보드와 10px 간격
            top: Math.max(0, boardTop - 10),
            right: areaWidth,
            bottom: Math.min(areaHeight, boardBottom + 10)
        });
    }

    pieces.forEach(piece => {
        // Reset state
        piece.style.left = '0px';
        piece.style.top = '0px';
        piece.style.zIndex = '10';

        // 보드 영역을 피해서 game-area 내부의 안전한 영역에 배치
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!placed && attempts < maxAttempts) {
            // 안전한 영역 중 하나를 랜덤 선택
            if (safeZones.length > 0) {
                const zone = safeZones[Math.floor(Math.random() * safeZones.length)];
                const zoneWidth = zone.right - zone.left;
                const zoneHeight = zone.bottom - zone.top;
                
                if (zoneWidth >= tileSize && zoneHeight >= tileSize) {
                    const randX = zone.left + Math.random() * (zoneWidth - tileSize);
                    const randY = zone.top + Math.random() * (zoneHeight - tileSize);
                    
                    // 보드 영역과 겹치는지 확인
                    const pieceRight = randX + tileSize;
                    const pieceBottom = randY + tileSize;
                    
                    const overlapsBoard = !(
                        pieceRight < boardLeft - 10 ||
                        randX > boardRight + 10 ||
                        pieceBottom < boardTop - 10 ||
                        randY > boardBottom + 10
                    );
                    
                    // game-area 경계 내에 있는지 확인
                    const withinGameArea = (
                        randX >= 0 &&
                        randY >= 0 &&
                        pieceRight <= areaWidth &&
                        pieceBottom <= areaHeight
                    );
                    
                    if (!overlapsBoard && withinGameArea) {
                        piece.style.left = `${randX}px`;
                        piece.style.top = `${randY}px`;
                        placed = true;
                    }
                }
            }
            attempts++;
        }
        
        // 안전한 영역을 찾지 못한 경우 game-area 내부의 보드가 아닌 곳에 강제 배치
        if (!placed) {
            // game-area 내부이지만 보드 영역을 피해서 배치
            let fallbackX, fallbackY;
            let fallbackAttempts = 0;
            const maxFallbackAttempts = 50;
            
            while (fallbackAttempts < maxFallbackAttempts) {
                fallbackX = Math.random() * (areaWidth - tileSize);
                fallbackY = Math.random() * (areaHeight - tileSize);
                
                const pieceRight = fallbackX + tileSize;
                const pieceBottom = fallbackY + tileSize;
                
                const overlapsBoard = !(
                    pieceRight < boardLeft - 10 ||
                    fallbackX > boardRight + 10 ||
                    pieceBottom < boardTop - 10 ||
                    fallbackY > boardBottom + 10
                );
                
                if (!overlapsBoard) {
                    piece.style.left = `${fallbackX}px`;
                    piece.style.top = `${fallbackY}px`;
                    placed = true;
                    break;
                }
                fallbackAttempts++;
            }
            
            // 최후의 수단: 보드 가장자리 근처에 배치 (완전히 겹치지 않도록)
            if (!placed) {
                // 보드 왼쪽에 배치 시도
                if (boardLeft > tileSize) {
                    piece.style.left = `${Math.max(0, boardLeft - tileSize - 10)}px`;
                    piece.style.top = `${Math.random() * Math.max(0, areaHeight - tileSize)}px`;
                } else {
                    // 보드 오른쪽에 배치 시도
                    piece.style.left = `${Math.min(areaWidth - tileSize, boardRight + 10)}px`;
                    piece.style.top = `${Math.random() * Math.max(0, areaHeight - tileSize)}px`;
                }
            }
        }
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
        const tileSize = getTileSize();

        if (dist < tileSize / 2) { // Threshold to snap
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

    if (correctCount === ROWS * COLS && !isGameComplete) {
        isGameComplete = true;
        showCompletionPopup();
    }
}

// 이벤트 리스너
resetBtn.addEventListener('click', () => {
    if (currentImage) {
        stopTimer();
        startTimer(); // 리셋 시 타이머 재시작
        scatterPieces();
    }
});

// 이미지 선택 팝업 표시
function showImageSelectPopup() {
    // 기본값 설정
    selectedImagePath = '';
    uploadedImageFile = null;
    puzzleRowsInput.value = '4';
    puzzleColsInput.value = '4';
    
    // 라디오 버튼 초기화 (랜덤 선택)
    document.querySelector('input[name="image-source"][value="random"]').checked = true;
    imageListContainer.classList.add('hidden');
    imageUploadContainer.classList.add('hidden');
    uploadPreview.classList.add('hidden');
    
    // 이미지 목록 생성
    populateImageList();
    
    imageSelectPopup.classList.remove('hidden');
}

// 이미지 목록 채우기
function populateImageList() {
    imageGrid.innerHTML = '';
    availableImages.forEach((imagePath, index) => {
        const imageItem = document.createElement('div');
        imageItem.classList.add('image-item');
        imageItem.dataset.imagePath = imagePath;
        
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = `이미지 ${index + 1}`;
        
        const imageName = document.createElement('div');
        imageName.classList.add('image-name');
        // 파일명에서 확장자 제거
        const fileName = imagePath.split('/').pop().replace(/\.[^/.]+$/, '');
        imageName.textContent = fileName;
        
        imageItem.appendChild(img);
        imageItem.appendChild(imageName);
        
        imageItem.addEventListener('click', () => {
            // 다른 항목 선택 해제
            document.querySelectorAll('.image-item').forEach(item => {
                item.classList.remove('selected');
            });
            imageItem.classList.add('selected');
            selectedImagePath = imagePath;
        });
        
        imageGrid.appendChild(imageItem);
    });
}

// 이미지 소스 라디오 버튼 이벤트
document.querySelectorAll('input[name="image-source"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const value = e.target.value;
        imageListContainer.classList.add('hidden');
        imageUploadContainer.classList.add('hidden');
        uploadPreview.classList.add('hidden');
        selectedImagePath = '';
        uploadedImageFile = null;
        
        if (value === 'list') {
            imageListContainer.classList.remove('hidden');
        } else if (value === 'upload') {
            imageUploadContainer.classList.remove('hidden');
        }
    });
});

// 이미지 업로드 버튼 클릭
imageUploadBtn.addEventListener('click', () => {
    imageUploadInput.click();
});

// 이미지 업로드 처리
imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        uploadedImageFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadPreview.innerHTML = `<img src="${event.target.result}" alt="업로드된 이미지">`;
            uploadPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// 팝업 닫기
cancelPopupBtn.addEventListener('click', () => {
    imageSelectPopup.classList.add('hidden');
});

// 팝업 외부 클릭 시 닫기
imageSelectPopup.addEventListener('click', (e) => {
    if (e.target === imageSelectPopup) {
        imageSelectPopup.classList.add('hidden');
    }
});

// 시작하기 버튼 클릭
startGameBtn.addEventListener('click', () => {
    const imageSource = document.querySelector('input[name="image-source"]:checked').value;
    let imageToUse = '';
    
    // 이미지 선택 확인
    if (imageSource === 'random') {
        // 랜덤 이미지 선택
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        imageToUse = availableImages[randomIndex];
    } else if (imageSource === 'list') {
        if (!selectedImagePath) {
            alert('이미지를 선택해주세요.');
            return;
        }
        imageToUse = selectedImagePath;
    } else if (imageSource === 'upload') {
        if (!uploadedImageFile) {
            alert('이미지를 업로드해주세요.');
            return;
        }
        // 업로드된 이미지를 Data URL로 사용
        const reader = new FileReader();
        reader.onload = (event) => {
            imageToUse = event.target.result;
            startNewGame(imageToUse);
        };
        reader.readAsDataURL(uploadedImageFile);
        return; // 비동기 처리이므로 여기서 return
    }
    
    startNewGame(imageToUse);
});

// 새 게임 시작
function startNewGame(imagePath) {
    // 퍼즐 크기 설정
    ROWS = parseInt(puzzleRowsInput.value) || 4;
    COLS = parseInt(puzzleColsInput.value) || 4;
    
    // 유효성 검사
    if (ROWS < 2 || ROWS > 10 || COLS < 2 || COLS > 10) {
        alert('퍼즐 크기는 2x2부터 10x10까지 가능합니다.');
        return;
    }
    
    // 팝업 닫기
    imageSelectPopup.classList.add('hidden');
    
    // 기존 퍼즐 조각 제거
    const existingPieces = document.querySelectorAll('.piece');
    existingPieces.forEach(p => p.remove());
    pieces = [];
    messageEl.textContent = '';
    
    // 새 게임 시작
    initGame(imagePath);
}

changeImageBtn.addEventListener('click', showImageSelectPopup);

// 페이지 로드 시 자동으로 랜덤 이미지 선택 후 게임 시작
window.addEventListener('load', () => {
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const randomImage = availableImages[randomIndex];
    initGame(randomImage);
});

// 창 크기 변경 시 퍼즐 조각 위치 재조정
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (currentImage && pieces.length > 0) {
            // 배경 크기 재조정
            const boardSize = getBoardSize();
            const tileSize = getTileSize();
            pieces.forEach((piece, i) => {
                const r = Math.floor(i / COLS);
                const c = i % COLS;
                const bgX = -(c * tileSize);
                const bgY = -(r * tileSize);
                piece.style.backgroundSize = `${boardSize}px ${boardSize}px`;
                piece.style.backgroundPosition = `${bgX}px ${bgY}px`;
            });
            scatterPieces();
        }
    }, 250);
});

// changeToRandomImage 함수는 더 이상 사용되지 않지만 호환성을 위해 유지
function changeToRandomImage() {
    showImageSelectPopup();
}

// 같은 이미지 히스토리 관련 요소
const sameImageHistory = document.getElementById('same-image-history');
const sameImageHistoryList = document.getElementById('same-image-history-list');
const savePopupTimeEl = document.getElementById('save-popup-time');

// 같은 이미지의 게임 결과 목록 표시 함수
function displaySameImageHistory() {
    if (!currentImage) return;
    
    // localStorage에서 모든 히스토리 가져오기
    const allHistory = JSON.parse(localStorage.getItem('puzzleGameHistory') || '[]');
    
    // 같은 이미지 경로의 게임 결과 필터링
    const sameImageResults = allHistory.filter(result => result.imagePath === currentImage);
    
    if (sameImageResults.length === 0) {
        sameImageHistoryList.innerHTML = '<p style="text-align: center; color: #666; padding: 10px; font-size: 0.9rem;">이 이미지로 저장된 게임 결과가 없습니다.</p>';
        return;
    }
    
    // 퍼즐 크기별로 그룹화
    const groupedBySize = {};
    sameImageResults.forEach(result => {
        const size = result.puzzleSize;
        if (!groupedBySize[size]) {
            groupedBySize[size] = [];
        }
        groupedBySize[size].push(result);
    });
    
    // 각 그룹을 완성 시간 순으로 정렬 (짧은 시간이 위로)
    Object.keys(groupedBySize).forEach(size => {
        groupedBySize[size].sort((a, b) => a.completionTime - b.completionTime);
    });
    
    // 퍼즐 크기별로 정렬된 결과를 하나의 배열로 합치기
    const sortedResults = [];
    Object.keys(groupedBySize).sort().forEach(size => {
        sortedResults.push(...groupedBySize[size]);
    });
    
    // 목록 HTML 생성
    sameImageHistoryList.innerHTML = '';
    
    sortedResults.forEach((result, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('same-image-history-item');
        
        historyItem.innerHTML = `
            <div class="same-image-history-info">
                <div class="same-image-history-size">${result.puzzleSize}</div>
                <div class="same-image-history-name">${result.playerName}</div>
                <div class="same-image-history-time">${result.completionTimeFormatted}</div>
                <div class="same-image-history-date">${result.dateFormatted}</div>
            </div>
        `;
        
        sameImageHistoryList.appendChild(historyItem);
    });
}

// 게임 결과 저장 버튼 클릭
if (saveResultBtn) {
    saveResultBtn.addEventListener('click', () => {
        saveResultPopup.classList.remove('hidden');
        playerNameInput.value = '';
        playerNameInput.focus();
        
        // 현재 완성 시간 표시
        if (finalTimeEl && savePopupTimeEl) {
            savePopupTimeEl.textContent = finalTimeEl.textContent;
        }
        
        // 같은 이미지의 이전 게임 결과 표시
        displaySameImageHistory();
    });
}

// 저장 취소 버튼
if (cancelSaveBtn) {
    cancelSaveBtn.addEventListener('click', () => {
        saveResultPopup.classList.add('hidden');
    });
}

// 저장 팝업 외부 클릭 시 닫기
if (saveResultPopup) {
    saveResultPopup.addEventListener('click', (e) => {
        if (e.target === saveResultPopup) {
            saveResultPopup.classList.add('hidden');
        }
    });
}

// 게임 결과 저장 함수
function saveGameResult(playerName) {
    if (!startTime || !currentImage) return;
    
    const elapsed = Date.now() - startTime;
    const now = new Date();
    
    // 게임 결과 데이터
    const gameResult = {
        id: Date.now(), // 고유 ID
        playerName: playerName || '익명',
        imagePath: currentImage,
        puzzleSize: `${ROWS}x${COLS}`,
        completionTime: elapsed, // 밀리초
        completionTimeFormatted: formatTime(elapsed),
        date: now.toISOString(),
        dateFormatted: now.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    // localStorage에서 기존 히스토리 가져오기
    let history = JSON.parse(localStorage.getItem('puzzleGameHistory') || '[]');
    
    // 새 결과 추가 (최신순으로 정렬)
    history.unshift(gameResult);
    
    // 최대 100개까지만 저장
    if (history.length > 100) {
        history = history.slice(0, 100);
    }
    
    // localStorage에 저장
    localStorage.setItem('puzzleGameHistory', JSON.stringify(history));
    
    // 저장 완료 메시지
    alert('게임 결과가 저장되었습니다!');
    
    // 콘솔에 저장된 모든 게임 결과 출력
    console.log('=== 저장된 게임 결과 (전체) ===');
    console.log('총 저장된 게임 수:', history.length);
    console.log('저장된 게임 결과:', history);
    console.log('==============================');
    
    // 저장 팝업 닫기
    saveResultPopup.classList.add('hidden');
    completionPopup.classList.add('hidden');
    
    // 히스토리 표시
    displayHistory();
}

// 저장 확인 버튼
if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name) {
            saveGameResult(name);
        } else {
            alert('이름을 입력해주세요.');
            playerNameInput.focus();
        }
    });
}

// Enter 키로 저장
if (playerNameInput) {
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmSaveBtn.click();
        }
    });
}

// 히스토리 표시 함수
function displayHistory() {
    const history = JSON.parse(localStorage.getItem('puzzleGameHistory') || '[]');
    
    // 콘솔에 저장된 모든 게임 결과 출력
    console.log('=== 저장된 게임 결과 (히스토리 표시 시) ===');
    console.log('총 저장된 게임 수:', history.length);
    if (history.length > 0) {
        console.log('저장된 게임 결과:', history);
        console.log('상세 정보:');
        history.forEach((result, index) => {
            console.log(`[${index + 1}]`, {
                이름: result.playerName,
                퍼즐크기: result.puzzleSize,
                완성시간: result.completionTimeFormatted,
                날짜: result.dateFormatted,
                이미지경로: result.imagePath
            });
        });
    } else {
        console.log('저장된 게임 결과가 없습니다.');
    }
    console.log('==========================================');
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">저장된 게임 결과가 없습니다.</p>';
        gameHistorySection.classList.add('hidden');
        return;
    }
    
    // 히스토리 섹션 표시
    gameHistorySection.classList.remove('hidden');
    
    // 히스토리 컨테이너 초기화
    historyContainer.innerHTML = '';
    
    // 히스토리 항목 생성
    history.forEach((result, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        
        // 이미지 썸네일 생성
        const thumbnail = document.createElement('img');
        thumbnail.src = result.imagePath;
        thumbnail.alt = '게임 이미지';
        thumbnail.classList.add('history-thumbnail');
        
        // 정보 영역
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('history-info');
        
        const nameDiv = document.createElement('div');
        nameDiv.classList.add('history-name');
        nameDiv.textContent = result.playerName;
        
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('history-details');
        detailsDiv.innerHTML = `
            <div>퍼즐 크기: ${result.puzzleSize}</div>
            <div>완성 시간: ${result.completionTimeFormatted}</div>
            <div>날짜: ${result.dateFormatted}</div>
        `;
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(detailsDiv);
        
        historyItem.appendChild(thumbnail);
        historyItem.appendChild(infoDiv);
        
        historyContainer.appendChild(historyItem);
    });
}

// 페이지 로드 시 히스토리 표시 (기존 load 이벤트와 함께 실행)
setTimeout(() => {
    displayHistory();
}, 200);

