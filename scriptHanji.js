/**
 * Hanji Background Generator Module
 * Simulates Korean traditional paper texture using Fractal Brownian Motion (FBM) noise.
 * 
 * @usage
 * // 기본 사용법 (자동으로 전체 화면 배경 생성)
 * import { Hanji } from './scriptHanji.js';
 * const background = new Hanji();
 * background.start();
 * 
 * // 기존 canvas 요소 사용
 * const background = new Hanji('#myCanvas');
 * background.start();
 * 
 * // 설정 옵션과 함께 사용
 * const background = new Hanji(null, {
 *   baseColor: { r: 240, g: 234, b: 224 },    // 배경색 (RGB)
 *   fiberColor: { r: 160, g: 140, b: 120 },   // 섬유 색상 (RGB)
 *   paperRoughness: 20,                       // 질감 거칠기
 *   animationSpeed: 0.0005,                   // 애니메이션 속도
 * });
 * background.start();
 * 
 * @api
 * - new Hanji(target?, options?): target은 선택자 문자열('#id'), HTMLElement, 또는 null
 * - start(): 애니메이션 시작
 * - stop(): 애니메이션 중지
 * - resize(): 크기 재계산 (window resize 시 자동 처리)
 * - destroy(): 애니메이션 중지 및 이벤트 리스너 정리
 */

// Permutation table for Perlin noise (Module-level constant, shared by all instances)
const p = new Uint8Array(512);
for (let i = 0; i < 256; i++) p[i] = i;
// Shuffle
for (let i = 255; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [p[i], p[r]] = [p[r], p[i]];
}
for (let i = 0; i < 256; i++) p[256 + i] = p[i];

// Utility functions (Module-level private helpers)
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

    // 4 Octaves
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
        }, options);

        this.time = 0;
        this.animationId = null;
        this.isAnimating = false;

        // Setup Canvas
        if (typeof target === 'string') {
            this.canvas = document.querySelector(target);
        } else if (target instanceof HTMLElement) {
            this.canvas = target;
        }

        if (!this.canvas) {
            // If no target provided or not found, create a fixed background canvas
            this.canvas = document.createElement('canvas');
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '-1';
            document.body.prepend(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.baseTexture = null;

        // Bind methods
        this.resize = this.resize.bind(this);
        this.draw = this.draw.bind(this);

        // Initialize size
        window.addEventListener('resize', this.resize);
        this.resize();
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.baseTexture = null; // Invalidate base texture to regenerate on next frame
        if (!this.isAnimating) {
            // Redraw once if not animating to prevent blank screen
            requestAnimationFrame(this.draw);
        }
    }

    generateBaseTexture() {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.width;
        offCanvas.height = this.height;
        const offCtx = offCanvas.getContext('2d');

        const id = offCtx.createImageData(this.width, this.height);
        const data = id.data;

        for (let i = 0; i < data.length; i += 4) {
            // Base color
            data[i] = this.config.baseColor.r;
            data[i + 1] = this.config.baseColor.g;
            data[i + 2] = this.config.baseColor.b;
            data[i + 3] = 255;

            // Add Grain
            const grain = (Math.random() - 0.5) * this.config.paperRoughness;
            data[i] += grain;
            data[i + 1] += grain;
            data[i + 2] += grain;
        }

        offCtx.putImageData(id, 0, 0);

        offCtx.strokeStyle = `rgba(${this.config.fiberColor.r}, ${this.config.fiberColor.g}, ${this.config.fiberColor.b}, 0.3)`;
        offCtx.lineWidth = 1;

        // Draw many small curve segments (fibers)
        const fiberCount = (this.width * this.height) / 4000;
        for (let i = 0; i < fiberCount; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const len = Math.random() * 20 + 5;
            const angle = Math.random() * Math.PI * 2;

            offCtx.beginPath();
            offCtx.moveTo(x, y);
            // Quadratic curve for slight bend
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

    draw() {
        if (!this.baseTexture || this.baseTexture.width !== this.width) {
            this.baseTexture = this.generateBaseTexture();
        }
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

            // n is approx -1 to 1
            const alpha = (n + 1) * 0.5; // 0 to 1
            // Enhance contrast for "leak" effect
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
        if (this.canvas && this.canvas.parentNode) {
            // Only remove if we created it spontaneously? 
            // Better not to remove elements passed by user unless documented.
            // But if we created it in default constructor logic, we might want to.
            // For now, let's just clear context or leave it be.
        }
    }
}

