// Authoring Mode Logic

// --------------------------------------------------------
// Global Variables (DOM Elements & State)
// --------------------------------------------------------

// UI Elements (Initialized in initAuthoring)
let authoringView;
let authorMainImage;
let authorCanvasContainer;
let emptyCanvasState;
let authorImgUpload;
let authorStoryTitleInput;
let authorBackBtn;
let authorSaveStoryBtn;

// New Workflow Elements
let btnNewEpisode;
let authorToolbar;
let authorProperties;
let rubberBand;
let rubberBandPoly;
let drawingLayer;
let toolButtons;

// Episode Form Elements
let epNameInput;
let epIdInput;
let epRegionCoordsInput;
let epImgPreviewBox;
let epImgPreview;
let epImgUpload;
let btnEditEpisode;
let btnSaveEpisode;
let btnDeleteEpisode;
let btnCancelEpisode;

// State Variables
let editingStory = null;
let isEpisodeMode = false; // true when Creating New or Editing Existing
let isDrawing = false;
let currentTool = 'select'; // 'select', 'rect', 'circle', 'ellipse', 'path', 'brush', 'eraser'
let hasUnsavedChanges = false; // 변경사항 추적 플래그

// Interaction State
let selectedEpId = null; // Currently selected episode ID
let isDragging = false;
let isResizing = false;
let dragStartCoords = { x: 0, y: 0 };
let initialShapeData = null;
let activeHandle = null;
let polyPoints = [];
let pathPoints = []; // Path 그리기용 점 배열
let isPathDrawing = false; // Path 그리기 중인지
let brushSize = 10; // 붓 크기 (픽셀)
let eraserSize = 10; // 지우개 크기 (픽셀)

// Point Editing State (붓/지우개 모드에서 점 편집용)
let isDraggingPoint = false; // 점을 드래그 중인지
let draggingPointIndex = -1; // 드래그 중인 점의 인덱스
let pointDragStartCoords = { x: 0, y: 0 }; // 점 드래그 시작 좌표

// Current session state (Temp data for form)
let currentEpImagePreview = null;
let currentRegionData = null;

// --------------------------------------------------------
// Initialization
// --------------------------------------------------------

function initAuthoring() {
    // Initialize DOM References
    authoringView = document.getElementById('authoring-view');
    authorMainImage = document.getElementById('author-main-image');
    authorCanvasContainer = document.getElementById('author-canvas-container');
    emptyCanvasState = document.getElementById('empty-canvas-state');
    authorImgUpload = document.getElementById('author-img-upload');
    authorStoryTitleInput = document.getElementById('author-story-title-input');
    authorBackBtn = document.getElementById('author-back-btn');
    authorSaveStoryBtn = document.getElementById('author-save-story-btn');

    btnNewEpisode = document.getElementById('btn-new-episode');
    authorToolbar = document.getElementById('author-toolbar');
    authorProperties = document.getElementById('author-properties');
    rubberBand = document.getElementById('rubber-band');
    drawingLayer = document.getElementById('drawing-layer');

    // Tool Buttons
    if (authorToolbar) {
        toolButtons = authorToolbar.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                selectTool(tool);
            });
        });
    }

    // SVG Drawing Layer Setup
    if (drawingLayer && drawingLayer.tagName !== 'SVG') {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.id = "author-svg-layer";
        svg.setAttribute("viewBox", "0 0 100 100"); // 퍼센트 값 사용을 위한 viewBox 설정
        svg.setAttribute("preserveAspectRatio", "none"); // 비율 무시하고 전체 영역 사용
        drawingLayer.innerHTML = '';
        drawingLayer.appendChild(svg);
        drawingLayer = svg;
    } else if (drawingLayer && drawingLayer.tagName === 'SVG') {
        // 이미 SVG인 경우 viewBox가 없으면 설정
        if (!drawingLayer.getAttribute("viewBox")) {
            drawingLayer.setAttribute("viewBox", "0 0 100 100");
            drawingLayer.setAttribute("preserveAspectRatio", "none");
        }
    }

    // Polygon Preview Layer
    if (authorCanvasContainer && !document.getElementById('rubber-band-poly')) {
        rubberBandPoly = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        rubberBandPoly.id = 'rubber-band-poly';
        rubberBandPoly.classList.add('rubber-band-poly', 'hidden');
        rubberBandPoly.style.position = 'absolute';
        rubberBandPoly.style.top = '0';
        rubberBandPoly.style.left = '0';
        rubberBandPoly.style.width = '100%';
        rubberBandPoly.style.height = '100%';
        rubberBandPoly.style.pointerEvents = 'none';
        rubberBandPoly.style.zIndex = '20';
        authorCanvasContainer.appendChild(rubberBandPoly);
    } else {
        rubberBandPoly = document.getElementById('rubber-band-poly');
    }

    // Form Elements
    epNameInput = document.getElementById('ep-name');
    epIdInput = document.getElementById('ep-id');
    epRegionCoordsInput = document.getElementById('ep-region-coords');
    epImgPreviewBox = document.getElementById('ep-img-preview-box');
    epImgPreview = document.getElementById('ep-img-preview');
    epImgUpload = document.getElementById('ep-img-upload');

    // Panel Buttons
    btnEditEpisode = document.getElementById('btn-edit-episode');
    btnSaveEpisode = document.getElementById('btn-save-episode');
    btnDeleteEpisode = document.getElementById('btn-delete-episode');
    btnCancelEpisode = document.getElementById('btn-cancel-episode');

    // Navigation Events
    if (authorBackBtn) {
        // Remove old listener if exists to prevent duplicates (though Init usually runs once)
        authorBackBtn.removeEventListener('click', exitAuthoring);
        authorBackBtn.addEventListener('click', exitAuthoring);
    }
    if (authorSaveStoryBtn) authorSaveStoryBtn.addEventListener('click', saveStoryToStorage);

    // Title Events
    if (authorStoryTitleInput) {
        authorStoryTitleInput.addEventListener('input', (e) => {
            if (editingStory) {
                editingStory.title = e.target.value;
                hasUnsavedChanges = true; // 제목 변경 감지
            }
        });
    }

    // Image Upload Events
    if (emptyCanvasState) emptyCanvasState.addEventListener('click', () => authorImgUpload.click());
    if (authorImgUpload) authorImgUpload.addEventListener('change', handleMainImageUpload);

    // Workflow Events
    if (btnNewEpisode) btnNewEpisode.addEventListener('click', startNewEpisodeFlow);

    if (btnEditEpisode) btnEditEpisode.addEventListener('click', enterEditMode);
    if (btnSaveEpisode) btnSaveEpisode.addEventListener('click', saveEpisode);
    if (btnDeleteEpisode) btnDeleteEpisode.addEventListener('click', deleteEpisode);
    if (btnCancelEpisode) btnCancelEpisode.addEventListener('click', cancelEpisodeFlow);

    // Episode Image
    if (epImgPreviewBox) epImgPreviewBox.addEventListener('click', () => {
        if (isEpisodeMode) epImgUpload.click(); // Only allow upload in edit mode
    });
    if (epImgUpload) epImgUpload.addEventListener('change', handleEpisodeImageUpload);

    // Global Mouse Events
    if (authorCanvasContainer) {
        authorCanvasContainer.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        authorCanvasContainer.addEventListener('dragstart', (e) => e.preventDefault());

        // Double click 처리 (Path 완성용)
        authorCanvasContainer.addEventListener('dblclick', (e) => {
            if (isEpisodeMode && currentTool === 'path' && pathPoints.length >= 2) {
                const rect = authorCanvasContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                finalizePath(x, y);
            }
        });
    }
}

function selectTool(tool) {
    if (!isEpisodeMode) return; // Can only select tools in Edit/New Mode

    currentTool = tool;

    // Reset Drawing tool states
    isDrawing = false;
    polyPoints = [];
    pathPoints = [];
    isPathDrawing = false;
    isDraggingPoint = false;
    draggingPointIndex = -1;
    if (rubberBand) rubberBand.classList.add('hidden');
    if (rubberBandPoly) {
        rubberBandPoly.innerHTML = '';
        rubberBandPoly.classList.add('hidden');
    }

    // UI Update
    if (toolButtons) {
        toolButtons.forEach(btn => {
            if (btn.dataset.tool === tool) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    // 붓/지우개 모드 전환 시 점 핸들 렌더링을 위해 영역 다시 렌더링
    if (tool === 'brush' || tool === 'eraser' || tool === 'select') {
        renderExistingRegions();
    }
}

// Toolbar 버튼 표시/숨김 업데이트
function updateToolbarButtonVisibility() {
    if (!toolButtons) return;

    // 현재 선택된 에피소드의 shape 타입 확인
    let currentShape = null;
    if (selectedEpId && editingStory) {
        const ep = editingStory.episodes.find(e => e.id === selectedEpId);
        if (ep && ep.entryRegion && ep.entryRegion.shape) {
            currentShape = ep.entryRegion.shape;
        }
    }

    let shouldSwitchTool = false;

    // 붓과 지우개 버튼 찾기
    toolButtons.forEach(btn => {
        const tool = btn.dataset.tool;
        
        // 붓과 지우개는 Path 타입일 때만 표시
        if (tool === 'brush' || tool === 'eraser') {
            if (currentShape === 'path') {
                btn.classList.remove('hidden');
                btn.style.display = 'flex'; // 원래 display 속성으로 복원
            } else {
                btn.classList.add('hidden');
                btn.style.display = 'none';
                
                // 현재 선택된 도구가 brush/eraser인 경우 select로 변경 필요
                if (currentTool === tool) {
                    shouldSwitchTool = true;
                }
            }
        }
    });

    // 도구 전환이 필요한 경우 (무한 재귀 방지)
    if (shouldSwitchTool) {
        currentTool = 'select';
        if (toolButtons) {
            toolButtons.forEach(btn => {
                if (btn.dataset.tool === 'select') btn.classList.add('active');
                else btn.classList.remove('active');
            });
        }
    }
}

// --------------------------------------------------------
// Navigation Functions
// --------------------------------------------------------

function startAuthoring(story) {
    if (!authoringView) return;

    // 화면 전환
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('main-view').classList.add('hidden');
    authoringView.classList.remove('hidden');

    // 모든 상태 초기화 (중요!)
    resetUI();
    hasUnsavedChanges = false; // 변경사항 플래그 초기화

    // 파일 입력 초기화
    if (authorImgUpload) authorImgUpload.value = '';
    if (epImgUpload) epImgUpload.value = '';

    if (story) {
        // 기존 스토리 편집
        editingStory = JSON.parse(JSON.stringify(story)); // Deep copy
        if (authorStoryTitleInput) authorStoryTitleInput.value = editingStory.title;
        if (editingStory.mainImage) {
            setMainImage(editingStory.mainImage);
        } else {
            showEmptyState();
        }
        renderExistingRegions();
    } else {
        // 새로운 스토리 생성
        editingStory = {
            storyId: `story-${Date.now()}`,
            title: "새로운 이야기",
            mainImage: "",
            imageSize: { width: 0, height: 0 }, // 이미지 원본 크기 (픽셀)
            episodes: []
        };
        if (authorStoryTitleInput) authorStoryTitleInput.value = "새로운 이야기";
        showEmptyState();
    }
}

function exitAuthoring() {
    // 변경사항이 있을 때만 확인 메시지 표시
    if (hasUnsavedChanges && !confirm("저장하지 않은 내용은 사라집니다. 정말 나가시겠습니까?")) {
        return; // 사용자가 취소한 경우
    }

    // 화면 전환
    authoringView.classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');

    // 스토리 데이터 초기화
    editingStory = null;
    selectedEpId = null;
    hasUnsavedChanges = false;
    
    // 모든 상태 초기화
    resetUI();

    // localStorage에서 최신 story 정보를 다시 읽어오기
    if (window.loadLibrary) {
        window.loadLibrary();
    }

    // Dashboard를 다시 렌더링하여 최신 정보 표시
    if (window.renderDashboard) {
        window.renderDashboard();
    }
}

// --------------------------------------------------------
// UI State Management
// --------------------------------------------------------

function resetUI() {
    // 에피소드 및 그리기 상태 초기화
    isEpisodeMode = false;
    isDrawing = false;
    currentTool = 'select'; // Default
    
    // 점 데이터 초기화
    polyPoints = [];
    pathPoints = [];
    
    // 현재 영역 데이터 초기화 (중요!)
    currentRegionData = null;
    currentEpImagePreview = null;
    
    // 선택 및 드래그 상태 초기화
    selectedEpId = null;
    isDragging = false;
    isResizing = false;
    isPathDrawing = false;
    
    // 초기 shape 데이터 초기화
    initialShapeData = null;
    activeHandle = null;

    // UI 요소 숨김
    if (authorToolbar) authorToolbar.classList.add('hidden');
    if (authorProperties) authorProperties.classList.add('hidden');
    if (btnNewEpisode) btnNewEpisode.classList.add('hidden');

    // 그리기 관련 요소 숨김
    if (rubberBand) {
        rubberBand.classList.add('hidden');
        rubberBand.style.width = '0px';
        rubberBand.style.height = '0px';
    }
    if (rubberBandPoly) {
        rubberBandPoly.classList.add('hidden');
        rubberBandPoly.innerHTML = '';
    }
    
    // drawingLayer 초기화 (SVG 내부만)
    if (drawingLayer) {
        drawingLayer.innerHTML = '';
    }
    
    // Circle div들 제거
    if (authorCanvasContainer) {
        const circleDivs = authorCanvasContainer.querySelectorAll('.region-circle-div');
        circleDivs.forEach(div => div.remove());
        
        const circleHandles = authorCanvasContainer.querySelectorAll('.circle-resize-handle');
        circleHandles.forEach(handle => handle.remove());
    }
    
    // 폼 입력 초기화
    if (epNameInput) epNameInput.value = '';
    if (epIdInput) epIdInput.value = '';
    if (epRegionCoordsInput) epRegionCoordsInput.value = '';
    if (epImgPreview) {
        epImgPreview.src = '';
        epImgPreview.classList.add('hidden');
    }
}

function showEmptyState() {
    if (authorMainImage) {
        authorMainImage.src = "";
        authorMainImage.classList.add('hidden');
    }
    if (emptyCanvasState) emptyCanvasState.classList.remove('hidden');
}

function setMainImage(src) {
    if (authorMainImage) {
        authorMainImage.src = src;
        authorMainImage.classList.remove('hidden');
        
        // 이미지 로드 완료 시 원본 크기 저장
        authorMainImage.onload = () => {
            if (editingStory) {
                editingStory.imageSize = {
                    width: authorMainImage.naturalWidth,
                    height: authorMainImage.naturalHeight
                };
                console.log("Image size saved:", editingStory.imageSize);
            }
        };
    }
    if (emptyCanvasState) emptyCanvasState.classList.add('hidden');
    if (btnNewEpisode) btnNewEpisode.classList.remove('hidden');
}

// --------------------------------------------------------
// Workflow: Main Image Upload
// --------------------------------------------------------

function handleMainImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        setMainImage(e.target.result);
        if (editingStory) {
            editingStory.mainImage = `static/images/${file.name}`;
            hasUnsavedChanges = true; // 메인 이미지 변경 감지
        }
    };
    reader.readAsDataURL(file);
}

// --------------------------------------------------------
// Workflow: Episode Management
// --------------------------------------------------------

// 1. SELECT (View Mode) - 이제 바로 수정 모드로 진입
function onEpisodeSelected(epId) {
    selectedEpId = epId;

    // Populate Form
    const ep = editingStory.episodes.find(e => e.id === epId);
    if (!ep) return;

    populateForm(ep);

    // 바로 수정 모드로 진입
    enterEditMode();
    
    // 툴바 버튼 업데이트 (enterEditMode에서도 호출되지만 명확성을 위해)
    updateToolbarButtonVisibility();
}

// 2. CREATE NEW
function startNewEpisodeFlow() {
    isEpisodeMode = true;
    selectedEpId = null; // New ID will be generated

    // UI
    authorToolbar.classList.remove('hidden');
    authorProperties.classList.remove('hidden');
    btnNewEpisode.classList.add('hidden');

    // Buttons
    btnEditEpisode.classList.add('hidden');
    btnDeleteEpisode.classList.add('hidden');
    btnSaveEpisode.classList.remove('hidden');

    // Reset Form
    epNameInput.value = "";
    if (epIdInput) {
        const nextId = editingStory.episodes.length + 1;
        epIdInput.value = `ep${nextId}`;
    }
    epNameInput.readOnly = false;

    currentEpImagePreview = null;
    epImgPreview.src = "";
    epImgPreview.classList.add('hidden');

    currentRegionData = null;
    epRegionCoordsInput.value = "";

    selectTool('rect'); // Start with drawing rect
    renderExistingRegions();
    updateToolbarButtonVisibility(); // 새 에피소드 생성 시 붓/지우개 숨김
}

// 3. ENTER EDIT MODE
function enterEditMode() {
    if (!selectedEpId) return;
    isEpisodeMode = true;

    // Show Toolbar and Properties Panel
    authorToolbar.classList.remove('hidden');
    authorProperties.classList.remove('hidden');

    // Update Buttons
    btnEditEpisode.classList.add('hidden');
    btnSaveEpisode.classList.add('hidden'); // 기존 에피소드 수정 시에는 불필요 (실시간 반영)
    btnDeleteEpisode.classList.remove('hidden'); // Delete 버튼은 항상 표시 (수정 모드에서도 삭제 가능)
    btnNewEpisode.classList.remove('hidden'); // New Episode 버튼은 항상 표시

    // Allow Editing Form
    epNameInput.readOnly = false;

    // 에피소드 이름 입력 시 자동 저장
    epNameInput.removeEventListener('input', handleEpisodeNameChange);
    epNameInput.addEventListener('input', handleEpisodeNameChange);

    // Enable Interaction (Handles)
    renderExistingRegions();

    // Default tool to Select (to allow drag/resize immediately)
    selectTool('select');
    
    // Update toolbar button visibility based on shape type
    updateToolbarButtonVisibility();
}

// 에피소드 이름 변경 시 자동 저장
function handleEpisodeNameChange() {
    if (selectedEpId && epNameInput && epNameInput.value.trim()) {
        const existingEp = editingStory.episodes.find(e => e.id === selectedEpId);
        if (existingEp && existingEp.name !== epNameInput.value.trim()) {
            existingEp.name = epNameInput.value.trim();
            hasUnsavedChanges = true;
        }
    }
}

function cancelEpisodeFlow() {
    isEpisodeMode = false;
    authorToolbar.classList.add('hidden');
    authorProperties.classList.add('hidden');
    btnNewEpisode.classList.remove('hidden');

    // Cleanup drawing
    if (rubberBand) rubberBand.classList.add('hidden');
    if (rubberBandPoly) rubberBandPoly.classList.add('hidden');

    selectedEpId = null;
    renderExistingRegions();
}

// 수정 모드에서 선택 모드로 돌아가기 (저장 후)
function exitEditModeToSelection() {
    isEpisodeMode = false;

    // Toolbar 숨김
    authorToolbar.classList.add('hidden');

    // Properties 패널은 유지 (명시적으로 표시)
    authorProperties.classList.remove('hidden');

    // 버튼 상태 변경
    btnEditEpisode.classList.add('hidden'); // Edit 버튼 숨김 (이미 수정 모드였으므로)
    btnSaveEpisode.classList.add('hidden'); // Save 버튼 숨김 (불필요)
    btnDeleteEpisode.classList.remove('hidden'); // Delete 버튼 표시
    btnNewEpisode.classList.remove('hidden'); // New Episode 버튼 표시

    // Form을 읽기 전용으로 변경
    epNameInput.readOnly = true;

    // 선택된 에피소드 정보 다시 표시
    if (selectedEpId) {
        const ep = editingStory.episodes.find(e => e.id === selectedEpId);
        if (ep) {
            populateForm(ep);
        }
    }

    // 선택 상태로 렌더링 (핸들 없이)
    renderExistingRegions();
}

function handleEpisodeImageUpload(event) {
    if (!isEpisodeMode) return; // Should be blocked by UI but double check

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        currentEpImagePreview = e.target.result;
        epImgPreview.src = currentEpImagePreview;
        epImgPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    if (epImgUpload) epImgUpload.dataset.filename = file.name;
}

function deleteEpisode() {
    if (!selectedEpId) return;
    if (confirm("정말로 이 에피소드를 삭제하시겠습니까?")) {
        editingStory.episodes = editingStory.episodes.filter(e => e.id !== selectedEpId);
        hasUnsavedChanges = true; // 에피소드 삭제 감지
        cancelEpisodeFlow();
    }
}

// 기존 에피소드의 변경사항을 자동으로 저장 (다른 에피소드 선택 시 호출)
function autoSaveCurrentEpisode() {
    if (!selectedEpId) return;

    const existingEp = editingStory.episodes.find(e => e.id === selectedEpId);
    if (!existingEp) return;

    let hasChanges = false;

    // 이름 업데이트 (입력값이 있으면)
    if (epNameInput && epNameInput.value.trim() && existingEp.name !== epNameInput.value.trim()) {
        existingEp.name = epNameInput.value.trim();
        hasChanges = true;
    }

    // 새로 업로드한 이미지가 있으면 사용
    if (currentEpImagePreview) {
        const filename = (epImgUpload && epImgUpload.dataset.filename) || `ep_${selectedEpId}.png`;
        const imagePath = `static/images/${filename}`;
        if (existingEp.episodeImage !== imagePath) {
            existingEp.episodeImage = imagePath;
            hasChanges = true;
        }
    }

    // 새로 그린 영역이 있으면 업데이트
    if (currentRegionData) {
        existingEp.entryRegion = {
            shape: currentRegionData.shape,
            coords: currentRegionData.coords
        };
        hasChanges = true;
    }

    if (hasChanges) {
        hasUnsavedChanges = true;
    }
}

function saveEpisode() {
    // 새 에피소드 생성만 처리 (기존 에피소드는 자동 저장)

    if (!selectedEpId) {
        // 새 에피소드 생성 모드 - Validation
        const errors = [];

        // 1. 에피소드 이름 검증
        if (!epNameInput || !epNameInput.value || !epNameInput.value.trim()) {
            errors.push("에피소드 이름을 입력해주세요.");
        }

        // 2. 에피소드 이미지 검증
        const hasImage = currentEpImagePreview || (epImgPreview && epImgPreview.src && epImgPreview.src.trim() !== '');
        if (!hasImage) {
            errors.push("에피소드 이미지를 업로드해주세요.");
        }

        // 3. 선택 영역 검증
        if (!currentRegionData || !currentRegionData.shape || !currentRegionData.coords) {
            errors.push("진입 영역을 그려주세요.");
        } else {
            // 영역 데이터의 유효성 검증
            const coords = currentRegionData.coords;
            if (currentRegionData.shape === 'rect') {
                if (coords.x === undefined || coords.y === undefined ||
                    coords.width === undefined || coords.height === undefined ||
                    coords.width <= 0 || coords.height <= 0) {
                    errors.push("올바른 사각형 영역을 그려주세요.");
                }
            } else if (currentRegionData.shape === 'circle') {
                if (coords.cx === undefined || coords.cy === undefined ||
                    coords.r === undefined || coords.r <= 0) {
                    errors.push("올바른 원형 영역을 그려주세요.");
                }
            } else if (currentRegionData.shape === 'ellipse') {
                if (coords.cx === undefined || coords.cy === undefined ||
                    coords.rx === undefined || coords.ry === undefined ||
                    coords.rx <= 0 || coords.ry <= 0) {
                    errors.push("올바른 타원형 영역을 그려주세요.");
                }
            } else if (currentRegionData.shape === 'path') {
                const points = coords.points || [];
                if (!points || points.length < 2) {
                    errors.push("Path는 최소 2개 이상의 점이 필요합니다.");
                }
            }
        }

        // Validation 실패 시 에러 메시지 표시
        if (errors.length > 0) {
            alert("에피소드를 저장할 수 없습니다:\n\n" + errors.join("\n"));
            return;
        }

        const filename = (epImgUpload && epImgUpload.dataset.filename) || `ep_${epIdInput.value}.png`;
        const imagePath = `static/images/${filename}`;

        const newEp = {
            id: epIdInput.value,
            name: epNameInput.value,
            episodeImage: imagePath,
            entryRegion: {
                shape: currentRegionData.shape,
                coords: currentRegionData.coords
            }
        };

        editingStory.episodes.push(newEp);
        hasUnsavedChanges = true; // 에피소드 추가 감지

        // 새로 생성한 에피소드를 선택하고 선택 모드로 돌아가기 (New Episode 버튼 표시)
        selectedEpId = newEp.id;

        // 임시 데이터 초기화 (중복 렌더링 방지)
        currentRegionData = null;
        currentEpImagePreview = null;

        // 임시 그리기 요소 숨기기 (중요!)
        if (rubberBand) rubberBand.classList.add('hidden');
        if (rubberBandPoly) {
            rubberBandPoly.classList.add('hidden');
            rubberBandPoly.innerHTML = '';
        }

        // 선택 모드로 전환 (New Episode 버튼 표시)
        isEpisodeMode = false;

        // Toolbar 숨김
        authorToolbar.classList.add('hidden');

        // Properties 패널은 유지
        authorProperties.classList.remove('hidden');

        // 버튼 상태 변경
        btnEditEpisode.classList.add('hidden');
        btnSaveEpisode.classList.add('hidden');
        btnDeleteEpisode.classList.remove('hidden'); // Delete 버튼 표시
        btnNewEpisode.classList.remove('hidden'); // New Episode 버튼 표시 (중요!)

        // Form을 읽기 전용으로 변경
        epNameInput.readOnly = true;

        // 선택된 에피소드 정보 표시
        populateForm(newEp);

        // 선택 상태로 렌더링 (핸들 없이)
        renderExistingRegions();
    }
    // 기존 에피소드는 autoSaveCurrentEpisode로 자동 처리되므로 여기서는 처리하지 않음
}

function populateForm(ep) {
    if (epNameInput) epNameInput.value = ep.name;
    if (epIdInput) epIdInput.value = ep.id;
    if (epRegionCoordsInput) epRegionCoordsInput.value = JSON.stringify(ep.entryRegion.coords);

    // Image Preview
    if (ep.episodeImage && epImgPreview) {
        epImgPreview.src = ep.episodeImage; // path
        epImgPreview.classList.remove('hidden');
    }

    currentEpImagePreview = null; // Clear temp upload
    currentRegionData = null; // Clear temp draw
}

// --------------------------------------------------------
// Interaction Logic
// --------------------------------------------------------

function onMouseDown(e) {
    const rect = authorCanvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 0. Check Path Point Handle (붓/지우개 모드에서 점 편집)
    if (isEpisodeMode && selectedEpId && (currentTool === 'brush' || currentTool === 'eraser')) {
        // 점 추가 핸들 클릭 체크 (붓 모드에서만)
        const addPointHandle = e.target.closest('.path-add-point-handle');
        if (addPointHandle && currentTool === 'brush') {
            const epId = addPointHandle.dataset.epId;
            const insertAfterIndex = parseInt(addPointHandle.dataset.insertAfterIndex, 10);
            handleAddPointClick(e, epId, insertAfterIndex);
            return;
        }
        
        // 점 핸들 클릭 체크
        const pointHandle = e.target.closest('.path-point-handle');
        if (pointHandle) {
            const epId = pointHandle.dataset.epId;
            const pointIndex = parseInt(pointHandle.dataset.pointIndex, 10);
            
            if (currentTool === 'eraser') {
                // 지우개 모드: 점 삭제
                handlePointHandleClick(e, epId, pointIndex);
            } else if (currentTool === 'brush') {
                // 붓 모드: 점 드래그 시작
                startPointDrag(e, epId, pointIndex);
            }
            return;
        }
    }

    // 1. Check Handle (Resize) - ONLY if in Edit Mode
    if (isEpisodeMode && selectedEpId) {
        const handle = e.target.closest('.resize-handle');
        if (handle) {
            startResize(e, handle.dataset.handle);
            return;
        }
    }

    // 2. Check Region Click (path, polygon, rect, circle 등 모든 shape 지원)
    // Circle div 클릭 체크 (픽셀 단위 div로 렌더링된 원)
    let regionElement = e.target.closest('.region-circle-div');
    
    // SVG region-group 체크
    if (!regionElement) {
        regionElement = e.target.closest('g.region-group');
        if (!regionElement) {
            // path, polygon 등 직접 클릭한 경우 부모 group 찾기
            const pathElement = e.target.closest('path, polygon, rect, circle, ellipse');
            if (pathElement) {
                regionElement = pathElement.closest('g.region-group');
            }
        }
    }

    if (regionElement) {
        const epId = regionElement.dataset.epId;

        // Scenario A: Just selecting to view
        if (!isEpisodeMode) {
            onEpisodeSelected(epId);
            return;
        }

        // Scenario B: Already in Edit Mode
        // If we click THIS episode -> Drag?
        // If we click ANOTHER episode -> Switch selection (자동 저장)
        if (isEpisodeMode) {
            if (epId !== selectedEpId) {
                // 이전 에피소드의 변경사항 자동 저장 (이름, 이미지, 영역)
                if (selectedEpId) {
                    autoSaveCurrentEpisode();
                }
                onEpisodeSelected(epId);
                enterEditMode(); // 새 에피소드로 전환
                return;
            }

            // If clicked CURRENT episode -> Start Drag (select 도구일 때만)
            if (currentTool === 'select') {
                startDrag(e, epId);
                return;
            }
        }
    }

    // 3. Drawing Logic
    if (isEpisodeMode && ['rect', 'circle', 'ellipse', 'path'].includes(currentTool)) {
        if (currentTool === 'path') {
            handlePathClick(x, y);
        } else {
            startDrawingInternal(x, y);
        }
    } else {
        // Clicked Empty Space
        // If in Edit Mode -> Maybe finish? Or just Deselect?
        // If in View Mode -> Deselect
        if (!isEpisodeMode && selectedEpId) {
            cancelEpisodeFlow();
        }
    }
}

// Moves, Up, Drawing functions from previous step...
// Re-implenting Key Logic only for Drag/Resize guard

function onMouseMove(e) {
    if (!isEpisodeMode && !isDragging && !isPathDrawing && !isDraggingPoint) return; // Safety

    const rect = authorCanvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 점 드래그 처리 (붓 모드에서)
    if (isDraggingPoint) {
        handlePointDrag(x, y);
        return;
    }

    if (isResizing) {
        handleResize(x, y);
    } else if (isDragging) {
        handleDrag(x, y);
    } else if (isDrawing) {
        handleDrawing(x, y);
    } else if (isPathDrawing && currentTool === 'path') {
        // Path 그리기 중 마우스 이동 시 미리보기 업데이트
        renderPathPreviewWithMouse(x, y);
    }
}

// ... (Keep handleDrawing, startResize, handleResize, handleDrag logic identically) ...
// For brevity inserting them effectively:

function onMouseUp(e) {
    // 점 드래그 종료
    if (isDraggingPoint) {
        endPointDrag();
        return;
    }
    
    if (isResizing) {
        isResizing = false;
        activeHandle = null;
    } else if (isDragging) {
        isDragging = false;
    } else if (isDrawing) {
        if (currentTool !== 'path') {
            isDrawing = false;
            finalizeShape();
            // rubber-band를 숨기지 않고 그대로 둠 (currentRegionData의 시각적 표현)
        }
    }
}

// Double click 처리
if (authorCanvasContainer) {
    authorCanvasContainer.addEventListener('dblclick', (e) => {
        if (isEpisodeMode && currentTool === 'path' && pathPoints.length >= 2) {
            // Path 완성: 처음 점과 연결
            const rect = authorCanvasContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            finalizePath(x, y);
        }
    });
}

// ... Drawing helpers ...
function startDrawingInternal(x, y) {
    isDrawing = true;
    dragStartCoords = { x, y };

    if (rubberBand) {
        rubberBand.classList.remove('hidden');
        rubberBand.style.left = px(x);
        rubberBand.style.top = px(y);
        rubberBand.style.width = '0px';
        rubberBand.style.height = '0px';

        // Shape Styling
        if (currentTool === 'circle' || currentTool === 'ellipse') {
            rubberBand.style.borderRadius = '50%';
        } else {
            rubberBand.style.borderRadius = '0';
        }
    }
}
function handleDrawing(x, y) {
    const start = dragStartCoords;
    if (currentTool === 'rect') {
        const left = Math.min(start.x, x);
        const top = Math.min(start.y, y);
        const width = Math.abs(x - start.x);
        const height = Math.abs(y - start.y);
        rubberBand.style.left = px(left);
        rubberBand.style.top = px(top);
        rubberBand.style.width = px(width);
        rubberBand.style.height = px(height);
    } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2));
        rubberBand.style.left = px(start.x - radius);
        rubberBand.style.top = px(start.y - radius);
        rubberBand.style.width = px(radius * 2);
        rubberBand.style.height = px(radius * 2);
    } else if (currentTool === 'ellipse') {
        const left = Math.min(start.x, x);
        const top = Math.min(start.y, y);
        const width = Math.abs(x - start.x);
        const height = Math.abs(y - start.y);
        rubberBand.style.left = px(left);
        rubberBand.style.top = px(top);
        rubberBand.style.width = px(width);
        rubberBand.style.height = px(height);
    }
}
function finalizeShape() {
    const containerW = authorCanvasContainer.clientWidth;
    const containerH = authorCanvasContainer.clientHeight;
    
    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || containerW;
    const imgH = editingStory?.imageSize?.height || containerH;
    
    // 화면 좌표 → 이미지 기준 픽셀 변환 비율
    const scaleX = imgW / containerW;
    const scaleY = imgH / containerH;

    if (currentTool === 'rect') {
        const left = parseFloat(rubberBand.style.left);
        const top = parseFloat(rubberBand.style.top);
        const w = parseFloat(rubberBand.style.width);
        const h = parseFloat(rubberBand.style.height);
        if (w < 5 || h < 5) return;
        currentRegionData = {
            shape: 'rect',
            coords: {
                x: Math.round(left * scaleX),
                y: Math.round(top * scaleY),
                width: Math.round(w * scaleX),
                height: Math.round(h * scaleY)
            }
        };
    } else if (currentTool === 'circle') {
        const w = parseFloat(rubberBand.style.width);
        const left = parseFloat(rubberBand.style.left);
        const top = parseFloat(rubberBand.style.top);
        const r = w / 2;
        const cx = left + r;
        const cy = top + r;
        // 원의 반지름은 화면상 픽셀을 이미지 기준 픽셀로 변환
        // 비율이 다른 경우 평균값 사용
        const avgScale = (scaleX + scaleY) / 2;
        currentRegionData = {
            shape: 'circle',
            coords: {
                cx: Math.round(cx * scaleX),
                cy: Math.round(cy * scaleY),
                r: Math.round(r * avgScale)
            }
        };
    } else if (currentTool === 'ellipse') {
        const w = parseFloat(rubberBand.style.width);
        const h = parseFloat(rubberBand.style.height);
        const left = parseFloat(rubberBand.style.left);
        const top = parseFloat(rubberBand.style.top);
        const rx = w / 2;
        const ry = h / 2;
        const cx = left + rx;
        const cy = top + ry;
        currentRegionData = {
            shape: 'ellipse',
            coords: {
                cx: Math.round(cx * scaleX),
                cy: Math.round(cy * scaleY),
                rx: Math.round(rx * scaleX),
                ry: Math.round(ry * scaleY)
            }
        };
    }
    if (currentRegionData && epRegionCoordsInput) {
        epRegionCoordsInput.value = JSON.stringify(currentRegionData.coords);
        // 영역 그리기는 saveEpisode에서 저장될 때 변경사항으로 처리되므로 여기서는 플래그 설정 안 함
    }
}

// Path 그리기 함수들
function handlePathClick(x, y) {
    const containerW = authorCanvasContainer.clientWidth;
    const containerH = authorCanvasContainer.clientHeight;
    
    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || containerW;
    const imgH = editingStory?.imageSize?.height || containerH;
    
    // 화면 좌표 → 이미지 기준 픽셀 변환 비율
    const scaleX = imgW / containerW;
    const scaleY = imgH / containerH;

    // 픽셀 좌표로 저장
    const pixelPoint = {
        x: Math.round(x * scaleX),
        y: Math.round(y * scaleY)
    };

    // 첫 번째 점이 있고, 3개 이상의 점이 있으면 첫 번째 점과의 거리 확인
    if (pathPoints.length >= 3) {
        const firstPoint = pathPoints[0];
        // 첫 번째 점을 화면 좌표로 변환하여 거리 계산
        const firstScreenX = firstPoint.x / scaleX;
        const firstScreenY = firstPoint.y / scaleY;
        const dist = Math.sqrt(
            Math.pow(x - firstScreenX, 2) +
            Math.pow(y - firstScreenY, 2)
        );

        // 첫 번째 점과 가까우면 (15픽셀 이내) Path 완성
        if (dist < 15) {
            finalizePath(x, y);
            return;
        }
    }

    // 새로운 점 추가
    pathPoints.push(pixelPoint);
    isPathDrawing = true;

    renderPathPreview();
}

function finalizePath(x, y) {
    // 최소 2개의 점이 필요 (폐곡선을 만들려면 최소 3개 권장)
    if (pathPoints.length < 2) {
        console.warn("Path를 완성하려면 최소 2개의 점이 필요합니다.");
        return;
    }

    // 점들을 복사하여 저장 (참조 문제 방지) - 이미 픽셀 좌표임
    const savedPoints = pathPoints.map(p => ({ x: p.x, y: p.y }));

    currentRegionData = {
        shape: 'path',
        coords: {
            points: savedPoints // 픽셀 좌표로 저장
        }
    };

    if (epRegionCoordsInput) {
        epRegionCoordsInput.value = `Path (${savedPoints.length} pts)`;
    }

    // 초기화 (savedPoints에 복사했으므로 안전)
    pathPoints = [];
    isPathDrawing = false;
    if (rubberBandPoly) {
        rubberBandPoly.innerHTML = '';
        rubberBandPoly.classList.add('hidden');
    }

    // 완성된 Path를 즉시 렌더링하여 영역 표시
    renderCurrentPath();

    // Tool을 select로 변경하여 이어서 Path가 그려지지 않도록 함
    selectTool('select');
    
    // Path 그리기 완료 시에는 붓/지우개 버튼을 표시하지 않음 (아직 저장 안된 상태)
    // 저장 후에 수정 모드로 진입하면 표시됨
}

function renderCurrentPath() {
    if (!drawingLayer || !currentRegionData || currentRegionData.shape !== 'path') {
        return;
    }

    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || 1;
    const imgH = editingStory?.imageSize?.height || 1;
    const points = currentRegionData.coords.points;

    if (!points || points.length < 2) {
        return;
    }

    // Path 데이터 생성 (viewBox 0 0 100 100 기준, 픽셀 → 비율 변환)
    let pathData = '';
    const firstPoint = points[0];
    pathData = `M ${(firstPoint.x / imgW) * 100} ${(firstPoint.y / imgH) * 100}`;

    for (let i = 1; i < points.length; i++) {
        const p = points[i];
        pathData += ` L ${(p.x / imgW) * 100} ${(p.y / imgH) * 100}`;
    }

    // 폐곡선으로 연결
    pathData += ' Z';

    // 기존 current path 제거 (있다면)
    const existingCurrentPath = drawingLayer.querySelector('.current-path');
    if (existingCurrentPath) {
        existingCurrentPath.remove();
    }

    // 새로운 Path 요소 생성
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "rgba(0,120,255,0.3)"); // 반투명 파란색으로 영역 표시
    path.setAttribute("stroke", "#007bff"); // 파란색 테두리
    path.setAttribute("stroke-width", "2");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.classList.add('current-path'); // 현재 그리는 Path임을 표시

    drawingLayer.appendChild(path);
}

// 기존 polygon 타입 에피소드 렌더링용 (하위 호환성 유지)
function renderCurrentPolygon() {
    if (!drawingLayer || !currentRegionData || currentRegionData.shape !== 'polygon') {
        return;
    }

    const points = currentRegionData.coords;
    
    if (!points || !Array.isArray(points) || points.length < 3) {
        return;
    }

    // SVG polygon으로 렌더링 (viewBox 0 0 100 100 기준)
    const pointsStr = points.map(p => `${p.x * 100},${p.y * 100}`).join(' ');

    // 기존 polygon 제거 (있다면)
    const existingCurrentPolygon = drawingLayer.querySelector('.current-polygon');
    if (existingCurrentPolygon) {
        existingCurrentPolygon.remove();
    }

    // Polygon 요소 생성
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", pointsStr);
    polygon.setAttribute("fill", "rgba(0,120,255,0.3)");
    polygon.setAttribute("stroke", "#007bff");
    polygon.setAttribute("stroke-width", "2");
    polygon.setAttribute("vector-effect", "non-scaling-stroke");
    polygon.classList.add('current-polygon');

    drawingLayer.appendChild(polygon);
}



function renderPathPreview() {
    renderPathPreviewWithMouse(null, null);
}

function renderPathPreviewWithMouse(mouseX, mouseY) {
    if (!rubberBandPoly || pathPoints.length === 0) return;

    rubberBandPoly.classList.remove('hidden');
    const containerW = authorCanvasContainer.clientWidth;
    const containerH = authorCanvasContainer.clientHeight;
    
    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || containerW;
    const imgH = editingStory?.imageSize?.height || containerH;
    
    // 픽셀 좌표 → 화면 좌표 변환 비율
    const scaleX = containerW / imgW;
    const scaleY = containerH / imgH;

    // Path 미리보기 렌더링 (pathPoints는 픽셀 좌표)
    let pathData = '';
    if (pathPoints.length > 0) {
        const firstPoint = pathPoints[0];
        pathData = `M ${firstPoint.x * scaleX} ${firstPoint.y * scaleY}`;

        for (let i = 1; i < pathPoints.length; i++) {
            const p = pathPoints[i];
            pathData += ` L ${p.x * scaleX} ${p.y * scaleY}`;
        }

        // 마우스 위치까지 선 그리기 (미리보기) - mouseX/Y는 화면 좌표
        if (mouseX !== null && mouseY !== null) {
            pathData += ` L ${mouseX} ${mouseY}`;
        }
    }

    rubberBandPoly.innerHTML = `
        <path d="${pathData}" fill="none" stroke="#007bff" stroke-width="2" stroke-dasharray="5,5" />
        ${pathPoints.map((p, i) =>
        `<circle cx="${p.x * scaleX}" cy="${p.y * scaleY}" r="3" fill="#007bff" />`
    ).join('')}
    `;
}

function handleBrushEraser(x, y, isBrush) {
    // Brush와 Eraser는 path 편집 도구
    // 현재 선택된 에피소드의 path를 편집
    if (!selectedEpId) {
        console.warn("에피소드를 선택해주세요.");
        return;
    }

    const ep = editingStory.episodes.find(e => e.id === selectedEpId);
    if (!ep || !ep.entryRegion || ep.entryRegion.shape !== 'path') {
        console.warn("Brush/Eraser는 Path 타입의 영역에서만 사용할 수 있습니다.");
        return;
    }

    const containerW = authorCanvasContainer.clientWidth;
    const containerH = authorCanvasContainer.clientHeight;
    const normalizedPoint = {
        x: Number((x / containerW).toFixed(3)),
        y: Number((y / containerH).toFixed(3))
    };

    const pathCoords = ep.entryRegion.coords;
    if (!pathCoords.points || !Array.isArray(pathCoords.points)) {
        console.warn("Path 데이터가 올바르지 않습니다.");
        return;
    }

    if (isBrush) {
        // Brush: path에 점 추가 (가장 가까운 선분에 점 삽입)
        addPointToPath(ep, normalizedPoint);
    } else {
        // Eraser: path에서 점 제거 (가장 가까운 점 제거)
        removePointFromPath(ep, normalizedPoint);
    }

    hasUnsavedChanges = true;
    renderExistingRegions();
}

function addPointToPath(ep, newPoint) {
    const points = ep.entryRegion.coords.points;
    if (points.length < 2) {
        // 점이 2개 미만이면 그냥 추가
        points.push(newPoint);
        return;
    }

    // 가장 가까운 선분 찾기
    let minDist = Infinity;
    let insertIndex = points.length;

    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length]; // 마지막 점은 첫 점과 연결

        // 선분에서 점까지의 거리 계산
        const dist = distanceToLineSegment(newPoint, p1, p2);
        if (dist < minDist) {
            minDist = dist;
            insertIndex = i + 1;
        }
    }

    // 점 삽입
    points.splice(insertIndex, 0, newPoint);

    // Path 데이터 재생성
    ep.entryRegion.coords.pathData = generatePathDataFromPoints(points, true);
}

function removePointFromPath(ep, point) {
    const points = ep.entryRegion.coords.points;
    if (points.length <= 3) {
        console.warn("Path는 최소 3개의 점이 필요합니다.");
        return;
    }

    // 가장 가까운 점 찾기
    let minDist = Infinity;
    let removeIndex = -1;

    for (let i = 0; i < points.length; i++) {
        const dist = Math.sqrt(
            Math.pow(point.x - points[i].x, 2) +
            Math.pow(point.y - points[i].y, 2)
        );
        if (dist < minDist) {
            minDist = dist;
            removeIndex = i;
        }
    }

    // 거리가 충분히 가까우면 제거 (brushSize 기준)
    const threshold = brushSize / Math.max(authorCanvasContainer.clientWidth, authorCanvasContainer.clientHeight);
    if (minDist < threshold && removeIndex >= 0) {
        points.splice(removeIndex, 1);

        // Path 데이터 재생성
        ep.entryRegion.coords.pathData = generatePathDataFromPoints(points, true);
    }
}





// Drag & Resize Handlers
function startDrag(e, epId) {
    if (!isEpisodeMode) return; // Guard
    isDragging = true;
    selectedEpId = epId;
    const rect = authorCanvasContainer.getBoundingClientRect();
    dragStartCoords = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const ep = editingStory.episodes.find(ep => ep.id === epId);
    initialShapeData = JSON.parse(JSON.stringify(ep.entryRegion));
}
function handleDrag(x, y) {
    if (!selectedEpId || !initialShapeData) return;
    const dx = x - dragStartCoords.x;
    const dy = y - dragStartCoords.y;
    const containerW = authorCanvasContainer.clientWidth;
    const containerH = authorCanvasContainer.clientHeight;
    const ep = editingStory.episodes.find(ep => ep.id === selectedEpId);
    
    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || containerW;
    const imgH = editingStory?.imageSize?.height || containerH;
    
    // 화면 좌표 변화량 → 이미지 기준 픽셀 변화량
    const dxPx = Math.round(dx * (imgW / containerW));
    const dyPx = Math.round(dy * (imgH / containerH));

    if (initialShapeData.shape === 'rect') {
        ep.entryRegion.coords.x = initialShapeData.coords.x + dxPx;
        ep.entryRegion.coords.y = initialShapeData.coords.y + dyPx;
    } else if (initialShapeData.shape === 'circle') {
        ep.entryRegion.coords.cx = initialShapeData.coords.cx + dxPx;
        ep.entryRegion.coords.cy = initialShapeData.coords.cy + dyPx;
    } else if (initialShapeData.shape === 'polygon') {
        // coords가 배열인 경우: [{x, y}, ...]
        if (Array.isArray(initialShapeData.coords)) {
            ep.entryRegion.coords = initialShapeData.coords.map(p => ({
                x: p.x + dxPx,
                y: p.y + dyPx
            }));
        }
        // coords.points가 배열인 경우: {points: [[x, y], ...]}
        else if (initialShapeData.coords.points && Array.isArray(initialShapeData.coords.points)) {
            ep.entryRegion.coords.points = initialShapeData.coords.points.map(p => [
                p[0] + dxPx,
                p[1] + dyPx
            ]);
        }
    } else if (initialShapeData.shape === 'ellipse') {
        ep.entryRegion.coords.cx = initialShapeData.coords.cx + dxPx;
        ep.entryRegion.coords.cy = initialShapeData.coords.cy + dyPx;
    } else if (initialShapeData.shape === 'path') {
        // Path 타입 드래그 처리: 모든 점을 동일한 거리만큼 이동
        if (initialShapeData.coords.points && Array.isArray(initialShapeData.coords.points)) {
            ep.entryRegion.coords.points = initialShapeData.coords.points.map(p => ({
                x: p.x + dxPx,
                y: p.y + dyPx
            }));
        }
    }
    hasUnsavedChanges = true; // 영역 드래그 변경 감지
    renderExistingRegions();
}
function startResize(e, handleType) {
    if (!isEpisodeMode) return; // Guard
    isResizing = true;
    activeHandle = handleType;
    e.stopPropagation();
    const rect = authorCanvasContainer.getBoundingClientRect();
    dragStartCoords = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const ep = editingStory.episodes.find(ep => ep.id === selectedEpId);
    initialShapeData = JSON.parse(JSON.stringify(ep.entryRegion));
}
function handleResize(x, y) {
    if (!selectedEpId || !initialShapeData || !activeHandle) return;
    const containerW = authorCanvasContainer.clientWidth;
    const containerH = authorCanvasContainer.clientHeight;
    const ep = editingStory.episodes.find(ep => ep.id === selectedEpId);
    const initC = initialShapeData.coords;
    
    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || containerW;
    const imgH = editingStory?.imageSize?.height || containerH;
    
    // 화면 좌표 → 이미지 기준 픽셀 좌표 변환
    const mx = Math.round(x * (imgW / containerW));
    const my = Math.round(y * (imgH / containerH));

    // 1. Calculate Initial Bounding Box based on Shape Type (모두 픽셀 좌표)
    let initBox = { x: 0, y: 0, width: 0, height: 0 };

    if (initialShapeData.shape === 'rect') {
        initBox = { x: initC.x, y: initC.y, width: initC.width, height: initC.height };
    } else if (initialShapeData.shape === 'circle') {
        // Circle: cx, cy, r 모두 픽셀 좌표
        initBox = {
            x: initC.cx - initC.r,
            y: initC.cy - initC.r,
            width: initC.r * 2,
            height: initC.r * 2
        };
    } else if (initialShapeData.shape === 'ellipse') {
        initBox = {
            x: initC.cx - initC.rx,
            y: initC.cy - initC.ry,
            width: initC.rx * 2,
            height: initC.ry * 2
        };
    } else if ((initialShapeData.shape === 'polygon' || initialShapeData.shape === 'path') && (initC.points || Array.isArray(initC))) {
        const points = initC.points || initC;
        if (Array.isArray(points) && points.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            points.forEach(p => {
                const px = Array.isArray(p) ? p[0] : p.x;
                const py = Array.isArray(p) ? p[1] : p.y;
                if (px < minX) minX = px;
                if (py < minY) minY = py;
                if (px > maxX) maxX = px;
                if (py > maxY) maxY = py;
            });
            initBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
    }

    let newX = initBox.x; let newY = initBox.y;
    let newW = initBox.width; let newH = initBox.height;

    // 핸들 방향에 따른 새 bounding box 계산 (픽셀 좌표)
    if (activeHandle.includes('e')) newW = mx - initBox.x;
    if (activeHandle.includes('w')) { newW = (initBox.x + initBox.width) - mx; newX = mx; }
    if (activeHandle.includes('s')) newH = my - initBox.y;
    if (activeHandle.includes('n')) { newH = (initBox.y + initBox.height) - my; newY = my; }

    // 최소 크기 제한 (픽셀 기준)
    if (newW < 5) newW = 5;
    if (newH < 5) newH = 5;

    // Unified Resize Logic (모두 픽셀 좌표)
    let newBox = { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) };

    if (initialShapeData.shape === 'rect') {
        ep.entryRegion.coords = { ...newBox };
    } else if (initialShapeData.shape === 'circle') {
        // 원을 유지하기 위해 width와 height 중 작은 값 사용
        const newR = Math.round(Math.min(newBox.width, newBox.height) / 2);
        
        ep.entryRegion.coords = {
            cx: Math.round(newBox.x + newBox.width / 2),
            cy: Math.round(newBox.y + newBox.height / 2),
            r: newR
        };
    } else if (initialShapeData.shape === 'ellipse') {
        ep.entryRegion.coords = {
            cx: Math.round(newBox.x + newBox.width / 2),
            cy: Math.round(newBox.y + newBox.height / 2),
            rx: Math.round(newBox.width / 2),
            ry: Math.round(newBox.height / 2)
        };
    } else if (initialShapeData.shape === 'polygon' || initialShapeData.shape === 'path') {
        const initPoints = initialShapeData.coords.points || initialShapeData.coords;
        if (!Array.isArray(initPoints)) return;

        // Calculate initial bbox to get scale factors
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        initPoints.forEach(p => {
            const px = Array.isArray(p) ? p[0] : p.x;
            const py = Array.isArray(p) ? p[1] : p.y;
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
        });

        const oldW = maxX - minX;
        const oldH = maxY - minY;

        // Prevent division by zero
        const scaleX = oldW > 0 ? newW / oldW : 1;
        const scaleY = oldH > 0 ? newH / oldH : 1;

        const newPoints = initPoints.map(p => {
            const oldPx = Array.isArray(p) ? p[0] : p.x;
            const oldPy = Array.isArray(p) ? p[1] : p.y;

            // Relative position from old top-left
            const relX = oldPx - minX;
            const relY = oldPy - minY;

            const finalX = Math.round(newX + (relX * scaleX));
            const finalY = Math.round(newY + (relY * scaleY));

            return Array.isArray(p) ? [finalX, finalY] : { x: finalX, y: finalY };
        });

        if (initialShapeData.shape === 'polygon') {
            if (initialShapeData.coords.points) ep.entryRegion.coords.points = newPoints;
            else ep.entryRegion.coords = newPoints;
        } else {
            // Path
            ep.entryRegion.coords.points = newPoints;
        }
    }

    hasUnsavedChanges = true; // 영역 리사이즈 변경 감지
    renderExistingRegions();
}

function renderExistingRegions() {
    if (!drawingLayer) {
        console.warn("drawingLayer가 없습니다.");
        return;
    }

    // SVG 레이어 초기화 (current-path도 함께 제거)
    drawingLayer.innerHTML = '';

    // 기존 circle div들 제거 (픽셀 단위 div로 렌더링된 원들)
    const existingCircleDivs = authorCanvasContainer.querySelectorAll('.region-circle-div');
    existingCircleDivs.forEach(div => div.remove());

    // 기존 circle resize handle들 제거
    const existingCircleHandles = authorCanvasContainer.querySelectorAll('.circle-resize-handle');
    existingCircleHandles.forEach(handle => handle.remove());

    if (!editingStory || !editingStory.episodes) return;

    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || 1;
    const imgH = editingStory?.imageSize?.height || 1;
    
    // 헬퍼 함수: 픽셀 좌표를 퍼센트(0-100)로 변환
    const toPercentX = (px) => (px / imgW) * 100;
    const toPercentY = (px) => (px / imgH) * 100;
    
    // 화면 좌표 계산용
    const containerW = authorCanvasContainer.clientWidth;
    const containerH = authorCanvasContainer.clientHeight;

    editingStory.episodes.forEach(ep => {
        // entryRegion이 없으면 스킵
        if (!ep.entryRegion || !ep.entryRegion.shape || !ep.entryRegion.coords) {
            console.warn("에피소드에 entryRegion이 없습니다:", ep.id, ep);
            return;
        }

        // Cursors: Pointer if View Mode, Move if Edit Mode and Selected
        const isSelected = (ep.id === selectedEpId);
        const canEdit = isEpisodeMode && isSelected;

        const r = ep.entryRegion;
        const strokeColor = isSelected ? (canEdit ? "#00ff00" : "#00ffff") : "#00ffff"; // Green if editing, Cyan if selected-view
        const strokeWidth = isSelected ? "3" : "2";

        // Circle은 픽셀 단위 div로 렌더링 (preserveAspectRatio="none" 문제 해결)
        if (r.shape === 'circle') {
            if (r.coords.cx !== undefined && r.coords.cy !== undefined && r.coords.r !== undefined) {
                // 픽셀 좌표를 화면 좌표로 변환
                const scaleX = containerW / imgW;
                const scaleY = containerH / imgH;
                const avgScale = (scaleX + scaleY) / 2;

                const cxScreen = r.coords.cx * scaleX;
                const cyScreen = r.coords.cy * scaleY;
                const rScreen = r.coords.r * avgScale;

                // div 생성
                const circleDiv = document.createElement('div');
                circleDiv.classList.add('region-circle-div', 'region-group');
                circleDiv.dataset.epId = ep.id;
                circleDiv.style.position = 'absolute';
                circleDiv.style.left = (cxScreen - rScreen) + 'px';
                circleDiv.style.top = (cyScreen - rScreen) + 'px';
                circleDiv.style.width = (rScreen * 2) + 'px';
                circleDiv.style.height = (rScreen * 2) + 'px';
                circleDiv.style.borderRadius = '50%';
                circleDiv.style.border = strokeWidth + 'px solid ' + strokeColor;
                circleDiv.style.backgroundColor = 'rgba(255,255,255,0.3)';
                circleDiv.style.cursor = canEdit ? 'move' : 'pointer';
                circleDiv.style.boxSizing = 'border-box';
                circleDiv.style.zIndex = '45';

                authorCanvasContainer.appendChild(circleDiv);

                // Circle용 Resize Handles 렌더링 (Edit Mode + Selected인 경우)
                if (canEdit) {
                    renderCircleResizeHandles(circleDiv, cxScreen, cyScreen, rScreen);
                }
            } else {
                console.warn("circle 타입의 coords가 올바르지 않습니다:", ep.id, r.coords);
            }
            return; // circle은 여기서 처리 완료
        }

        // 나머지 shape들은 SVG로 렌더링
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.classList.add('region-group');
        group.dataset.epId = ep.id;
        group.style.cursor = canEdit ? "move" : "pointer";

        if (r.shape === 'rect') {
            if (r.coords.x !== undefined && r.coords.y !== undefined && r.coords.width !== undefined && r.coords.height !== undefined) {
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                // 픽셀 좌표를 퍼센트로 변환
                rect.setAttribute("x", toPercentX(r.coords.x) + "%");
                rect.setAttribute("y", toPercentY(r.coords.y) + "%");
                rect.setAttribute("width", toPercentX(r.coords.width) + "%");
                rect.setAttribute("height", toPercentY(r.coords.height) + "%");
                rect.setAttribute("fill", "rgba(255,255,255,0.3)");
                rect.setAttribute("stroke", strokeColor);
                rect.setAttribute("stroke-width", strokeWidth);
                rect.setAttribute("vector-effect", "non-scaling-stroke");
                group.appendChild(rect);
            } else {
                console.warn("rect 타입의 coords가 올바르지 않습니다:", ep.id, r.coords);
            }
        } else if (r.shape === 'ellipse') {
            if (r.coords.cx !== undefined && r.coords.cy !== undefined && r.coords.rx !== undefined && r.coords.ry !== undefined) {
                const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                // 픽셀 좌표를 퍼센트로 변환
                ellipse.setAttribute("cx", toPercentX(r.coords.cx) + "%");
                ellipse.setAttribute("cy", toPercentY(r.coords.cy) + "%");
                ellipse.setAttribute("rx", toPercentX(r.coords.rx) + "%");
                ellipse.setAttribute("ry", toPercentY(r.coords.ry) + "%");
                ellipse.setAttribute("fill", "rgba(255,255,255,0.3)");
                ellipse.setAttribute("stroke", strokeColor);
                ellipse.setAttribute("stroke-width", strokeWidth);
                ellipse.setAttribute("vector-effect", "non-scaling-stroke");
                group.appendChild(ellipse);
            } else {
                console.warn("ellipse 타입의 coords가 올바르지 않습니다:", ep.id, r.coords);
            }
        } else if (r.shape === 'polygon') {
            let pointsArray = null;

            // coords가 배열인 경우: [{x, y}, ...] - 픽셀 좌표
            if (Array.isArray(r.coords) && r.coords.length > 0) {
                // viewBox가 0 0 100 100이므로 픽셀→퍼센트 변환
                pointsArray = r.coords.map(p => `${toPercentX(p.x)},${toPercentY(p.y)}`);
            }
            // coords.points가 배열인 경우: {points: [[x, y], ...]} 또는 {points: [{x, y}, ...]} - 픽셀 좌표
            else if (r.coords.points && Array.isArray(r.coords.points) && r.coords.points.length > 0) {
                pointsArray = r.coords.points.map(p => {
                    const px = Array.isArray(p) ? p[0] : p.x;
                    const py = Array.isArray(p) ? p[1] : p.y;
                    return `${toPercentX(px)},${toPercentY(py)}`;
                });
            }

            if (pointsArray && pointsArray.length > 0) {
                const pts = pointsArray.join(' ');
                const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                poly.setAttribute("points", pts);
                poly.setAttribute("fill", "rgba(0,120,255,0.3)");
                poly.setAttribute("stroke", strokeColor);
                poly.setAttribute("stroke-width", strokeWidth);
                poly.setAttribute("vector-effect", "non-scaling-stroke");
                group.appendChild(poly);
            } else {
                console.warn("polygon 타입의 coords가 올바르지 않습니다:", ep.id, r.coords);
            }
        } else if (r.shape === 'path') {
            // Path 타입 렌더링
            if (r.coords && r.coords.points && Array.isArray(r.coords.points) && r.coords.points.length >= 2) {
                // Path 데이터 생성 (viewBox 0 0 100 100 기준, 픽셀→퍼센트 변환)
                let pathData = '';
                const firstPoint = r.coords.points[0];
                pathData = `M ${toPercentX(firstPoint.x)} ${toPercentY(firstPoint.y)}`;

                for (let i = 1; i < r.coords.points.length; i++) {
                    const p = r.coords.points[i];
                    pathData += ` L ${toPercentX(p.x)} ${toPercentY(p.y)}`;
                }

                // 폐곡선으로 연결
                pathData += ' Z';

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", pathData);
                path.setAttribute("fill", "rgba(0,120,255,0.3)");
                path.setAttribute("stroke", strokeColor);
                path.setAttribute("stroke-width", strokeWidth);
                path.setAttribute("vector-effect", "non-scaling-stroke");
                group.appendChild(path);

                // 붓/지우개 모드일 때 점 핸들 렌더링
                if (canEdit && (currentTool === 'brush' || currentTool === 'eraser')) {
                    renderPathPointHandles(group, r.coords.points, ep.id);
                }
            } else {
                console.warn("path 타입의 coords가 올바르지 않습니다:", ep.id, r.coords);
            }
        } else {
            console.warn("알 수 없는 shape 타입:", r.shape, "에피소드:", ep.id);
        }

        // group에 자식 요소가 있으면 drawingLayer에 추가
        if (group.children.length > 0) {
            drawingLayer.appendChild(group);

            // Render Resize Handles for ALL shapes if Edit Mode + Selected
            // 단, 붓/지우개 모드일 때는 리사이즈 핸들 숨김 (Path의 경우)
            const isPointEditMode = (currentTool === 'brush' || currentTool === 'eraser');
            const shouldShowResizeHandles = canEdit && r.coords && !(r.shape === 'path' && isPointEditMode);
            
            if (shouldShowResizeHandles) {
                // Calculate Bounding Box
                let bbox = null;
                if (r.shape === 'rect') {
                    bbox = { x: r.coords.x, y: r.coords.y, width: r.coords.width, height: r.coords.height };
                } else if (r.shape === 'circle') {
                    bbox = {
                        x: r.coords.cx - r.coords.r,
                        y: r.coords.cy - r.coords.r,
                        width: r.coords.r * 2,
                        height: r.coords.r * 2
                    };
                } else if (r.shape === 'ellipse') {
                    bbox = {
                        x: r.coords.cx - r.coords.rx,
                        y: r.coords.cy - r.coords.ry,
                        width: r.coords.rx * 2,
                        height: r.coords.ry * 2
                    };
                } else if ((r.shape === 'polygon' || r.shape === 'path') && (r.coords.points || Array.isArray(r.coords))) {
                    const points = r.coords.points || r.coords;
                    if (Array.isArray(points) && points.length > 0) {
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        // Handle both [x,y] arrays and {x,y} objects
                        points.forEach(p => {
                            const px = Array.isArray(p) ? p[0] : p.x;
                            const py = Array.isArray(p) ? p[1] : p.y;
                            if (px < minX) minX = px;
                            if (py < minY) minY = py;
                            if (px > maxX) maxX = px;
                            if (py > maxY) maxY = py;
                        });
                        bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                    }
                }

                if (bbox) {
                    renderResizeHandles(group, bbox);
                }
            }
        }
    });

    // 중요: currentRegionData가 있으면 다시 렌더링 (임시 그리기 복원)
    if (currentRegionData) {
        if (currentRegionData.shape === 'path') {
            renderCurrentPath();
        } else if (currentRegionData.shape === 'polygon') {
            // 기존 polygon 타입 에피소드 복원 (하위 호환성)
            renderCurrentPolygon();
        }
    }
}

function renderResizeHandles(group, coords) {
    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || 1;
    const imgH = editingStory?.imageSize?.height || 1;
    
    // 픽셀 좌표를 퍼센트(0-100)로 변환
    const x = (coords.x / imgW) * 100;
    const y = (coords.y / imgH) * 100;
    const w = (coords.width / imgW) * 100;
    const h = (coords.height / imgH) * 100;
    const size = 1.5;

    // Helper to add handle
    const addH = (type, cx, cy) => {
        const hRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hRect.setAttribute("x", (cx - size / 2) + "%");
        hRect.setAttribute("y", (cy - size / 2) + "%");
        hRect.setAttribute("width", size + "%");
        hRect.setAttribute("height", size + "%");
        hRect.setAttribute("fill", "white");
        hRect.setAttribute("stroke", "black");
        hRect.setAttribute("stroke-width", "1");
        hRect.setAttribute("vector-effect", "non-scaling-stroke");
        hRect.setAttribute("class", "resize-handle");
        hRect.dataset.handle = type;
        hRect.style.cursor = getCursorForHandle(type);
        group.appendChild(hRect);
    };

    addH('nw', x, y);
    addH('n', x + w / 2, y);
    addH('ne', x + w, y);
    addH('e', x + w, y + h / 2);
    addH('se', x + w, y + h);
    addH('s', x + w / 2, y + h);
    addH('sw', x, y + h);
    addH('w', x, y + h / 2);
}

// Circle용 Resize Handles (픽셀 단위 div 기반)
function renderCircleResizeHandles(circleDiv, cxPx, cyPx, rPx) {
    const handleSize = 10;

    // Helper to add handle
    const addHandle = (type, hx, hy) => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle', 'circle-resize-handle');
        handle.dataset.handle = type;
        handle.style.position = 'absolute';
        handle.style.left = (hx - handleSize / 2) + 'px';
        handle.style.top = (hy - handleSize / 2) + 'px';
        handle.style.width = handleSize + 'px';
        handle.style.height = handleSize + 'px';
        handle.style.backgroundColor = 'white';
        handle.style.border = '1px solid black';
        handle.style.cursor = getCursorForHandle(type);
        handle.style.zIndex = '50';
        handle.style.boxSizing = 'border-box';
        authorCanvasContainer.appendChild(handle);
    };

    // 8방향 핸들 (바운딩 박스 기준)
    const left = cxPx - rPx;
    const top = cyPx - rPx;
    const right = cxPx + rPx;
    const bottom = cyPx + rPx;

    addHandle('nw', left, top);
    addHandle('n', cxPx, top);
    addHandle('ne', right, top);
    addHandle('e', right, cyPx);
    addHandle('se', right, bottom);
    addHandle('s', cxPx, bottom);
    addHandle('sw', left, bottom);
    addHandle('w', left, cyPx);
}

function getCursorForHandle(type) {
    if (type === 'nw' || type === 'se') return 'nwse-resize';
    if (type === 'ne' || type === 'sw') return 'nesw-resize';
    if (type === 'n' || type === 's') return 'ns-resize';
    return 'ew-resize';
}

// --------------------------------------------------------
// Path Point Editing (붓/지우개 모드에서 점 편집)
// --------------------------------------------------------
// Note: generatePathData, generatePathDataFromPoints, distanceToLineSegment, px
// 함수들은 common.js에 정의되어 있습니다.

// Path의 각 점에 핸들 렌더링
function renderPathPointHandles(group, points, epId) {
    if (!points || !Array.isArray(points) || points.length < 2) return;

    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || 1;
    const imgH = editingStory?.imageSize?.height || 1;
    
    // 헬퍼 함수: 픽셀 좌표를 퍼센트(0-100)로 변환
    const toPercentX = (px) => (px / imgW) * 100;
    const toPercentY = (px) => (px / imgH) * 100;

    const isBrushMode = currentTool === 'brush';
    const isEraserMode = currentTool === 'eraser';
    
    // 핸들 색상: 붓=파란색, 지우개=빨간색
    const handleColor = isBrushMode ? '#007bff' : '#ff3b30';
    
    // 각 점에 핸들 생성
    // viewBox가 "0 0 100 100"이므로 픽셀 좌표를 0-100 범위로 변환
    points.forEach((p, index) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", toPercentX(p.x));  // viewBox 기준 좌표 (0-100)
        circle.setAttribute("cy", toPercentY(p.y));  // viewBox 기준 좌표 (0-100)
        circle.setAttribute("r", "1.5");       // viewBox 기준 반지름
        circle.setAttribute("fill", handleColor);
        circle.setAttribute("stroke", "white");
        circle.setAttribute("stroke-width", "2");
        circle.setAttribute("vector-effect", "non-scaling-stroke");
        circle.classList.add('path-point-handle');
        circle.dataset.pointIndex = index;
        circle.dataset.epId = epId;
        circle.style.cursor = isBrushMode ? 'move' : 'pointer';
        
        group.appendChild(circle);
    });

    // 붓 모드에서 선분 위에 점 추가 힌트 표시 (각 선분의 중간점)
    if (isBrushMode) {
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            const addCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            addCircle.setAttribute("cx", toPercentX(midX));  // viewBox 기준 좌표 (0-100)
            addCircle.setAttribute("cy", toPercentY(midY));  // viewBox 기준 좌표 (0-100)
            addCircle.setAttribute("r", "1");          // viewBox 기준 반지름
            addCircle.setAttribute("fill", "rgba(0, 123, 255, 0.3)");
            addCircle.setAttribute("stroke", "#007bff");
            addCircle.setAttribute("stroke-width", "1");
            addCircle.setAttribute("stroke-dasharray", "2,2");
            addCircle.setAttribute("vector-effect", "non-scaling-stroke");
            addCircle.classList.add('path-add-point-handle');
            addCircle.dataset.insertAfterIndex = i;
            addCircle.dataset.epId = epId;
            addCircle.style.cursor = 'cell'; // 추가 커서

            group.appendChild(addCircle);
        }
    }
}

// 점 핸들 클릭 처리
function handlePointHandleClick(e, epId, pointIndex) {
    e.stopPropagation();
    
    if (currentTool === 'eraser') {
        // 지우개 모드: 점 삭제
        const ep = editingStory.episodes.find(ep => ep.id === epId);
        if (!ep || !ep.entryRegion || ep.entryRegion.shape !== 'path') return;
        
        const points = ep.entryRegion.coords.points;
        if (points.length <= 3) {
            alert("Path는 최소 3개의 점이 필요합니다.");
            return;
        }
        
        points.splice(pointIndex, 1);
        ep.entryRegion.coords.pathData = generatePathDataFromPoints(points, true);
        hasUnsavedChanges = true;
        renderExistingRegions();
    }
}

// 점 추가 핸들 클릭 처리
function handleAddPointClick(e, epId, insertAfterIndex) {
    e.stopPropagation();
    
    if (currentTool !== 'brush') return;
    
    const ep = editingStory.episodes.find(ep => ep.id === epId);
    if (!ep || !ep.entryRegion || ep.entryRegion.shape !== 'path') return;
    
    const points = ep.entryRegion.coords.points;
    const p1 = points[insertAfterIndex];
    const p2 = points[(insertAfterIndex + 1) % points.length];
    
    // 중간점 계산 (픽셀 좌표)
    const newPoint = {
        x: Math.round((p1.x + p2.x) / 2),
        y: Math.round((p1.y + p2.y) / 2)
    };
    
    // 점 삽입
    points.splice(insertAfterIndex + 1, 0, newPoint);
    hasUnsavedChanges = true;
    renderExistingRegions();
}

// 점 드래그 시작
function startPointDrag(e, epId, pointIndex) {
    if (currentTool !== 'brush') return;
    
    e.stopPropagation();
    isDraggingPoint = true;
    draggingPointIndex = pointIndex;
    
    const rect = authorCanvasContainer.getBoundingClientRect();
    pointDragStartCoords = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// 점 드래그 처리
function handlePointDrag(x, y) {
    if (!isDraggingPoint || draggingPointIndex < 0) return;
    if (!selectedEpId) return;
    
    const ep = editingStory.episodes.find(ep => ep.id === selectedEpId);
    if (!ep || !ep.entryRegion || ep.entryRegion.shape !== 'path') return;
    
    const points = ep.entryRegion.coords.points;
    if (draggingPointIndex >= points.length) return;
    
    const containerW = authorCanvasContainer.clientWidth;
    const containerH = authorCanvasContainer.clientHeight;
    
    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = editingStory?.imageSize?.width || containerW;
    const imgH = editingStory?.imageSize?.height || containerH;
    
    // 화면 좌표 → 픽셀 좌표 변환
    const scaleX = imgW / containerW;
    const scaleY = imgH / containerH;
    const newX = Math.round(x * scaleX);
    const newY = Math.round(y * scaleY);
    
    // 범위 제한 (0 ~ imageSize)
    points[draggingPointIndex].x = Math.max(0, Math.min(imgW, newX));
    points[draggingPointIndex].y = Math.max(0, Math.min(imgH, newY));
    
    renderExistingRegions();
}

// 점 드래그 종료
function endPointDrag() {
    if (isDraggingPoint) {
        isDraggingPoint = false;
        draggingPointIndex = -1;
        hasUnsavedChanges = true;
    }
}

// --------------------------------------------------------
// Save Logic
function saveStoryToStorage() {
    if (!editingStory) return;

    if (!editingStory.title || editingStory.title.trim() === "") {
        const newTitle = prompt("스토리 제목을 입력하세요:", "새로운 이야기");
        if (!newTitle) return;
        editingStory.title = newTitle;
        if (authorStoryTitleInput) authorStoryTitleInput.value = editingStory.title;
    }

    try {
        let lib = [];
        const savedLib = localStorage.getItem('storyLibrary');
        if (savedLib) lib = JSON.parse(savedLib);

        const idx = lib.findIndex(s => s.storyId === editingStory.storyId);
        if (idx >= 0) lib[idx] = editingStory;
        else lib.push(editingStory);

        localStorage.setItem('storyLibrary', JSON.stringify(lib));
        hasUnsavedChanges = false; // 저장 완료 시 변경사항 플래그 리셋
        alert("스토리가 저장되었습니다.");

        // Option to exit or stay. "저장되었습니다" implies done?
        // Let's reload dashboard data but stay in authoring?
        // User pattern: Save -> Exit manually.
    } catch (e) {
        console.error("Storage Error:", e);
        if (confirm("저장 중 문제가 발생했습니다 (용량 초과 등). JSON 파일로 다운로드하시겠습니까?")) {
            downloadStoryJSON(editingStory);
        }
    }
}
function downloadStoryJSON(story) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(story, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${story.title || "story"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Export
window.initAuthoring = initAuthoring;
window.startAuthoring = startAuthoring;
