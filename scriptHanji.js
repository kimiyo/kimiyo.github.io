/**
 * 한지(Hanji) 배경 생성 모듈
 * 
 * 프랙탈 노이즈(FBM)를 사용하여 한국 전통 한지의 닥나무 펄프 질감을 시뮬레이션합니다.
 * 자체적으로 DOM 구조와 스타일을 관리하는 완전 자립형 모듈입니다.
 * 
 * @features
 * - 프랙탈 노이즈(FBM): 한지의 구름 같은 닥나무 펄프 질감 생성
 * - 벡터 섬유: 지푸라기 같은 섬유질을 매번 다르게 그려 선명한 해상도 유지
 * - 조명 효과: 다크 모드 시 촛불 효과와 빛 투과(Backlight) 효과 지원
 * 
 * @usage 기본 사용법
 * // body 태그에 배경 생성 (가장 간단한 방법)
 * import { Hanji } from './scriptHanji.js';
 * const hanji = new Hanji(document.body, {
 *     baseColor: { r: 245, g: 240, b: 230 }, // 기본 종이 색상 (아이보리)
 *     fiberColor: { r: 140, g: 120, b: 100 }  // 섬유 색상 (갈색)
 * });
 * hanji.start(); // 애니메이션 시작
 * 
 * @usage 라이트 모드 (맑은 한지)
 * const lightConfig = {
 *     baseColor: { r: 245, g: 240, b: 230 }, // 밝은 미색
 *     fiberColor: { r: 140, g: 120, b: 100 }, // 자연스러운 지푸라기 색
 *     paperRoughness: 25, // 종이의 거친 정도
 *     fiberDensity: 1.2,  // 섬유 밀도
 *     backgroundGradient: null, // 그라디언트 없음
 *     candle: null,       // 촛불 효과 없음
 *     backlight: null    // 백라이트 효과 없음
 * };
 * 
 * @usage 다크 모드 (촛불 효과)
 * const darkConfig = {
 *     baseColor: { r: 35, g: 30, b: 25 }, // 어두운 배경
 *     fiberColor: { r: 180, g: 150, b: 120 }, // 어둠 속에서 빛나는 섬유
 *     paperRoughness: 15,
 *     backgroundGradient: 'radial-gradient(circle at 25% 50%, #8e562a 0%, #442a0e 60%, #1a1510 100%)',
 *     candle: {
 *         src: 'assets/candle.svg',
 *         x: 0.25, y: 0.5, width: '200px', blur: 4, opacity: 1.0
 *     },
 *     backlight: {
 *         x: 0.25, y: 0.5, radius: 1600, minAlpha: 0.1
 *     }
 * };
 * 
 * @api
 * - new Hanji(target, options?): target은 HTMLElement (예: document.body)
 * - start(): 애니메이션 시작
 * - stop(): 애니메이션 중지
 * - updateConfig(newConfig): 설정 업데이트 (테마 전환 시 사용)
 * - resize(): 크기 재계산 (window resize 시 자동 처리)
 * - destroy(): 애니메이션 중지 및 이벤트 리스너 정리
 * 
 * @example 테마 토글 예시
 * let isDark = false;
 * button.addEventListener('click', () => {
 *     isDark = !isDark;
 *     hanji.updateConfig(isDark ? darkConfig : lightConfig);
 * });
 */

// Permutation table for Perlin noise
const p = new Uint8Array(512);
for (let i = 0; i < 256; i++) p[i] = i;
// Shuffle
for (let i = 255; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [p[i], p[r]] = [p[r], p[i]];
}
for (let i = 0; i < 256; i++) p[256 + i] = p[i];

// Utility functions
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = fade(x);
    const v = fade(y);
    const w = fade(z);

    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

    return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),
        grad(p[BA], x - 1, y, z)),
        lerp(u, grad(p[AB], x, y - 1, z),
            grad(p[BB], x - 1, y - 1, z))),
        lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1),
            grad(p[BA + 1], x - 1, y, z - 1)),
            lerp(u, grad(p[AB + 1], x, y - 1, z - 1),
                grad(p[BB + 1], x - 1, y - 1, z - 1))));
}

function fbm(x, y, z) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < 4; i++) {
        total += perlin(x * frequency, y * frequency, z * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }

    return total / maxValue;
}


export class Hanji {
    constructor(target, options = {}) {
        // Default Configuration
        this.config = Object.assign({
            baseColor: { r: 240, g: 234, b: 224 }, // Warm ivory/beige
            fiberColor: { r: 160, g: 140, b: 120 }, // Darker brownish fiber
            noiseScale: 0.003,
            fiberDensity: 0.55,
            paperRoughness: 20,
            animationSpeed: 0.0005,
            lightLeakSpeed: 0.002,

            // Custom Texture Image (IGNORED in Procedural Mode)
            textureImage: null,

            // Background Gradient (CSS)
            backgroundGradient: null,

            // Backlight / Candle Config
            backlight: null, // { x, y, radius, minAlpha }
            candle: null // { src, x, y, width, blur }
        }, options);

        this.time = 0;
        this.animationId = null;
        this.isAnimating = false;

        // 1. Setup Container
        this.initDOM(target);

        // Bind methods
        this.resize = this.resize.bind(this);
        this.draw = this.draw.bind(this);

        // Initialize size
        window.addEventListener('resize', this.resize);
        this.resize();

        // Initial Effect Application
        this.applyEffects();
    }

    // Helper to load image (Kept for compatibility but not used in procedural mode)
    loadTexture(url) {
        // No-op for procedural mode
    }

    initDOM(target) {
        // Determine parent
        let parentElement;
        if (typeof target === 'string') {
            parentElement = document.querySelector(target);
        } else if (target instanceof HTMLElement) {
            parentElement = target;
        }
        if (!parentElement) parentElement = document.body;

        // Create Main Container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '-1';
        this.container.style.overflow = 'hidden';
        this.container.style.transition = 'background 2s ease';

        // 1. Background Layer (for Gradient)
        this.bgLayer = document.createElement('div');
        this.bgLayer.style.position = 'absolute';
        this.bgLayer.style.top = '0';
        this.bgLayer.style.left = '0';
        this.bgLayer.style.width = '100%';
        this.bgLayer.style.height = '100%';
        this.bgLayer.style.transition = 'opacity 2s ease';
        this.container.appendChild(this.bgLayer);

        // 2. Candle Layer
        this.candleLayer = document.createElement('div');
        this.candleLayer.style.position = 'absolute';
        this.candleLayer.style.opacity = '0';
        this.candleLayer.style.transition = 'opacity 2s ease';

        this.candleImg = document.createElement('img');
        this.candleImg.style.width = '100%';
        this.candleImg.style.height = '100%';
        this.candleImg.style.display = 'block';
        this.candleLayer.appendChild(this.candleImg);
        this.container.appendChild(this.candleLayer);

        // 3. Canvas Layer
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.transition = 'opacity 2s ease'; // For potential fade
        this.container.appendChild(this.canvas);

        // Append to parent
        parentElement.prepend(this.container);
        this.ctx = this.canvas.getContext('2d');
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.baseTexture = null;
        if (!this.isAnimating) {
            requestAnimationFrame(this.draw);
        }
    }

    applyEffects() {
        // Appply Background Gradient
        if (this.config.backgroundGradient) {
            this.container.style.background = this.config.backgroundGradient;
        } else {
            this.container.style.background = 'transparent';
        }

        // Apply Candle Settings
        if (this.config.candle) {
            this.candleImg.src = this.config.candle.src;
            this.candleLayer.style.width = this.config.candle.width || '200px';
            this.candleLayer.style.height = 'auto'; // aspect maintain

            // Position
            const cx = (this.config.candle.x !== undefined) ? this.config.candle.x * 100 : 50;
            const cy = (this.config.candle.y !== undefined) ? this.config.candle.y * 100 : 50;
            this.candleLayer.style.top = `${cy}%`;
            this.candleLayer.style.left = `${cx}%`;
            this.candleLayer.style.transform = 'translate(-50%, -20%)'; // Anchor adjust

            // Blur
            const blur = this.config.candle.blur || 0;
            this.candleLayer.style.filter = `blur(${blur}px)`;

            // Opacity (On/Off)
            this.candleLayer.style.opacity = (this.config.candle.opacity !== undefined) ? this.config.candle.opacity : 0;
        } else {
            this.candleLayer.style.opacity = '0';
        }

        // Canvas Opacity if needed
        this.canvas.style.opacity = (this.config.backlight) ? '0.9' : '1.0';
    }

    generateBaseTexture() {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.width;
        offCanvas.height = this.height;
        const offCtx = offCanvas.getContext('2d');

        // 1. Base Layer (Solid Color)
        offCtx.fillStyle = `rgb(${this.config.baseColor.r}, ${this.config.baseColor.g}, ${this.config.baseColor.b})`;
        offCtx.fillRect(0, 0, this.width, this.height);

        const id = offCtx.createImageData(this.width, this.height);
        const data = id.data;

        // Config Params
        const baseR = this.config.baseColor.r;
        const baseG = this.config.baseColor.g;
        const baseB = this.config.baseColor.b;
        const roughness = this.config.paperRoughness || 20;

        const backlight = this.config.backlight;
        let backlightX, backlightY, backlightR;
        if (backlight) {
            backlightX = backlight.x * this.width;
            backlightY = backlight.y * this.height;
            backlightR = backlight.radius || Math.max(this.width, this.height) * 0.8;
        }

        // 2. Procedural Pulp & Grain (Pixel Manipulation)
        // Optimized loop for noise generation
        for (let i = 0; i < data.length; i += 4) {
            const pIdx = i / 4;
            const x = pIdx % this.width;
            const y = Math.floor(pIdx / this.width);

            // A. Paper Clouds (FBM Low-Frequency Noise)
            // Simulates uneven pulp density
            const scale1 = 0.002;
            const pulpNoise = fbm(x * scale1, y * scale1, 0); // -1 to 1 approx
            const pulpVariation = pulpNoise * 15; // +/- 15 color shift

            // B. Surface Grain (High-Frequency Noise)
            // Simulates crisp texture
            const grain = (Math.random() - 0.5) * roughness;

            // Apply to Base Color
            let r = baseR + pulpVariation + grain;
            let g = baseG + pulpVariation + grain;
            let b = baseB + pulpVariation + grain;

            // Clamp colors
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));

            // Set RGB
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;

            // C. Transparency / Backlight Logic
            let alpha = 255;
            if (backlight) {
                const dx = x - backlightX;
                const dy = y - backlightY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let lightFactor = Math.min(dist / backlightR, 1.0);
                // Ease out (Smooth gradient)
                lightFactor = lightFactor * lightFactor * (3 - 2 * lightFactor);

                const targetOpacity = backlight.minAlpha + (1 - backlight.minAlpha) * lightFactor;

                // Add structure to shadow (Pulp blocks light)
                // Denser pulp = Darker shadow
                const densityMask = (pulpNoise * 0.5 + 0.5); // 0 to 1
                let finalAlpha = (targetOpacity + densityMask * 0.1) * 255;

                finalAlpha = Math.max(0, Math.min(255, finalAlpha));
                alpha = finalAlpha;
            }
            data[i + 3] = alpha;
        }

        offCtx.putImageData(id, 0, 0);

        // 3. Fibers (Vector Drawing)
        // Draw crisp "straw-like" fibers on top
        const density = this.config.fiberDensity || 0.8;
        // Adjust count based on area
        const fiberCount = (this.width * this.height) / (3000 / density);

        offCtx.lineCap = 'round';

        for (let i = 0; i < fiberCount; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            // Variable length for natural look
            const len = Math.random() * 25 + 5;
            const angle = Math.random() * Math.PI * 2;

            // Variable thickness
            const width = Math.random() * 1.5 + 0.5;

            // Use configured fiber color
            const fColor = this.config.fiberColor;
            // Randomize opacity slightly for depth
            const op = (Math.random() * 0.3 + 0.2).toFixed(2);

            // Special Dark Mode Fiber handling
            let strokeStyle;
            if (backlight) {
                // In dark mode, fibers block light -> Darker
                // Warm, semi-transparent black/brown
                strokeStyle = `rgba(30, 20, 10, ${Math.random() * 0.2 + 0.1})`;
            } else {
                // Light mode: Visible straw color
                strokeStyle = `rgba(${fColor.r}, ${fColor.g}, ${fColor.b}, ${op})`;
            }

            offCtx.beginPath();
            offCtx.strokeStyle = strokeStyle;
            offCtx.lineWidth = width;

            // Quadratic curve for slight bend
            offCtx.moveTo(x, y);
            offCtx.quadraticCurveTo(
                x + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 5,
                y + Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * 5,
                x + Math.cos(angle) * len,
                y + Math.sin(angle) * len
            );
            offCtx.stroke();
        }

        return offCanvas;
    }

    updateConfig(newConfig) {
        this.config = Object.assign(this.config, newConfig);
        this.baseTexture = null;
        this.applyEffects();

        if (!this.isAnimating) {
            requestAnimationFrame(this.draw);
        }
    }

    draw() {
        if (!this.baseTexture || this.baseTexture.width !== this.width) {
            this.baseTexture = this.generateBaseTexture();
        }
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.baseTexture, 0, 0);

        // Dynamic Light/Shadow via FBM (Low res scaled up)
        const lightMapW = 64;
        const lightMapH = 64;

        const lightId = this.ctx.createImageData(lightMapW, lightMapH);
        const lData = lightId.data;

        for (let i = 0; i < lData.length; i += 4) {
            const idx = i / 4;
            const lx = idx % lightMapW;
            const ly = Math.floor(idx / lightMapW);

            const n = fbm(lx * 0.05, ly * 0.05, this.time * 0.5);
            const alpha = (n + 1) * 0.5;
            const a = Math.pow(alpha, 3) * 150;

            lData[i] = 255;
            lData[i + 1] = 250;
            lData[i + 2] = 240;
            lData[i + 3] = a;
        }

        const tempC = document.createElement('canvas');
        tempC.width = lightMapW;
        tempC.height = lightMapH;
        tempC.getContext('2d').putImageData(lightId, 0, 0);

        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.drawImage(tempC, 0, 0, this.width, this.height);

        this.ctx.globalCompositeOperation = 'source-over';

        this.time += this.config.animationSpeed;

        if (this.isAnimating) {
            this.animationId = requestAnimationFrame(this.draw);
        }
    }

    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.draw();
        }
    }

    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this.resize);
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
