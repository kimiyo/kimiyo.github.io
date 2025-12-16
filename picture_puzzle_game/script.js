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
const debugVisualizeBtn = document.getElementById('debug-visualize-btn');
const debugVisualizePopup = document.getElementById('debug-visualize-popup');
const debugVisualizeCanvas = document.getElementById('debug-visualize-canvas');
const debugVisualizeClose = document.getElementById('debug-visualize-close');
const hintBtn = document.getElementById('hint-btn');

let selectedImagePath = '';
let uploadedImageFile = null;
let uploadedImageFileName = ''; // 업로드된 이미지의 파일명 저장

let startTime = null;
let timerInterval = null;
let isGameComplete = false;

let ROWS = 4;
let COLS = 4;

// 퍼즐 조각 경계선 데이터 저장
let verticalSegments = [];   // verticalSegments[col][row] -> 제어점 배열
let horizontalSegments = [];  // horizontalSegments[row][col] -> 제어점 배열
let sampledPaths = {};        // 캐시: 샘플링된 경로들
let intersections = {};      // 캐시: 교차점들
let piecePathsVisible = true; // 디버그용 조각 경계선 표시 여부
let boundaryLogged = false;   // 2x2 디버그용 경계 로그 플래그

// CSS 변수에서 크기를 가져오는 함수
function getTileSize() {
    const board = document.getElementById('board');
    if (board) {
        const boardSize = board.clientWidth; // 패딩/스크롤 제외한 실제 컨텐츠 폭
        return boardSize / COLS; // 동적 그리드 크기
    }
    return 100; // 기본값
}

function getBoardSize() {
    const board = document.getElementById('board');
    if (board) {
        return board.clientWidth; // 실제 렌더된 보드 크기
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

// ==================== 퍼즐 조각 경계선 생성 ====================

// 곡선 세그먼트 생성 함수 (script_making_puzzle_piece.js 기반)
function generateSegment(start, end, isVertical, isBorder, tileSize) {
    let points = [];
    points.push(start);
    
    if (!isBorder) {
        const length = isVertical ? (end.y - start.y) : (end.x - start.x);
        const numPoints = Math.floor(Math.random() * 3) + 3; // 3-5개의 제어점
        const slotSize = length / numPoints;

        for (let k = 0; k < numPoints; k++) {
            let min = slotSize * k + (slotSize * 0.1);
            let max = slotSize * (k + 1) - (slotSize * 0.1);
            let mainVal = min + Math.random() * (max - min);
            // Random offset - 타일 크기의 20% 이내로 완만하게
            let crossOffset = (Math.random() - 0.5) * (isVertical ? tileSize : tileSize) * 0.2;

            if (isVertical) {
                points.push({ x: start.x + crossOffset, y: start.y + mainVal });
            } else {
                points.push({ x: start.x + mainVal, y: start.y + crossOffset });
            }
        }
    }
    
    points.push(end);
    return points;
}

// 퍼즐 경계선 생성 (게임 시작 시 한 번만 생성)
function generatePuzzleBoundaries(tileSize) {
    verticalSegments = [];
    horizontalSegments = [];
    sampledPaths = {}; // 캐시 초기화
    intersections = {}; // 캐시 초기화
    boundaryLogged = false; // 새 경계 생성 시 로그 플래그 리셋

    // 수직 경계선 생성
    for (let i = 0; i <= COLS; i++) {
        verticalSegments[i] = [];
        for (let j = 0; j < ROWS; j++) {
            let start = { x: i * tileSize, y: j * tileSize };
            let end = { x: i * tileSize, y: (j + 1) * tileSize };
            let isBorder = (i === 0 || i === COLS);
            verticalSegments[i][j] = generateSegment(start, end, true, isBorder, tileSize);
        }
    }

    // 수평 경계선 생성
    for (let j = 0; j <= ROWS; j++) {
        horizontalSegments[j] = [];
        for (let i = 0; i < COLS; i++) {
            let start = { x: i * tileSize, y: j * tileSize };
            let end = { x: (i + 1) * tileSize, y: j * tileSize };
            let isBorder = (j === 0 || j === ROWS);
            horizontalSegments[j][i] = generateSegment(start, end, false, isBorder, tileSize);
        }
    }

    // 2x2 디버깅: 최초 1회 경계 제어점 로그
    if (ROWS === 2 && COLS === 2 && !boundaryLogged) {
        console.log('📐 [2x2] 경계 제어점 (수직)');
        for (let i = 0; i <= COLS; i++) {
            for (let j = 0; j < ROWS; j++) {
                console.log(`v_${i}_${j}`, verticalSegments[i][j]);
            }
        }
        console.log('📐 [2x2] 경계 제어점 (수평)');
        for (let j = 0; j <= ROWS; j++) {
            for (let i = 0; i < COLS; i++) {
                console.log(`h_${j}_${i}`, horizontalSegments[j][i]);
            }
        }
        boundaryLogged = true;
    }
}

// ==================== 좌표 정규화 유틸리티 ====================

// 좌표를 정수 픽셀로 반올림하여 부동소수점 오류 방지
function roundPoint(p) {
    return {
        x: Math.round(p.x),
        y: Math.round(p.y)
    };
}

// ==================== 베지어 곡선 샘플링 ====================

// 베지어 곡선의 한 점 계산 (t는 0~1 사이)
function bezierPoint(p0, p1, p2, t) {
    const mt = 1 - t;
    return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    };
}

// 베지어 곡선의 곡률 추정 (제어점과 중간점의 거리)
function estimateCurvature(p0, p1, p2) {
    const mid = bezierPoint(p0, p1, p2, 0.5);
    const straightMid = {
        x: (p0.x + p2.x) / 2,
        y: (p0.y + p2.y) / 2
    };
    const distance = Math.hypot(mid.x - straightMid.x, mid.y - straightMid.y);
    const length = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    return length > 0 ? distance / length : 0;
}

// 고정 간격 샘플링으로 베지어 곡선을 세밀한 점들로 변환
function sampleQuadraticCurve(p0, p1, p2, step = 3) {
    const points = [];
    const length = Math.hypot(p2.x - p0.x, p2.y - p0.y);
    const numSamples = Math.max(2, Math.ceil(length / step));
    
    // 고정 간격으로 샘플링
    for (let i = 0; i <= numSamples; i++) {
        const t = i / numSamples;
        points.push(bezierPoint(p0, p1, p2, t));
    }
    
    return points;
}

// 제어점 배열을 세밀한 경로로 샘플링 (3px 고정 간격)
function samplePathSegment(controlPoints, step = 3) {
    if (!controlPoints || controlPoints.length < 2) return [];

    // 직선 2점만 있는 경우는 그대로 등분 샘플링 (overshoot 방지)
    if (controlPoints.length === 2) {
        const [p0, p1] = controlPoints;
        const length = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const count = Math.max(2, Math.ceil(length / step) + 1);
        const out = [];
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            // 부동소수점 오류 방지를 위해 정수로 반올림
            out.push(roundPoint({
                x: p0.x + t * (p1.x - p0.x),
                y: p0.y + t * (p1.y - p0.y)
            }));
        }
        return out;
    }

    // Catmull-Rom 기반 스무딩으로 하나의 부드러운 곡선 생성
    const cr = (p0, p1, p2, p3, t) => {
        // 0.5 * ((2 * p1) + (-p0 + p2) * t + (2p0 - 5p1 + 4p2 - p3) * t^2 + (-p0 + 3p1 - 3p2 + p3) * t^3)
        const t2 = t * t;
        const t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    };

    const pts = controlPoints;
    const sampled = [];
    // 부동소수점 오류 방지를 위해 정수로 반올림
    sampled.push(roundPoint(pts[0]));

    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || pts[i + 1];

        const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const sampleCount = Math.max(3, Math.ceil(segLen / step));

        for (let s = 1; s <= sampleCount; s++) {
            const t = s / sampleCount;
            // 부동소수점 오류 방지를 위해 정수로 반올림
            sampled.push(roundPoint({
                x: cr(p0.x, p1.x, p2.x, p3.x, t),
                y: cr(p0.y, p1.y, p2.y, p3.y, t)
            }));
        }
    }

    return sampled;
}

// ==================== 교차점 계산 ====================

// 두 선분의 교차점 계산
function findLineIntersection(p1, p2, p3, p4) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null; // 평행한 경우
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    // 교차점이 두 선분 위에 있는지 확인
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1),
            t: t,
            u: u
        };
    }
    
    return null;
}

// 두 곡선(세밀한 점 배열)의 교차점 찾기
function findCurveIntersections(path1, path2) {
    const intersections = [];
    
    for (let i = 0; i < path1.length - 1; i++) {
        for (let j = 0; j < path2.length - 1; j++) {
            const intersection = findLineIntersection(
                path1[i], path1[i + 1],
                path2[j], path2[j + 1]
            );
            
            if (intersection) {
                // 중복 제거 (근접한 교차점은 하나로)
                const isDuplicate = intersections.some(existing => 
                    Math.hypot(existing.x - intersection.x, existing.y - intersection.y) < 1
                );
                
                if (!isDuplicate) {
                    intersections.push({
                        x: intersection.x,
                        y: intersection.y,
                        t1: (i + intersection.t) / path1.length,
                        t2: (j + intersection.u) / path2.length,
                        index1: i,
                        index2: j
                    });
                }
            }
        }
    }
    
    return intersections;
}

// 모든 경계선의 교차점 찾기
function findAllIntersections(tileSize) {
    const allIntersections = {};
    
    // 각 경계선을 샘플링
    const sampledVerticals = {};
    const sampledHorizontals = {};
    
    // 수직 경계선 샘플링
    for (let i = 0; i <= COLS; i++) {
        sampledVerticals[i] = [];
        for (let j = 0; j < ROWS; j++) {
            const key = `v_${i}_${j}`;
            if (!sampledPaths[key]) {
                sampledPaths[key] = samplePathSegment(verticalSegments[i][j]);
            }
            sampledVerticals[i].push(sampledPaths[key]);
        }
    }
    
    // 수평 경계선 샘플링
    for (let j = 0; j <= ROWS; j++) {
        sampledHorizontals[j] = [];
        for (let i = 0; i < COLS; i++) {
            const key = `h_${j}_${i}`;
            if (!sampledPaths[key]) {
                sampledPaths[key] = samplePathSegment(horizontalSegments[j][i]);
            }
            sampledHorizontals[j].push(sampledPaths[key]);
        }
    }
    
    // 교차점 찾기: 수직과 수평 경계선의 교차
    for (let col = 0; col <= COLS; col++) {
        for (let row = 0; row <= ROWS; row++) {
            const intersections = [];
            
            // 이 교차점 주변의 경계선들 찾기
            if (col > 0 && row < ROWS) {
                // 왼쪽 수직 경계선
                const leftVert = sampledVerticals[col - 1][row];
                if (row > 0) {
                    // 위쪽 수평 경계선과 교차
                    const topHoriz = sampledHorizontals[row - 1][col - 1];
                    const inter = findCurveIntersections(leftVert, topHoriz);
                    intersections.push(...inter);
                }
                if (row < ROWS) {
                    // 아래쪽 수평 경계선과 교차
                    const bottomHoriz = sampledHorizontals[row][col - 1];
                    const inter = findCurveIntersections(leftVert, bottomHoriz);
                    intersections.push(...inter);
                }
            }
            
            if (col < COLS && row < ROWS) {
                // 오른쪽 수직 경계선
                const rightVert = sampledVerticals[col][row];
                if (row > 0) {
                    // 위쪽 수평 경계선과 교차
                    const topHoriz = sampledHorizontals[row - 1][col];
                    const inter = findCurveIntersections(rightVert, topHoriz);
                    intersections.push(...inter);
                }
                if (row < ROWS) {
                    // 아래쪽 수평 경계선과 교차
                    const bottomHoriz = sampledHorizontals[row][col];
                    const inter = findCurveIntersections(rightVert, bottomHoriz);
                    intersections.push(...inter);
                }
            }
            
            // 가장 가까운 교차점 선택 (이론적 교차점)
            const theoreticalX = col * tileSize;
            const theoreticalY = row * tileSize;
            
            if (intersections.length > 0) {
                // 가장 가까운 교차점 찾기
                let closest = intersections[0];
                let minDist = Math.hypot(closest.x - theoreticalX, closest.y - theoreticalY);
                
                for (const inter of intersections) {
                    const dist = Math.hypot(inter.x - theoreticalX, inter.y - theoreticalY);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = inter;
                    }
                }

                // 부동소수점 오류 방지를 위해 교차점을 정수로 반올림
                allIntersections[`${row}_${col}`] = roundPoint(closest);
            } else {
                // 교차점이 없으면 이론적 교차점 사용 (정수로 반올림)
                allIntersections[`${row}_${col}`] = roundPoint({
                    x: theoreticalX,
                    y: theoreticalY
                });
            }
        }
    }
    
    return allIntersections;
}

// ==================== 퍼즐 조각 경계 Path 생성 ====================

// 경계선에서 교차점 사이의 점들만 추출하는 헬퍼 함수
function extractPathBetweenIntersections(path, startIntersection, endIntersection, isHorizontal) {
    const extracted = [];

    // 시작점과 가장 가까운 경로상의 점 찾기
    let startIdx = 0;
    let minStartDist = Infinity;
    for (let i = 0; i < path.length; i++) {
        const dist = Math.hypot(path[i].x - startIntersection.x, path[i].y - startIntersection.y);
        if (dist < minStartDist) {
            minStartDist = dist;
            startIdx = i;
        }
    }

    // 끝점과 가장 가까운 경로상의 점 찾기
    let endIdx = path.length - 1;
    let minEndDist = Infinity;
    for (let i = 0; i < path.length; i++) {
        const dist = Math.hypot(path[i].x - endIntersection.x, path[i].y - endIntersection.y);
        if (dist < minEndDist) {
            minEndDist = dist;
            endIdx = i;
        }
    }

    // 정확한 교차점으로 시작 (부동소수점 오류 방지)
    extracted.push({ x: startIntersection.x, y: startIntersection.y });

    // 중간 경로상의 점들 추가 (교차점과 너무 가까운 점은 제외하여 중복 방지)
    const skipThreshold = 1.5; // 1.5px 이내의 점은 제외

    if (startIdx <= endIdx) {
        // 정방향
        for (let i = startIdx; i <= endIdx; i++) {
            const distToStart = Math.hypot(path[i].x - startIntersection.x, path[i].y - startIntersection.y);
            const distToEnd = Math.hypot(path[i].x - endIntersection.x, path[i].y - endIntersection.y);

            // 시작점과 끝점에서 충분히 떨어진 점만 추가
            if (distToStart > skipThreshold && distToEnd > skipThreshold) {
                extracted.push(path[i]);
            }
        }
    } else {
        // 역방향
        for (let i = startIdx; i >= endIdx; i--) {
            const distToStart = Math.hypot(path[i].x - startIntersection.x, path[i].y - startIntersection.y);
            const distToEnd = Math.hypot(path[i].x - endIntersection.x, path[i].y - endIntersection.y);

            // 시작점과 끝점에서 충분히 떨어진 점만 추가
            if (distToStart > skipThreshold && distToEnd > skipThreshold) {
                extracted.push(path[i]);
            }
        }
    }

    // 정확한 교차점으로 종료 (부동소수점 오류 방지)
    extracted.push({ x: endIntersection.x, y: endIntersection.y });

    return extracted;
}

// 특정 조각의 경계 Path 생성
function buildPieceBoundaryPath(row, col, tileSize) {
    // 경계선 키 생성
    const topKey = `h_${row}_${col}`;
    const rightKey = `v_${col + 1}_${row}`;
    const bottomKey = `h_${row + 1}_${col}`;
    const leftKey = `v_${col}_${row}`;
    
    // 샘플링된 경로 가져오기 (없으면 생성)
    if (!sampledPaths[topKey]) {
        sampledPaths[topKey] = samplePathSegment(horizontalSegments[row][col]);
    }
    if (!sampledPaths[rightKey]) {
        sampledPaths[rightKey] = samplePathSegment(verticalSegments[col + 1][row]);
    }
    if (!sampledPaths[bottomKey]) {
        sampledPaths[bottomKey] = samplePathSegment(horizontalSegments[row + 1][col]);
    }
    if (!sampledPaths[leftKey]) {
        sampledPaths[leftKey] = samplePathSegment(verticalSegments[col][row]);
    }
    
    const topPath = sampledPaths[topKey];
    const rightPath = sampledPaths[rightKey];
    const bottomPath = sampledPaths[bottomKey];
    const leftPath = sampledPaths[leftKey];
    
    // 교차점 가져오기
    const topLeftKey = `${row}_${col}`;
    const topRightKey = `${row}_${col + 1}`;
    const bottomRightKey = `${row + 1}_${col + 1}`;
    const bottomLeftKey = `${row + 1}_${col}`;
    
    if (!intersections[topLeftKey] || !intersections[topRightKey] || 
        !intersections[bottomRightKey] || !intersections[bottomLeftKey]) {
        // 교차점이 없으면 계산
        const allInters = findAllIntersections(tileSize);
        Object.assign(intersections, allInters);
    }
    
    const topLeft = intersections[topLeftKey] || { x: col * tileSize, y: row * tileSize };
    const topRight = intersections[topRightKey] || { x: (col + 1) * tileSize, y: row * tileSize };
    const bottomRight = intersections[bottomRightKey] || { x: (col + 1) * tileSize, y: (row + 1) * tileSize };
    const bottomLeft = intersections[bottomLeftKey] || { x: col * tileSize, y: (row + 1) * tileSize };
    
    // 경계 Path 구성
    const boundaryPath = [];
    
    // 상단 경계선 (왼쪽 교차점에서 오른쪽 교차점까지)
    const topSegment = extractPathBetweenIntersections(topPath, topLeft, topRight, true);
    boundaryPath.push(...topSegment.slice(0, -1)); // 마지막 점은 다음 세그먼트에서 추가
    
    // 우측 경계선 (위쪽 교차점에서 아래쪽 교차점까지)
    const rightSegment = extractPathBetweenIntersections(rightPath, topRight, bottomRight, false);
    boundaryPath.push(...rightSegment.slice(0, -1));
    
    // 하단 경계선 (오른쪽 교차점에서 왼쪽 교차점까지, 역순)
    const bottomPathReversed = [...bottomPath].reverse();
    const bottomSegment = extractPathBetweenIntersections(bottomPathReversed, bottomRight, bottomLeft, true);
    boundaryPath.push(...bottomSegment.slice(0, -1));
    
    // 좌측 경계선 (아래쪽 교차점에서 위쪽 교차점까지, 역순)
    const leftPathReversed = [...leftPath].reverse();
    const leftSegment = extractPathBetweenIntersections(leftPathReversed, bottomLeft, topLeft, false);
    boundaryPath.push(...leftSegment.slice(0, -1));
    
    // 닫힌 경로로 만들기
    boundaryPath.push({ x: topLeft.x, y: topLeft.y });
    
    return boundaryPath;
}

// ==================== SVG clipPath 적용 ====================

// SVG clipPath로 퍼즐 조각 적용
function applyPieceClipPath(piece, row, col, tileSize) {
    const clipId = `clip-${row}-${col}`;
    
    // 기존 clipPath가 있으면 제거
    const existingClip = document.getElementById(clipId);
    if (existingClip) {
        existingClip.remove();
    }
    
    // SVG 요소 생성 (없으면)
    let svg = document.getElementById('puzzle-clip-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'puzzle-clip-svg');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.style.overflow = 'hidden';
        document.body.appendChild(svg);
    }
    
    let defs = svg.querySelector('defs');
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
    }
    
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', clipId);
    // 사용자 좌표계 사용 (픽셀 단위)
    clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
    
    // 조각의 경계 Path 생성
    const boundaryPath = buildPieceBoundaryPath(row, col, tileSize);
    piece._boundaryPath = boundaryPath; // 스냅 시 참조용
    
    // 경계선의 실제 bounding box 계산 (정수 픽셀로 정렬)
    const minX = Math.floor(Math.min(...boundaryPath.map(p => p.x)));
    const minY = Math.floor(Math.min(...boundaryPath.map(p => p.y)));
    const maxX = Math.ceil(Math.max(...boundaryPath.map(p => p.x)));
    const maxY = Math.ceil(Math.max(...boundaryPath.map(p => p.y)));

    // 조각의 실제 크기 (경계선이 타일 크기를 넘어갈 수 있음, 정수 픽셀)
    const pieceWidth = Math.round(maxX - minX);
    const pieceHeight = Math.round(maxY - minY);
    
    // SVG path 생성 (로컬 좌표계: minX/minY를 원점으로)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = '';
    
    // 첫 번째 점으로 이동
    if (boundaryPath.length > 0) {
        const startX = boundaryPath[0].x - minX;
        const startY = boundaryPath[0].y - minY;
        pathData += `M ${startX} ${startY}`;
        
        // 나머지 점들을 선으로 연결
        for (let i = 1; i < boundaryPath.length; i++) {
            const nx = boundaryPath[i].x - minX;
            const ny = boundaryPath[i].y - minY;
            pathData += ` L ${nx} ${ny}`;
        }
        
        pathData += ' Z'; // 닫기
    }
    
    path.setAttribute('d', pathData);
    clipPath.appendChild(path);
    defs.appendChild(clipPath);
    
    // clipPath 적용
    piece.style.clipPath = `url(#${clipId})`;
    
    // 조각의 위치와 크기: 실제 bounding box 크기 사용 (정수 픽셀)
    piece.style.width = `${Math.round(pieceWidth)}px`;
    piece.style.height = `${Math.round(pieceHeight)}px`;

    // 배경 이미지 위치 조정 (경계선의 minX/minY 기준, 정수 픽셀)
    // 원본 보드 좌표 0,0에 맞추려면 -minX, -minY로 배경을 이동
    const bgX = Math.round(-minX);
    const bgY = Math.round(-minY);
    piece.style.backgroundPosition = `${bgX}px ${bgY}px`;

    // 2x2 디버깅 로그: 조각의 경계 박스와 배경 정렬 정보
    if (ROWS === 2 && COLS === 2) {
        console.log(`🧩 [2x2] 클립 적용 r${row} c${col}`, {
            tileOriginX: col * tileSize,
            tileOriginY: row * tileSize,
            minX,
            minY,
            maxX,
            maxY,
            pieceWidth,
            pieceHeight,
            tileSize,
            bgX,
            bgY,
            boundaryPath
        });
    }
}

// ==================== 디버그 비주얼라이제이션 ====================

// 경로를 고정 간격으로 재샘플링하는 함수
function resamplePath(path, step = 3) {
    if (!path || path.length < 2) return path;
    
    const resampled = [];
    resampled.push(path[0]);
    
    for (let i = 0; i < path.length - 1; i++) {
        const p0 = path[i];
        const p1 = path[i + 1];
        const length = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const numSamples = Math.max(1, Math.floor(length / step));
        
        for (let j = 1; j <= numSamples; j++) {
            const t = j / (numSamples + 1);
            resampled.push({
                x: p0.x + t * (p1.x - p0.x),
                y: p0.y + t * (p1.y - p0.y)
            });
        }
        
        if (i < path.length - 2) {
            resampled.push(p1);
        }
    }
    
    resampled.push(path[path.length - 1]);
    return resampled;
}

function drawPolyline(ctx, points, color = 'rgba(255,0,0,0.7)', width = 2, close = false) {
    if (!points || points.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    if (close) ctx.closePath();
    ctx.stroke();
}

// 선 표시 상태 저장
let lineVisibilityState = {
    horizontal: {},
    vertical: {}
};

// 체크박스 컨트롤 생성
function createLineControls() {
    const horizontalControls = document.getElementById('horizontal-lines-controls');
    const verticalControls = document.getElementById('vertical-lines-controls');
    
    horizontalControls.innerHTML = '';
    verticalControls.innerHTML = '';
    
    // 가로선 체크박스 생성
    for (let j = 0; j <= ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
            const key = `h_${j}_${i}`;
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '5px';
            label.style.fontSize = '0.85rem';
            label.style.cursor = 'pointer';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${key}`;
            checkbox.checked = lineVisibilityState.horizontal[key] !== false; // 기본값 true
            checkbox.addEventListener('change', () => {
                lineVisibilityState.horizontal[key] = checkbox.checked;
                redrawDebugCanvas();
            });
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`가로 ${j}-${i}`));
            horizontalControls.appendChild(label);
        }
    }
    
    // 세로선 체크박스 생성
    for (let i = 0; i <= COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
            const key = `v_${i}_${j}`;
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '5px';
            label.style.fontSize = '0.85rem';
            label.style.cursor = 'pointer';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${key}`;
            checkbox.checked = lineVisibilityState.vertical[key] !== false; // 기본값 true
            checkbox.addEventListener('change', () => {
                lineVisibilityState.vertical[key] = checkbox.checked;
                redrawDebugCanvas();
            });
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`세로 ${i}-${j}`));
            verticalControls.appendChild(label);
        }
    }
}

// 캔버스 다시 그리기
function redrawDebugCanvas() {
    if (!currentImage) return;
    
    const boardSize = getBoardSize();
    const tileSize = boardSize / COLS;
    
    const canvas = debugVisualizeCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = boardSize;
    canvas.height = boardSize;
    ctx.clearRect(0, 0, boardSize, boardSize);
    
    const img = new Image();
    img.onload = () => {
        // 배경 이미지
        ctx.drawImage(img, 0, 0, boardSize, boardSize);
        
        // 수평 경계선 (파란색, 2px, 투명도 30%) - 행 단위로 병합하여 연속성을 확보
        ctx.lineWidth = 2;
        for (let j = 0; j <= ROWS; j++) {
            // 한 행의 모든 가로선 제어점을 먼저 병합
            const mergedControlPoints = [];
            let hasVisibleSegment = false;
            
            // 가로 1-1 디버깅
            if (j === 1) {
                console.log(`\n========== 가로선 행 ${j} 처리 시작 ==========`);
            }
            
            for (let i = 0; i < COLS; i++) {
                const key = `h_${j}_${i}`;
                
                // 가로 1-1 디버깅
                if (j === 1 && i === 1) {
                    console.log(`\n--- 가로 ${j}-${i} (key: ${key}) 처리 ---`);
                    console.log(`체크박스 상태:`, lineVisibilityState.horizontal[key]);
                    console.log(`원본 세그먼트 제어점:`, horizontalSegments[j][i]);
                    console.log(`제어점 개수:`, horizontalSegments[j][i].length);
                    console.log(`시작점:`, horizontalSegments[j][i][0]);
                    console.log(`끝점:`, horizontalSegments[j][i][horizontalSegments[j][i].length - 1]);
                    
                    if (sampledPaths[key]) {
                        console.log(`캐시된 샘플링 경로:`, sampledPaths[key]);
                        console.log(`샘플링 경로 점 개수:`, sampledPaths[key].length);
                    }
                }
                
                if (lineVisibilityState.horizontal[key] !== false) {
                    hasVisibleSegment = true;
                    const segment = horizontalSegments[j][i];
                    
                    if (mergedControlPoints.length === 0) {
                        // 첫 번째 세그먼트: 모든 제어점 추가
                        mergedControlPoints.push(...segment);
                        
                        if (j === 1 && i === 1) {
                            console.log(`첫 번째 세그먼트로 추가됨`);
                            console.log(`병합된 제어점:`, mergedControlPoints);
                        }
                    } else {
                        // 이전 세그먼트의 마지막 점과 현재 세그먼트의 첫 점이 일치하도록 보장
                        const prevLast = mergedControlPoints[mergedControlPoints.length - 1];
                        const currFirst = segment[0];
                        const distance = Math.hypot(prevLast.x - currFirst.x, prevLast.y - currFirst.y);
                        
                        if (j === 1 && i === 1) {
                            console.log(`이전 세그먼트 마지막 점:`, prevLast);
                            console.log(`현재 세그먼트 첫 점:`, currFirst);
                            console.log(`두 점 사이 거리:`, distance);
                        }
                        
                        // 첫 점은 제외하고 나머지 제어점들만 추가
                        mergedControlPoints.push(...segment.slice(1));
                        
                        if (j === 1 && i === 1) {
                            console.log(`병합 후 제어점:`, mergedControlPoints);
                            console.log(`병합된 제어점 개수:`, mergedControlPoints.length);
                        }
                    }
                } else {
                    // 체크박스가 해제된 세그먼트가 있으면 여기서 경로를 끊고 새로 시작
                    if (mergedControlPoints.length > 0) {
                        const mergedPath = samplePathSegment(mergedControlPoints, 3);
                        
                        if (j === 1) {
                            console.log(`가로 ${j}-${i} 체크박스 해제로 경로 끊김`);
                            console.log(`끊기기 전 병합된 제어점 개수:`, mergedControlPoints.length);
                            console.log(`샘플링된 경로 점 개수:`, mergedPath.length);
                        }
                        
                        if (mergedPath.length > 1) {
                            drawPolyline(ctx, mergedPath, 'rgba(0, 122, 255, 0.3)', 2);
                        }
                        mergedControlPoints.length = 0;
                    }
                }
            }
            
            // 마지막으로 남은 경로 그리기 (병합된 제어점을 한 번에 샘플링)
            if (mergedControlPoints.length > 0 && hasVisibleSegment) {
                if (j === 1) {
                    console.log(`\n--- 행 ${j} 최종 병합 및 샘플링 ---`);
                    console.log(`최종 병합된 제어점 개수:`, mergedControlPoints.length);
                    console.log(`병합된 제어점:`, mergedControlPoints);
                }
                
                const mergedPath = samplePathSegment(mergedControlPoints, 3);
                
                if (j === 1) {
                    console.log(`샘플링된 경로 점 개수:`, mergedPath.length);
                    console.log(`샘플링된 경로 (처음 5개):`, mergedPath.slice(0, 5));
                    console.log(`샘플링된 경로 (마지막 5개):`, mergedPath.slice(-5));
                    console.log(`그려질 선분 개수:`, mergedPath.length - 1);
                }
                
                if (mergedPath.length > 1) {
                    drawPolyline(ctx, mergedPath, 'rgba(0, 122, 255, 0.3)', 2);
                    
                    if (j === 1) {
                        console.log(`✅ 행 ${j} 가로선 그리기 완료`);
                    }
                }
            }
            
            if (j === 1) {
                console.log(`========== 가로선 행 ${j} 처리 완료 ==========\n`);
            }
        }
        
        // 수직 경계선 (빨간색, 2px, 투명도 30%) - 열 단위로 병합하여 연속성을 확보
        for (let i = 0; i <= COLS; i++) {
            // 한 열의 모든 세로선 제어점을 먼저 병합
            const mergedControlPoints = [];
            let hasVisibleSegment = false;
            
            for (let j = 0; j < ROWS; j++) {
                const key = `v_${i}_${j}`;
                if (lineVisibilityState.vertical[key] !== false) {
                    hasVisibleSegment = true;
                    const segment = verticalSegments[i][j];
                    if (mergedControlPoints.length === 0) {
                        // 첫 번째 세그먼트: 모든 제어점 추가
                        mergedControlPoints.push(...segment);
                    } else {
                        // 이전 세그먼트의 마지막 점과 현재 세그먼트의 첫 점이 일치하도록 보장
                        // 첫 점은 제외하고 나머지 제어점들만 추가
                        mergedControlPoints.push(...segment.slice(1));
                    }
                } else {
                    // 체크박스가 해제된 세그먼트가 있으면 여기서 경로를 끊고 새로 시작
                    if (mergedControlPoints.length > 0) {
                        const mergedPath = samplePathSegment(mergedControlPoints, 3);
                        if (mergedPath.length > 1) {
                            drawPolyline(ctx, mergedPath, 'rgba(255, 59, 48, 0.3)', 2);
                        }
                        mergedControlPoints.length = 0;
                    }
                }
            }
            
            // 마지막으로 남은 경로 그리기 (병합된 제어점을 한 번에 샘플링)
            if (mergedControlPoints.length > 0 && hasVisibleSegment) {
                const mergedPath = samplePathSegment(mergedControlPoints, 3);
                if (mergedPath.length > 1) {
                    drawPolyline(ctx, mergedPath, 'rgba(255, 59, 48, 0.3)', 2);
                }
            }
        }
        
        // 조각 경계 Path (보라색, 3px, 투명도 30%)
        if (piecePathsVisible) {
            ctx.lineWidth = 3;
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const boundary = buildPieceBoundaryPath(r, c, tileSize);
                    // 실제 조각과 동일한 경계선 사용 (resamplePath 제거)
                    drawPolyline(ctx, boundary, 'rgba(138, 43, 226, 0.3)', 3, true);
                }
            }
        }
    };
    img.src = currentImage;
}

function renderDebugVisualization() {
    if (!currentImage) {
        alert('먼저 퍼즐을 시작하거나 이미지를 선택하세요.');
        return;
    }

    const boardSize = getBoardSize();
    const tileSize = boardSize / COLS;

    // 이미 생성된 경계선을 재사용 (랜덤 재생성 방지)
    if (!verticalSegments.length || !horizontalSegments.length) {
        generatePuzzleBoundaries(tileSize);
    }

    // 샘플링된 경로 캐시 초기화 (3px 간격으로 재샘플링하기 위해)
    sampledPaths = {};

    // 모든 경계선을 3px 간격으로 샘플링 (재사용)
    for (let j = 0; j <= ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
            const key = `h_${j}_${i}`;
            sampledPaths[key] = samplePathSegment(horizontalSegments[j][i], 3);
            if (lineVisibilityState.horizontal[key] === undefined) {
                lineVisibilityState.horizontal[key] = true;
            }
        }
    }
    for (let i = 0; i <= COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
            const key = `v_${i}_${j}`;
            sampledPaths[key] = samplePathSegment(verticalSegments[i][j], 3);
            if (lineVisibilityState.vertical[key] === undefined) {
                lineVisibilityState.vertical[key] = true;
            }
        }
    }
    
    // 현재 경계선 기반으로 교차점 재계산
    intersections = findAllIntersections(tileSize);
    
    // 체크박스 컨트롤 생성
    createLineControls();
    
    // 전체 선택/해제 버튼 이벤트 리스너
    const selectAllBtn = document.getElementById('select-all-lines');
    const deselectAllBtn = document.getElementById('deselect-all-lines');
    const togglePiecePaths = document.getElementById('toggle-piece-paths');
    
    if (selectAllBtn) {
        selectAllBtn.onclick = () => {
            for (let key in lineVisibilityState.horizontal) {
                lineVisibilityState.horizontal[key] = true;
                const checkbox = document.getElementById(`checkbox-${key}`);
                if (checkbox) checkbox.checked = true;
            }
            for (let key in lineVisibilityState.vertical) {
                lineVisibilityState.vertical[key] = true;
                const checkbox = document.getElementById(`checkbox-${key}`);
                if (checkbox) checkbox.checked = true;
            }
            redrawDebugCanvas();
        };
    }
    
    if (deselectAllBtn) {
        deselectAllBtn.onclick = () => {
            for (let key in lineVisibilityState.horizontal) {
                lineVisibilityState.horizontal[key] = false;
                const checkbox = document.getElementById(`checkbox-${key}`);
                if (checkbox) checkbox.checked = false;
            }
            for (let key in lineVisibilityState.vertical) {
                lineVisibilityState.vertical[key] = false;
                const checkbox = document.getElementById(`checkbox-${key}`);
                if (checkbox) checkbox.checked = false;
            }
            redrawDebugCanvas();
        };

    if (togglePiecePaths) {
        togglePiecePaths.onchange = (e) => {
            piecePathsVisible = e.target.checked;
            redrawDebugCanvas();
        };
    }
    }
    
    // 캔버스 그리기
    redrawDebugCanvas();
    
    debugVisualizePopup.classList.remove('hidden');
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

    // 2x2 디버깅용: 드롭존 정보 로그
    if (ROWS === 2 && COLS === 2) {
        requestAnimationFrame(() => {
            const boardRect = board.getBoundingClientRect();
            console.log('🟦 [2x2] 보드 rect', {
                width: boardRect.width,
                height: boardRect.height,
                left: boardRect.left,
                top: boardRect.top
            });
            dropZones.forEach((zone, idx) => {
                const r = zone.getBoundingClientRect();
                console.log(`⬜ [2x2] 드롭존 ${idx} (row ${zone.dataset.row}, col ${zone.dataset.col})`, {
                    width: r.width,
                    height: r.height,
                    left: r.left,
                    top: r.top
                });
            });
        });
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

    // 퍼즐 경계선 생성 (곡선 경계선)
    generatePuzzleBoundaries(tileSize);
    
    // 모든 교차점 계산
    const allInters = findAllIntersections(tileSize);
    Object.assign(intersections, allInters);

    for (let i = 0; i < ROWS * COLS; i++) {
        const piece = document.createElement('div');
        piece.classList.add('piece');

        const r = Math.floor(i / COLS);
        const c = i % COLS;

        // Background image 설정
        piece.style.backgroundImage = `url('${imagePath}')`;
        piece.style.backgroundSize = `${boardSize}px ${boardSize}px`;
        piece.style.backgroundRepeat = 'no-repeat';

        piece.dataset.value = i;
        piece.dataset.row = r;
        piece.dataset.col = c;

        // 곡선 경계선 적용
        applyPieceClipPath(piece, r, c, tileSize);

        // 2x2 디버깅: 조각의 크기/배경 정렬 정보
        if (ROWS === 2 && COLS === 2) {
            console.log(`🧷 [2x2] 조각 생성 value ${i} (r${r},c${c})`, {
                tileSize,
                pieceSize: { width: piece.style.width, height: piece.style.height },
                bgSize: piece.style.backgroundSize,
                bgPos: piece.style.backgroundPosition
            });
        }

        // Add Drag Events
        addDragLogic(piece);

        gameArea.appendChild(piece);
        pieces.push(piece);
    }
    
    // 디버깅: 조각이 제대로 생성되었는지 확인
    console.log(`조각 ${pieces.length}개 생성 완료 (곡선 경계선 적용)`);
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

        // 2x2 디버깅: 흩뿌리기 위치 로그
        if (ROWS === 2 && COLS === 2) {
            const pieceRect = piece.getBoundingClientRect();
            console.log(`🌀 [2x2] scatter 위치 piece ${piece.dataset.value}`, {
                left: piece.style.left,
                top: piece.style.top,
                rect: {
                    width: pieceRect.width,
                    height: pieceRect.height,
                    left: pieceRect.left,
                    top: pieceRect.top
                }
            });
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

    // Find if the center is within the CORRECT drop zone
    // 조각은 자신의 올바른 위치에만 스냅됨 (더 현실적인 게임플레이)
    let droppedZone = null;
    const pieceVal = parseInt(piece.dataset.value);
    const correctZone = dropZones[pieceVal]; // 이 조각이 속해야 하는 올바른 zone

    if (correctZone) {
        const zoneRect = correctZone.getBoundingClientRect();
        const zoneCenter = {
            x: zoneRect.left + zoneRect.width / 2,
            y: zoneRect.top + zoneRect.height / 2
        };

        // 올바른 zone과의 거리 체크
        const dist = Math.hypot(pieceCenter.x - zoneCenter.x, pieceCenter.y - zoneCenter.y);
        const tileSize = getTileSize();

        // 스냅 거리를 타일 크기의 1/3로 제한 (더 정확한 배치 요구)
        // 예: 100px 타일 -> 약 33px 이내에서만 스냅
        const snapThreshold = tileSize / 3;

        // 올바른 위치 근처에 있을 때만 스냅
        if (dist < snapThreshold) {
            droppedZone = correctZone;
        }
    }

    if (droppedZone) {
        snapToZone(piece, droppedZone);
    }
}

function snapToZone(piece, zone) {
    // We need to calculate the relative position of the zone within the gameArea
    // Since piece is absolute inside gameArea
    const gameAreaRect = gameArea.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();
    
    // 조각의 경계선 정보 가져오기
    const boundaryPath = piece._boundaryPath;
    if (!boundaryPath || boundaryPath.length === 0) {
        // 경계선이 없으면 기본 스냅 (정수 픽셀로 반올림)
        const relativeLeft = Math.round(zoneRect.left - gameAreaRect.left);
        const relativeTop = Math.round(zoneRect.top - gameAreaRect.top);
        piece.style.left = `${relativeLeft}px`;
        piece.style.top = `${relativeTop}px`;
    } else {
        // 조각의 경계선 bounding box 계산 (정수 픽셀로 정렬)
        const minX = Math.floor(Math.min(...boundaryPath.map(p => p.x)));
        const minY = Math.floor(Math.min(...boundaryPath.map(p => p.y)));
        
        // 타일의 원점 계산
        const tileSize = getTileSize();
        const row = parseInt(zone.dataset.row);
        const col = parseInt(zone.dataset.col);
        const tileOriginX = col * tileSize;
        const tileOriginY = row * tileSize;

        // 이미지의 타일 원점이 zone 위치에 오도록 offset 계산
        // backgroundPosition = (-minX, -minY)이므로
        // 이미지 타일 원점은 조각 내부의 (tileOriginX - minX, tileOriginY - minY) 위치
        // 이 지점이 zone에 오려면: piece.left = zone.left - (tileOriginX - minX)
        const offsetX = minX - tileOriginX;
        const offsetY = minY - tileOriginY;
        
        // 드롭존의 왼쪽 상단 위치에 offset을 더함 (정수 픽셀로 반올림)
        const relativeLeft = Math.round((zoneRect.left - gameAreaRect.left) + offsetX);
        const relativeTop = Math.round((zoneRect.top - gameAreaRect.top) + offsetY);

        piece.style.left = `${relativeLeft}px`;
        piece.style.top = `${relativeTop}px`;
    }

    // Store where the piece is dropped
    piece.dataset.currentZoneIndex = zone.dataset.expected;

    checkWin();

    // 2x2 디버깅: 스냅 결과 로그
    if (ROWS === 2 && COLS === 2) {
        const pieceRect = piece.getBoundingClientRect();
        const boundaryPath = piece._boundaryPath;
        let snapInfo = {
            zoneExpected: zone.dataset.expected,
            zoneRow: zone.dataset.row,
            zoneCol: zone.dataset.col,
            pieceRect: {
                left: pieceRect.left,
                top: pieceRect.top,
                width: pieceRect.width,
                height: pieceRect.height
            },
            zoneRect: {
                left: zoneRect.left,
                top: zoneRect.top,
                width: zoneRect.width,
                height: zoneRect.height
            },
            style: {
                left: piece.style.left,
                top: piece.style.top,
                width: piece.style.width,
                height: piece.style.height,
                backgroundPosition: piece.style.backgroundPosition
            }
        };
        
        if (boundaryPath && boundaryPath.length > 0) {
            const minX = Math.min(...boundaryPath.map(p => p.x));
            const minY = Math.min(...boundaryPath.map(p => p.y));
            const tileSize = getTileSize();
            const row = parseInt(zone.dataset.row);
            const col = parseInt(zone.dataset.col);
            const tileOriginX = col * tileSize;
            const tileOriginY = row * tileSize;
            snapInfo.boundaryInfo = {
                minX,
                minY,
                tileOriginX,
                tileOriginY,
                offsetX: tileOriginX - minX,
                offsetY: tileOriginY - minY
            };
            snapInfo.boundaryPath = boundaryPath;
        }
        
        console.log(`📌 [2x2] 스냅 완료 piece ${piece.dataset.value}`, snapInfo);
    }
}

function checkWin() {
    let correctCount = 0;

    pieces.forEach(piece => {
        const pieceVal = parseInt(piece.dataset.value);

        // Get current piece position
        const pieceLeft = Math.round(parseFloat(piece.style.left));
        const pieceTop = Math.round(parseFloat(piece.style.top));

        // Find expected zone
        const expectedZone = dropZones[pieceVal]; // The zone that this piece BELONGS to

        // Calculate expected position using the SAME logic as snapToZone
        const gameAreaRect = gameArea.getBoundingClientRect();
        const zoneRect = expectedZone.getBoundingClientRect();

        // 조각의 경계선 정보로 정확한 예상 위치 계산
        const boundaryPath = piece._boundaryPath;
        let expectedLeft, expectedTop;

        if (!boundaryPath || boundaryPath.length === 0) {
            // 경계선이 없으면 기본 위치
            expectedLeft = Math.round(zoneRect.left - gameAreaRect.left);
            expectedTop = Math.round(zoneRect.top - gameAreaRect.top);
        } else {
            // snapToZone과 동일한 계산 로직 사용
            const minX = Math.floor(Math.min(...boundaryPath.map(p => p.x)));
            const minY = Math.floor(Math.min(...boundaryPath.map(p => p.y)));

            const tileSize = getTileSize();
            const row = parseInt(expectedZone.dataset.row);
            const col = parseInt(expectedZone.dataset.col);
            const tileOriginX = col * tileSize;
            const tileOriginY = row * tileSize;

            const offsetX = minX - tileOriginX;
            const offsetY = minY - tileOriginY;

            expectedLeft = Math.round((zoneRect.left - gameAreaRect.left) + offsetX);
            expectedTop = Math.round((zoneRect.top - gameAreaRect.top) + offsetY);
        }

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
    uploadedImageFileName = '';
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
        uploadedImageFileName = file.name; // 파일명 저장
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
        // 업로드된 이미지를 Data URL로 사용 (게임에는 Data URL 사용)
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

// 힌트 버튼 - 잘못 배치된 조각 표시
if (hintBtn) {
    hintBtn.addEventListener('click', showHint);
}

function showHint() {
    let correctCount = 0;
    let incorrectPieces = [];

    pieces.forEach(piece => {
        const pieceVal = parseInt(piece.dataset.value);
        const pieceLeft = Math.round(parseFloat(piece.style.left));
        const pieceTop = Math.round(parseFloat(piece.style.top));

        const expectedZone = dropZones[pieceVal];
        const gameAreaRect = gameArea.getBoundingClientRect();
        const zoneRect = expectedZone.getBoundingClientRect();

        // snapToZone과 동일한 계산 로직 사용
        const boundaryPath = piece._boundaryPath;
        let expectedLeft, expectedTop;

        if (!boundaryPath || boundaryPath.length === 0) {
            expectedLeft = Math.round(zoneRect.left - gameAreaRect.left);
            expectedTop = Math.round(zoneRect.top - gameAreaRect.top);
        } else {
            const minX = Math.floor(Math.min(...boundaryPath.map(p => p.x)));
            const minY = Math.floor(Math.min(...boundaryPath.map(p => p.y)));

            const tileSize = getTileSize();
            const row = parseInt(expectedZone.dataset.row);
            const col = parseInt(expectedZone.dataset.col);
            const tileOriginX = col * tileSize;
            const tileOriginY = row * tileSize;

            const offsetX = minX - tileOriginX;
            const offsetY = minY - tileOriginY;

            expectedLeft = Math.round((zoneRect.left - gameAreaRect.left) + offsetX);
            expectedTop = Math.round((zoneRect.top - gameAreaRect.top) + offsetY);
        }

        const isCorrect = Math.abs(pieceLeft - expectedLeft) < 2 && Math.abs(pieceTop - expectedTop) < 2;

        // 조각 중심과 올바른 zone 중심 간의 실제 거리 계산 (스냅 감지와 동일한 방식)
        const pieceRect = piece.getBoundingClientRect();
        const pieceCenter = {
            x: pieceRect.left + pieceRect.width / 2,
            y: pieceRect.top + pieceRect.height / 2
        };
        const zoneCenterX = zoneRect.left + zoneRect.width / 2;
        const zoneCenterY = zoneRect.top + zoneRect.height / 2;
        const distanceToCorrectZone = Math.hypot(pieceCenter.x - zoneCenterX, pieceCenter.y - zoneCenterY);
        const tileSize = getTileSize();
        const snapThreshold = tileSize / 3;

        if (isCorrect) {
            correctCount++;
            // 올바른 조각: 초록색 테두리로 표시 (1초 후 제거)
            piece.style.border = '3px solid #4CAF50';
            piece.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.8)';
        } else {
            incorrectPieces.push({
                piece,
                pieceVal,
                current: { left: pieceLeft, top: pieceTop },
                expected: { left: expectedLeft, top: expectedTop },
                diff: {
                    left: pieceLeft - expectedLeft,
                    top: pieceTop - expectedTop
                },
                distanceToCorrectZone: distanceToCorrectZone,
                snapThreshold: snapThreshold,
                canSnap: distanceToCorrectZone < snapThreshold
            });
            // 잘못된 조각: 빨간색 테두리로 표시
            piece.style.border = '3px solid #f44336';
            piece.style.boxShadow = '0 0 15px rgba(244, 67, 54, 0.8)';
        }
    });

    // 메시지 표시
    const totalPieces = ROWS * COLS;
    if (correctCount === totalPieces) {
        messageEl.textContent = `🎉 완벽합니다! 모든 조각이 올바른 위치에 있습니다! (${correctCount}/${totalPieces})`;
        messageEl.style.color = '#4CAF50';
    } else {
        messageEl.textContent = `💡 힌트: ${correctCount}개 맞음, ${totalPieces - correctCount}개 틀림 (빨간색 테두리 = 잘못된 위치)`;
        messageEl.style.color = '#f44336';

        // 상세 로그 출력
        console.log('🔍 힌트 - 잘못 배치된 조각:', incorrectPieces);
        if (incorrectPieces.length > 0) {
            console.log(`📏 스냅 임계값: ${incorrectPieces[0].snapThreshold.toFixed(1)}px (타일 크기의 1/3)`);
        }
        incorrectPieces.forEach(info => {
            console.log(`조각 #${info.pieceVal}:`, {
                현재위치: `(${info.current.left}, ${info.current.top})`,
                올바른위치: `(${info.expected.left}, ${info.expected.top})`,
                위치차이: `(${info.diff.left}, ${info.diff.top})`,
                '중심간_거리': `${info.distanceToCorrectZone.toFixed(1)}px`,
                '스냅_임계값': `${info.snapThreshold.toFixed(1)}px`,
                '스냅가능': info.canSnap ? '✅ 예 (놓으면 자동으로 맞춰짐)' : `❌ 아니오 (${(info.distanceToCorrectZone - info.snapThreshold).toFixed(1)}px 더 가까이 놓아야 함)`
            });
        });
    }

    // 3초 후 테두리 제거
    setTimeout(() => {
        pieces.forEach(piece => {
            piece.style.border = '';
            piece.style.boxShadow = '';
        });
        messageEl.textContent = '';
    }, 3000);
}

// 경계선 검증 보기 버튼
if (debugVisualizeBtn) {
    debugVisualizeBtn.addEventListener('click', () => {
        renderDebugVisualization();
    });
}

if (debugVisualizeClose) {
    debugVisualizeClose.addEventListener('click', () => {
        debugVisualizePopup.classList.add('hidden');
    });
}

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
    
    // 현재 이미지 경로 결정: Data URL인 경우 파일명 사용
    let currentImagePath = currentImage;
    if (currentImage.startsWith('data:image/')) {
        currentImagePath = uploadedImageFileName || `uploaded_${Date.now()}.jpg`;
    }
    
    // 같은 이미지 경로의 게임 결과 필터링
    const sameImageResults = allHistory.filter(result => result.imagePath === currentImagePath);
    
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
    
    // 이미지 경로 결정: Data URL인 경우 파일명 사용, 아니면 원래 경로 사용
    let imagePathToSave = currentImage;
    if (currentImage.startsWith('data:image/')) {
        // Data URL인 경우 업로드된 파일명 사용
        imagePathToSave = uploadedImageFileName || `uploaded_${Date.now()}.jpg`;
    }
    
    // 게임 결과 데이터
    const gameResult = {
        id: Date.now(), // 고유 ID
        playerName: playerName || '익명',
        imagePath: imagePathToSave,
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
    // alert('게임 결과가 저장되었습니다!');
    
    // 콘솔에 저장된 모든 게임 결과 출력
    // console.log('=== 저장된 게임 결과 (전체) ===');
    // console.log('총 저장된 게임 수:', history.length);
    // console.log('저장된 게임 결과:', history);
    // console.log('==============================');
    
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
    // console.log('=== 저장된 게임 결과 (히스토리 표시 시) ===');
    // console.log('총 저장된 게임 수:', history.length);
    // if (history.length > 0) {
    //     console.log('저장된 게임 결과:', history);
    //     console.log('상세 정보:');
    //     history.forEach((result, index) => {
    //         console.log(`[${index + 1}]`, {
    //             이름: result.playerName,
    //             퍼즐크기: result.puzzleSize,
    //             완성시간: result.completionTimeFormatted,
    //             날짜: result.dateFormatted,
    //             이미지경로: result.imagePath
    //         });
    //     });
    // } else {
    //     console.log('저장된 게임 결과가 없습니다.');
    // }
    // console.log('==========================================');
    
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

