// DOM Elements
const dashboardView = document.getElementById('dashboard-view');
const storyList = document.getElementById('story-list');
const importButton = document.getElementById('import-button');
const fileInput = document.getElementById('file-input');
const newButton = document.getElementById('new-button');

const mainView = document.getElementById('main-view');
const episodeView = document.getElementById('episode-view');

const mainImage = document.getElementById('main-image');
const mainImageContainer = document.getElementById('main-image-container');
const episodeImage = document.getElementById('episode-image');
const backButton = document.getElementById('back-button');
const exitButton = document.getElementById('exit-button');

// State
let storyLibrary = []; // Array of Story Objects
let currentStory = null;

// Initialization
function init() {
    console.log("App Initializing...");
    loadLibrary();

    // Event Listeners
    importButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImport);



    // Responsive
    // Initialize Player
    if (window.initPlayer) {
        window.initPlayer();
    }

    // Initialize Authoring
    if (window.initAuthoring) {
        window.initAuthoring();
    }

    // New Button Logic
    newButton.disabled = false; // Enable New Button
    newButton.title = "새 이야기 만들기";
    newButton.addEventListener('click', () => {
        if (window.startAuthoring) {
            window.startAuthoring(null);
        }
    });

    renderDashboard();
    console.log("App Initialized.");
}

// --------------------------------------------------------
// Data Management (Library)
// --------------------------------------------------------

function loadLibrary() {
    const savedLib = localStorage.getItem('storyLibrary');
    if (savedLib) {
        try {
            storyLibrary = JSON.parse(savedLib);
            console.log("Loaded library. Stories count:", storyLibrary.length);
        } catch (e) {
            console.error("Failed to parse library", e);
            storyLibrary = [];
        }
    } else {
        console.log("No existing library found.");
    }

    // Migration logic: Check for old single 'storyData'
    const oldStory = localStorage.getItem('storyData');
    if (oldStory) {
        try {
            const json = JSON.parse(oldStory);
            console.log("Migrating old story:", json.title);
            // Deduplication check based on ID
            if (!storyLibrary.some(s => s.storyId === json.storyId)) {
                storyLibrary.push(json);
                saveLibrary();
            }
            localStorage.removeItem('storyData'); // Cleanup
        } catch (e) { console.error("Migration failed", e); }
    }
}

function saveLibrary() {
    localStorage.setItem('storyLibrary', JSON.stringify(storyLibrary));
    console.log("Library saved to localStorage.");
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log("Reading file:", file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            console.log("Parsed JSON:", json);

            // Basic Validation
            if (!json.storyId || !json.mainImage || !json.episodes) {
                throw new Error("올바른 스토리 파일 형식이 아닙니다 (ID/Images누락).");
            }

            console.log("Importing Story:", json.title, "ID:", json.storyId);

            // Check duplicate
            const existingIdx = storyLibrary.findIndex(s => s.storyId === json.storyId);
            console.log("Existing Index:", existingIdx);

            if (existingIdx >= 0) {
                if (confirm(`'${json.title}' 스토리가 이미 존재합니다 (ID: ${json.storyId}). 덮어쓰시겠습니까?`)) {
                    storyLibrary[existingIdx] = json;
                    console.log("Overwrote existing story.");
                } else {
                    console.log("Import cancelled by user (duplicate).");
                    return; // Cancel
                }
            } else {
                storyLibrary.push(json);
                console.log("Added new story.");
            }

            saveLibrary();
            console.log("Library saved. Total stories:", storyLibrary.length);
            renderDashboard();
            fileInput.value = ""; // Reset input

        } catch (error) {
            console.error("Import Error:", error);
            alert("가져오기 실패: " + error.message);
        }
    };
    reader.readAsText(file);
}

// --------------------------------------------------------
// Dashboard Logic
// --------------------------------------------------------

// Expose functions for authoring.js
window.renderDashboard = renderDashboard;
window.loadLibrary = loadLibrary;

function renderDashboard() {
    console.log("Rendering Dashboard...");
    dashboardView.classList.remove('hidden');
    mainView.classList.add('hidden');
    episodeView.classList.add('hidden');
    if (document.getElementById('authoring-view')) {
        document.getElementById('authoring-view').classList.add('hidden');
    }

    storyList.innerHTML = '';

    if (storyLibrary.length === 0) {
        storyList.innerHTML = `
            <div class="empty-state">
                <p>등록된 이야기가 없습니다.<br>Import 버튼을 눌러 이야기를 추가해보세요.</p>
            </div>
        `;
        return;
    }

    storyLibrary.forEach(story => {
        const card = document.createElement('div');
        card.className = 'story-card';
        // We assume image paths are relative to index.html or absolute
        // If images do not exist, alt text will show
        card.innerHTML = `
            <div class="story-thumbnail">
                <img src="${story.mainImage}" alt="${story.title}" onerror="this.style.display='none'">
            </div>
            <div class="story-info">
                <div class="story-title">${story.title}</div>
                <div class="story-meta">에피소드 ${story.episodes ? story.episodes.length : 0}개</div>
                <div class="card-actions">
                    <button class="play-btn" data-id="${story.storyId}">Play</button>
                    <button class="edit-btn" data-id="${story.storyId}">Edit</button>
                    <button class="download-btn" data-id="${story.storyId}">Download</button>
                    <button class="delete-btn" data-id="${story.storyId}">Delete</button>
                </div>
            </div>
        `;

        // Add event listener manually to avoid closure issues with onclick string
        card.querySelector('.play-btn').addEventListener('click', () => playStory(story));
        card.querySelector('.edit-btn').addEventListener('click', () => {
            if (window.startAuthoring) {
                window.startAuthoring(story);
            } else {
                alert("저작 모드를 불러오는 중 오류가 발생했습니다.");
            }
        });
        card.querySelector('.delete-btn').addEventListener('click', () => deleteStory(story));
        card.querySelector('.download-btn').addEventListener('click', () => downloadStory(story));

        storyList.appendChild(card);
    });
}





function deleteStory(story) {
    if (!confirm(`'${story.title}' 스토리를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
        return; // 사용자가 취소한 경우
    }

    // storyLibrary에서 해당 story 제거
    const index = storyLibrary.findIndex(s => s.storyId === story.storyId);
    if (index >= 0) {
        storyLibrary.splice(index, 1);
        saveLibrary();
        console.log(`Story 삭제됨: ${story.title} (ID: ${story.storyId})`);
        console.log(`남은 Story 수: ${storyLibrary.length}`);

        // Dashboard 다시 렌더링
        renderDashboard();
    } else {
        console.warn("삭제할 Story를 찾을 수 없습니다:", story.storyId);
    }
}

function downloadStory(story) {
    // Story를 JSON 파일로 다운로드
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(story, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${story.title || "story"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    console.log(`Story 다운로드됨: ${story.title} (ID: ${story.storyId})`);
}

// --------------------------------------------------------
// Player View Logic
// --------------------------------------------------------



// Start
document.addEventListener('DOMContentLoaded', init);
