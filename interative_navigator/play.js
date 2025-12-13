// Player Logic

// Global Elements
let playDashboardView;
let playMainView;
let playEpisodeView;
let playMainImage;
let playMainImageContainer;
let playEpisodeImage;
let playBackButton; // In Episode View
let playExitButton; // In Main View

// State
let playCurrentStory = null;

function initPlayer() {
    console.log("Initializing Player...");

    playDashboardView = document.getElementById('dashboard-view');
    playMainView = document.getElementById('main-view');
    playEpisodeView = document.getElementById('episode-view');

    playMainImage = document.getElementById('main-image');
    playMainImageContainer = document.getElementById('main-image-container');
    playEpisodeImage = document.getElementById('episode-image');

    playBackButton = document.getElementById('back-button');
    playExitButton = document.getElementById('exit-button');

    // Event Listeners
    if (playBackButton) playBackButton.addEventListener('click', showMainView);
    if (playExitButton) playExitButton.addEventListener('click', exitPlayMode);

    // Responsive & Image Load
    window.addEventListener('resize', () => {
        if (playMainView && !playMainView.classList.contains('hidden') && playCurrentStory) {
            renderOverlayRegions();
        }
    });

    if (playMainImage) playMainImage.addEventListener('load', renderOverlayRegions);
}

function playStory(story) {
    playCurrentStory = story;
    console.log("Playing Story:", story.title);

    if (playDashboardView) playDashboardView.classList.add('hidden');

    // Setup Main Image
    if (playMainImage) playMainImage.src = playCurrentStory.mainImage;
    // renderOverlayRegions will be triggered by onload event of the image

    showMainView();
}

function exitPlayMode() {
    playCurrentStory = null;

    // UI Change
    if (playMainView) playMainView.classList.add('hidden');
    if (playEpisodeView) playEpisodeView.classList.add('hidden');

    // Notify Dashboard to show itself
    // Assuming main.js exposes a way to render dashboard or just show it
    // But better: main.js handles "Exit" logic if it owns the dashboard?
    // Or we just unhide the dashboard here.
    if (playDashboardView) playDashboardView.classList.remove('hidden');

    // Optionally reload dashboard if needed, but usually static unless changed.
    if (window.renderDashboard) window.renderDashboard();
}

function showMainView() {
    if (playMainView) playMainView.classList.remove('hidden');
    if (playEpisodeView) playEpisodeView.classList.add('hidden');
    // Re-render regions in case of resize or state change
    setTimeout(renderOverlayRegions, 50);
}

function showEpisodeView(episode) {
    console.log("Entering Episode:", episode.name);
    if (playEpisodeImage) playEpisodeImage.src = episode.episodeImage;
    if (playMainView) playMainView.classList.add('hidden');
    if (playEpisodeView) playEpisodeView.classList.remove('hidden');
}

function renderOverlayRegions() {
    if (!playCurrentStory || !playMainImageContainer) return;

    // Clear existing
    const existingRegions = playMainImageContainer.querySelectorAll('.click-region');
    existingRegions.forEach(el => el.remove());

    // 이미지 원본 크기 (픽셀 좌표 기준)
    const imgW = playCurrentStory.imageSize?.width || 1;
    const imgH = playCurrentStory.imageSize?.height || 1;
    
    // 헬퍼 함수: 픽셀 좌표를 퍼센트로 변환
    const toPercentX = (px) => (px / imgW) * 100;
    const toPercentY = (px) => (px / imgH) * 100;

    playCurrentStory.episodes.forEach(ep => {
        if (!ep.entryRegion || !ep.entryRegion.coords) return;

        const region = document.createElement('div');
        region.className = 'click-region';
        region.title = ep.name;

        const shape = ep.entryRegion.shape;
        const coords = ep.entryRegion.coords;

        if (shape === 'rect') {
            // 픽셀 좌표를 퍼센트로 변환
            region.style.left = `${toPercentX(coords.x)}%`;
            region.style.top = `${toPercentY(coords.y)}%`;
            region.style.width = `${toPercentX(coords.width)}%`;
            region.style.height = `${toPercentY(coords.height)}%`;
        }
        else if (shape === 'circle') {
            // 픽셀 좌표를 퍼센트로 변환
            const rPercentX = toPercentX(coords.r);
            const rPercentY = toPercentY(coords.r);
            region.style.left = `${toPercentX(coords.cx) - rPercentX}%`;
            region.style.top = `${toPercentY(coords.cy) - rPercentY}%`;
            region.style.width = `${rPercentX * 2}%`;
            region.style.height = `${rPercentY * 2}%`;
            region.style.borderRadius = '50%';
        }
        else if (shape === 'ellipse') {
            // 픽셀 좌표를 퍼센트로 변환
            const rxPercent = toPercentX(coords.rx);
            const ryPercent = toPercentY(coords.ry);
            region.style.left = `${toPercentX(coords.cx) - rxPercent}%`;
            region.style.top = `${toPercentY(coords.cy) - ryPercent}%`;
            region.style.width = `${rxPercent * 2}%`;
            region.style.height = `${ryPercent * 2}%`;
            region.style.borderRadius = '50%';
        }
        else if (shape === 'polygon') {
            region.style.left = '0';
            region.style.top = '0';
            region.style.width = '100%';
            region.style.height = '100%';

            // Handle both array types for robust rendering (픽셀 좌표를 퍼센트로 변환)
            let pointsStr = "";
            if (Array.isArray(coords)) {
                // [{x,y}] format
                pointsStr = coords.map(p => `${toPercentX(p.x)}% ${toPercentY(p.y)}%`).join(', ');
            } else if (coords.points && Array.isArray(coords.points)) {
                // {points: [[x,y]]} or {points: [{x,y}]}
                pointsStr = coords.points.map(p => {
                    const px = Array.isArray(p) ? p[0] : p.x;
                    const py = Array.isArray(p) ? p[1] : p.y;
                    return `${toPercentX(px)}% ${toPercentY(py)}%`;
                }).join(', ');
            }

            if (pointsStr) region.style.clipPath = `polygon(${pointsStr})`;
        }
        else if (shape === 'path') {
            region.style.left = '0';
            region.style.top = '0';
            region.style.width = '100%';
            region.style.height = '100%';

            // For click regions, we approximate path with polygon for clip-path support
            // (픽셀 좌표를 퍼센트로 변환)
            let pointsStr = "";
            if (coords.points && Array.isArray(coords.points)) {
                pointsStr = coords.points.map(p => {
                    const px = Array.isArray(p) ? p[0] : p.x;
                    const py = Array.isArray(p) ? p[1] : p.y;
                    return `${toPercentX(px)}% ${toPercentY(py)}%`;
                }).join(', ');
            }

            if (pointsStr) region.style.clipPath = `polygon(${pointsStr})`;
        }

        region.addEventListener('click', () => {
            showEpisodeView(ep);
        });

        playMainImageContainer.appendChild(region);
    });
}

// Exports
window.initPlayer = initPlayer;
window.playStory = playStory;
