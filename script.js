/**
 * Romantic Morphing Particle Experience - Luxury Edition
 * - Initial Falling "i love you" Rain Scene (Rose petals begin from FORM_I)
 * - Wide-Spaced, Crystal-Clear Glowing Typography for "I", "LOVE", "YOU" (Zero Moiré, Zero Clutter)
 * - 3D Crystal Beating Heart & Glowing Typography Grand Finale (Clean & Unobstructed)
 * - Living Heartbeat Pulse & Interactive Harp Synthesizer
 * - Glassmorphism Action Bar & Romantic Quote Ribbon
 */

// --- Configuration ---
const CONFIG = {
    rainDuration: 5200,        // Rain scene duration in ms
    assemblyDuration: 1600,    // Assembly time
    letterHoldDuration: 1300,  // Crisp hold time
    disperseDuration: 1200,    // Outward swirl dispersion
    rainDropCount: 48,         // Rain streams
    colors: [
        '#ff2a6d', '#ff758c', '#ff5493', '#ffffff', 
        '#ffb8c6', '#ffe066', '#ff007f', '#f72585'
    ]
};

// --- States ---
const STATES = {
    IDLE: -1,
    RAIN: 0,
    FORM_I: 1,
    FORM_LOVE: 2,
    FORM_YOU: 3,
    FINALE: 4,
    PHOTOS: 5,
    LETTER: 6
};

const QUOTES = {
    [STATES.RAIN]: "Every falling drop whispers my love for you... ✨",
    [STATES.FORM_I]: "You are the one my heart chose... 💖",
    [STATES.FORM_LOVE]: "In a world of billions, it's always been you... 🌹",
    [STATES.FORM_YOU]: "My heart beats only for you... to kabhi marna mat warna bc mai bhi mar jaauga 💕",
    [STATES.FINALE]: "You are my today and all of my tomorrows baby ❤️ Forever & Always ✨"
};

// --- Photos for Cinematic Slideshow ---
const PHOTOS_DATA = [
    { src: '170025.jpg', caption: 'The prettiest smile in the entire universe ✨' },
    { src: 'IMG_20260801_122902_015.jpg', caption: 'Every little moment with you feels like pure magic ❤️' },
    { src: '172059.jpg', caption: 'My peace, my sunshine, my sweetest dream 🌸' },
    { src: 'IMG_20260814_135356_665.jpg', caption: 'Can never stop looking at you, my prettiest queen 👑' },
    { src: 'Screenshot_20260727_075100_Gallery.jpg', caption: 'Tere bina har ek lamha adhoora sa lagda hai 💕' },
    { src: 'Screenshot_20260826_011700_Instagram.jpg', caption: 'You make this entire world so magical and bright ✨' },
    { src: 'Screenshot_20260828_154322_Instagram.jpg', caption: 'Forever & always holding your hand, meri jaan ❤️' }
];

// Preload images for instant buttery-smooth transitions
PHOTOS_DATA.forEach(item => {
    const img = new Image();
    img.src = item.src;
});

let currentState = STATES.IDLE;
let stateStartTime = 0;
let stateSubPhase = 'assembling'; // 'assembling', 'holding', 'dispersing'
let subPhaseStartTime = 0;

// --- Canvas & High DPI Setup ---
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
let width = window.innerWidth;
let height = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
    if (currentState >= STATES.FORM_I && currentState <= STATES.FINALE) {
        buildTargetPointsForState(currentState);
    }
}
window.addEventListener('resize', resize);

// --- GPU Sprite Cache for Instantaneous Blitting ---
const spriteCache = {};
function getParticleSprite(char, color, size, fontFam) {
    const key = `${char}_${color}_${size}_${fontFam}`;
    if (spriteCache[key]) return spriteCache[key];

    const sCanvas = document.createElement('canvas');
    const sCtx = sCanvas.getContext('2d');
    const pad = 10;
    const totalSize = (size + pad) * 2;
    sCanvas.width = totalSize;
    sCanvas.height = totalSize;
    const center = totalSize / 2;

    if (char === '•') {
        // Render a sparkling diamond stardust orb
        const rad = size * 0.45;
        const grad = sCtx.createRadialGradient(center, center, 0, center, center, rad * 2);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, color);
        grad.addColorStop(0.8, color);
        grad.addColorStop(1, 'transparent');
        sCtx.fillStyle = grad;
        sCtx.beginPath();
        sCtx.arc(center, center, rad * 2, 0, Math.PI * 2);
        sCtx.fill();

        // Crisp white core
        sCtx.fillStyle = '#ffffff';
        sCtx.beginPath();
        sCtx.arc(center, center, rad * 0.45, 0, Math.PI * 2);
        sCtx.fill();
    } else {
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.shadowColor = color;
        sCtx.shadowBlur = 6;
        sCtx.fillStyle = color;
        sCtx.font = `900 ${size}px ${fontFam}`;
        sCtx.fillText(char, center, center);
    }

    spriteCache[key] = {
        canvas: sCanvas,
        halfSize: totalSize / 2
    };
    return spriteCache[key];
}

const glowSprites = {};
function getGlowSprite(color, radius) {
    const r = Math.round(radius);
    const key = `${color}_${r}`;
    if (glowSprites[key]) return glowSprites[key];

    const sCanvas = document.createElement('canvas');
    const sCtx = sCanvas.getContext('2d');
    const dim = r * 2;
    sCanvas.width = dim;
    sCanvas.height = dim;

    const grad = sCtx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    sCtx.fillStyle = grad;
    sCtx.beginPath();
    sCtx.arc(r, r, r, 0, Math.PI * 2);
    sCtx.fill();

    glowSprites[key] = {
        canvas: sCanvas,
        halfDim: r
    };
    return glowSprites[key];
}

// --- Romantic Audio: Song Playback + Interactive Harp SFX ---
class RomanticAudio {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.harpScale = [311.13, 349.23, 392.00, 466.16, 523.25, 622.25, 698.46, 783.99, 932.33];

        // Main song — the .m4a file in the project folder
        this.song = new Audio('Video Project 1.m4a');
        this.song.loop = true;
        this.song.volume = 1.0;
        this.song.preload = 'auto';
        this.song.load();
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    start() {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.song.play().catch(() => {});
    }

    stop() {
        this.isPlaying = false;
        this.song.pause();
    }

    playTone(freq, duration, type = 'sine', gainVal = 0.05, attack = 0.4, release = 1.8) {
        if (!this.ctx || !this.isPlaying) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(gainVal, now + attack);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration + release + 0.05);
        } catch (e) {}
    }

    playChime(freq, gain = 0.08) {
        if (!this.ctx || !this.isPlaying) return;
        this.playTone(freq, 0.4, 'triangle', gain, 0.02, 1.4);
    }

    playInteractiveHarp(normY = 0.5) {
        if (!this.ctx || !this.isPlaying) return;
        const noteIdx = Math.floor((1 - normY) * (this.harpScale.length - 1));
        const safeIdx = Math.max(0, Math.min(this.harpScale.length - 1, noteIdx));
        const freq = this.harpScale[safeIdx];
        this.playChime(freq, 0.11);
    }

    playTransitionChime() {
        if (!this.ctx || !this.isPlaying) return;
        const arpeggio = [523.25, 659.25, 783.99, 1046.50];
        arpeggio.forEach((note, index) => {
            setTimeout(() => {
                this.playChime(note, 0.09);
            }, index * 90);
        });
    }
}

const audioManager = new RomanticAudio();

// --- Interactive Fireworks Particle System ---
class FireworkSpark {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.alpha = 1;
        this.size = 2;
        this.color = '#ff758c';
        this.decay = 0.02;
        this.char = '✨';
        this.isGlyph = false;
    }

    init(x, y, color, vx, vy, isGlyph = false, char = '✨', decay = 0.02, size = 12) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.isGlyph = isGlyph;
        this.char = char;
        this.decay = decay;
        this.size = size;
        this.alpha = 1.0;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy = this.vy * 0.96 + 0.08;
        this.alpha -= this.decay;
        if (this.alpha <= 0) {
            this.active = false;
        }
    }

    draw(context) {
        if (!this.active || this.alpha <= 0.01) return;
        context.save();
        context.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        if (this.isGlyph) {
            context.font = `${this.size}px sans-serif`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(this.char, this.x, this.y);
        } else {
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fill();
        }
        context.restore();
    }
}

const fireworksPool = [];
for (let i = 0; i < 250; i++) {
    fireworksPool.push(new FireworkSpark());
}

function spawnHeartFirework(x, y, count = 22) {
    const glyphs = ['❤️', '💖', '✨', '💕', '🌸', '♥'];
    const palette = ['#ff2a6d', '#ff758c', '#ffffff', '#ffe066', '#ff007f', '#ffb8c6'];
    let spawned = 0;

    for (let i = 0; i < fireworksPool.length && spawned < count; i++) {
        const spark = fireworksPool[i];
        if (!spark.active) {
            const angle = (spawned / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
            const speed = 3.5 + Math.random() * 5.0;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const isGlyph = Math.random() > 0.45;
            const char = glyphs[Math.floor(Math.random() * glyphs.length)];
            const color = palette[Math.floor(Math.random() * palette.length)];
            const size = isGlyph ? (12 + Math.random() * 10) : (2 + Math.random() * 2.5);
            const decay = 0.018 + Math.random() * 0.02;

            spark.init(x, y, color, vx, vy, isGlyph, char, decay, size);
            spawned++;
        }
    }
}

// --- Pre-rendered Dreamy Cosmic Bokeh Glow Orbs ---
class BokehOrb {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = 45 + Math.random() * 70;
        this.baseAlpha = 0.03 + Math.random() * 0.06;
        this.alpha = this.baseAlpha;
        this.color = ['#ff2a6d', '#8a2be2', '#ff758c', '#ff5493', '#ffe066'][Math.floor(Math.random() * 5)];
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.pulseSpeed = 0.001 + Math.random() * 0.002;
        this.sprite = getGlowSprite(this.color, this.radius);
    }
    update(now) {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha = this.baseAlpha + Math.sin(now * this.pulseSpeed) * 0.02;
        if (this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100) {
            this.reset();
        }
    }
    draw(context) {
        if (this.alpha <= 0.005 || !this.sprite) return;
        context.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        context.drawImage(this.sprite.canvas, this.x - this.sprite.halfDim, this.y - this.sprite.halfDim);
    }
}

const bokehOrbs = [];
for (let i = 0; i < 10; i++) {
    bokehOrbs.push(new BokehOrb());
}

// --- Rain Drop Class ---
class RainDrop {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height - height : -40 - Math.random() * 200;
        this.speed = 3.5 + Math.random() * 4.5;
        this.text = 'i love you';
        this.fontSize = 11 + Math.random() * 9;
        this.alpha = 0.3 + Math.random() * 0.7;
        this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
        this.trailCount = 3 + Math.floor(Math.random() * 3);
    }

    update() {
        this.y += this.speed;
        if (this.y > height + 60) {
            this.reset();
        }
    }

    draw(context) {
        context.font = `700 ${this.fontSize}px 'Outfit', sans-serif`;
        context.fillStyle = this.color;
        context.globalAlpha = this.alpha;
        context.fillText(this.text, this.x, this.y);

        for (let i = 1; i <= this.trailCount; i++) {
            const ty = this.y - i * (this.fontSize * 1.15);
            if (ty > 0) {
                context.globalAlpha = this.alpha * (1 - i / (this.trailCount + 1)) * 0.35;
                context.fillText('•', this.x + 8, ty);
            }
        }
    }
}

// --- Stardust Particle Class (Convergence & Galaxy Burst) ---
class StardustParticle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.alpha = 0;
        this.targetAlpha = 0.9;
        this.active = false;
        this.sprite = null;
    }

    initTarget(tx, ty, color, char = '✨', fontSize = 12) {
        this.targetX = tx;
        this.targetY = ty;
        this.active = true;
        this.targetAlpha = 0.85 + Math.random() * 0.15;
        this.sprite = getParticleSprite(char, color, fontSize, "'Outfit', sans-serif");
        this.spawnFromRandomEdge();
    }

    spawnFromRandomEdge() {
        const edge = Math.floor(Math.random() * 4);
        const dist = 80 + Math.random() * 220;
        if (edge === 0) {
            this.x = Math.random() * width;
            this.y = -dist;
        } else if (edge === 1) {
            this.x = Math.random() * width;
            this.y = height + dist;
        } else if (edge === 2) {
            this.x = -dist;
            this.y = Math.random() * height;
        } else {
            this.x = width + dist;
            this.y = Math.random() * height;
        }

        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x) + (Math.random() - 0.5) * 0.35;
        const entrySpeed = 8.5 + Math.random() * 8.5;
        this.vx = Math.cos(angle) * entrySpeed;
        this.vy = Math.sin(angle) * entrySpeed;
        this.alpha = 0.9;
    }

    explodeOutward() {
        const centerX = width / 2;
        const centerY = height / 2;
        const angle = Math.atan2(this.y - centerY, this.x - centerX) + (Math.random() - 0.5) * 0.6;
        const force = 7.0 + Math.random() * 8.5;
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force;
    }

    update(heartBeatScale = 1) {
        if (!this.active) return;

        if (stateSubPhase === 'assembling') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 70) {
                const angle = Math.atan2(dy, dx);
                this.vx = this.vx * 0.93 + Math.cos(angle) * 0.85;
                this.vy = this.vy * 0.93 + Math.sin(angle) * 0.85;
            } else {
                this.vx = this.vx * 0.72 + dx * 0.09;
                this.vy = this.vy * 0.72 + dy * 0.09;
            }

            this.x += this.vx;
            this.y += this.vy;
            this.alpha = Math.min(1, this.alpha + 0.04);
        } else if (stateSubPhase === 'holding') {
            const centerX = width / 2;
            const centerY = height / 2;
            const finalTx = centerX + (this.targetX - centerX) * heartBeatScale;
            const finalTy = centerY + (this.targetY - centerY) * heartBeatScale;

            this.vx = this.vx * 0.55 + (finalTx - this.x) * 0.18;
            this.vy = this.vy * 0.55 + (finalTy - this.y) * 0.18;

            this.x += this.vx;
            this.y += this.vy;
            this.alpha = this.targetAlpha;
        } else if (stateSubPhase === 'dispersing') {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 1.02;
            this.vy *= 1.02;
            this.alpha *= 0.96;
        }
    }

    draw(context) {
        if (!this.active || this.alpha <= 0.01 || !this.sprite) return;
        context.globalAlpha = Math.min(1, this.alpha);
        context.drawImage(
            this.sprite.canvas,
            this.x - this.sprite.halfSize,
            this.y - this.sprite.halfSize
        );
    }
}

// --- Ambient Background Effects ---

// 1. Twinkling Background Stars & Fireflies
class BackgroundStar {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = 0.8 + Math.random() * 2.0;
        this.baseAlpha = 0.15 + Math.random() * 0.5;
        this.alpha = this.baseAlpha;
        this.twinkleSpeed = 0.0015 + Math.random() * 0.003;
        this.color = ['#ffffff', '#ffb8c6', '#ffe066', '#ff758c'][Math.floor(Math.random() * 4)];
        this.driftX = (Math.random() - 0.5) * 0.1;
        this.driftY = (Math.random() - 0.5) * 0.1;
    }
    update(now) {
        this.x += this.driftX;
        this.y += this.driftY;
        this.alpha = this.baseAlpha + Math.sin(now * this.twinkleSpeed) * 0.3;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();
    }
    draw(context) {
        if (this.alpha <= 0.02) return;
        context.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
    }
}

// 2. Glowing Shooting Stars
class ShootingStar {
    constructor() {
        this.active = false;
        this.lastSpawn = performance.now();
    }
    trigger(now) {
        this.x = Math.random() * width * 0.75;
        this.y = Math.random() * (height * 0.4);
        this.length = 70 + Math.random() * 90;
        this.speed = 12 + Math.random() * 7;
        this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
        this.alpha = 1.0;
        this.active = true;
        this.lastSpawn = now;
    }
    update(now) {
        if (!this.active) {
            if (now - this.lastSpawn > 3000 + Math.random() * 2000) {
                this.trigger(now);
            }
            return;
        }
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.alpha -= 0.024;
        if (this.alpha <= 0 || this.x > width + 100 || this.y > height + 100) {
            this.active = false;
            this.lastSpawn = now;
        }
    }
    draw(context) {
        if (!this.active || this.alpha <= 0.01) return;
        context.save();
        context.globalAlpha = this.alpha;
        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;
        const grad = context.createLinearGradient(this.x, this.y, tailX, tailY);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ff758c');
        grad.addColorStop(1, 'transparent');
        context.strokeStyle = grad;
        context.lineWidth = 2.0;
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(tailX, tailY);
        context.stroke();
        context.restore();
    }
}

// 3. Floating Rose Petals (drifts only from FORM_I onwards)
class FloatingRosePetal {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = -20 - Math.random() * 100;
        this.size = 7 + Math.random() * 8;
        this.speedY = 0.8 + Math.random() * 1.1;
        this.speedX = 0.3 + Math.random() * 0.6;
        this.angle = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.025;
        this.color = ['#ff2a6d', '#ff758c', '#ff5493', '#ffb8c6'][Math.floor(Math.random() * 4)];
        this.alpha = 0.18 + Math.random() * 0.35;
        this.wobbleSpeed = 0.002 + Math.random() * 0.002;
    }
    update(now) {
        this.y += this.speedY;
        this.x += Math.sin(now * this.wobbleSpeed) * this.speedX;
        this.angle += this.rotSpeed;
        if (this.y > height + 30) this.reset();
    }
    draw(context) {
        context.save();
        context.globalAlpha = this.alpha;
        context.translate(this.x, this.y);
        context.rotate(this.angle);
        context.fillStyle = this.color;
        context.beginPath();
        context.ellipse(0, 0, this.size, this.size * 0.55, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}

// 4. Expanding Shockwave Ring on Word Arrival
class ShockwaveRing {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.radius = 10;
        this.maxRadius = 300;
        this.alpha = 0;
    }
    trigger(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = Math.min(width, height) * 0.65;
        this.alpha = 0.65;
        this.active = true;
    }
    update() {
        if (!this.active) return;
        this.radius += (this.maxRadius - this.radius) * 0.045 + 2.0;
        this.alpha *= 0.945;
        if (this.alpha <= 0.01 || this.radius >= this.maxRadius) {
            this.active = false;
        }
    }
    draw(context) {
        if (!this.active || this.alpha <= 0.01) return;
        context.save();
        context.globalAlpha = this.alpha;
        context.strokeStyle = '#ff758c';
        context.lineWidth = 2.0;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.stroke();
        context.restore();
    }
}

// 5. Floating Ambient Hearts for Finale
class AmbientHeart {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = height + 20 + Math.random() * 60;
        this.speedY = 1.0 + Math.random() * 1.4;
        this.size = 14 + Math.random() * 20;
        this.alpha = 0.25 + Math.random() * 0.4;
        this.wobble = Math.random() * Math.PI * 2;
    }
    update(now) {
        this.y -= this.speedY;
        this.x += Math.sin(now * 0.002 + this.wobble) * 0.7;
        if (this.y < -40) this.reset();
    }
    draw(context) {
        context.globalAlpha = this.alpha;
        context.font = `${this.size}px sans-serif`;
        context.fillText('❤️', this.x, this.y);
    }
}

// --- Pre-allocated Object Pools ---
const backgroundStars = [];
for (let i = 0; i < 40; i++) {
    backgroundStars.push(new BackgroundStar());
}

const shootingStar = new ShootingStar();
const shockwaveRing = new ShockwaveRing();

const floatingPetals = [];
for (let i = 0; i < 18; i++) {
    floatingPetals.push(new FloatingRosePetal());
}

const rainDrops = [];
for (let i = 0; i < CONFIG.rainDropCount; i++) {
    rainDrops.push(new RainDrop());
}

const MAX_PARTICLES = 650;
const particles = [];
for (let i = 0; i < MAX_PARTICLES; i++) {
    particles.push(new StardustParticle());
}

const ambientHearts = [];
for (let i = 0; i < 18; i++) {
    ambientHearts.push(new AmbientHeart());
}

// Generate Letter-By-Letter Particle Points (L made purely of L, O made of O, V made of V, E made of E, etc.)
function getLetterByLetterParticlePoints(word, fontSize = 200, pointsPerLetter = 110) {
    const points = [];
    const scale = Math.min(width * 0.88, height * 0.88) / 700;
    const effectiveFontSize = fontSize * scale;
    const centerY = height / 2;

    const fontFam = (word === 'I') 
        ? "'Cinzel', 'Georgia', serif" 
        : "'Montserrat', 'Outfit', sans-serif";

    const spacing = (word === 'I') ? 0 : effectiveFontSize * 0.24;

    const rCanvas = document.createElement('canvas');
    const rCtx = rCanvas.getContext('2d');
    rCanvas.width = width;
    rCanvas.height = height;

    rCtx.font = `800 ${effectiveFontSize}px ${fontFam}`;
    rCtx.textAlign = 'left';
    rCtx.textBaseline = 'middle';

    const charWidths = [];
    let totalW = 0;

    for (let i = 0; i < word.length; i++) {
        const w = rCtx.measureText(word[i]).width;
        charWidths.push(w);
        totalW += w + (i < word.length - 1 ? spacing : 0);
    }

    let curX = (width - totalW) / 2;
    const palette = ['#ffffff', '#ffb8c6', '#ffe066', '#ff758c', '#ff5493', '#ff007f'];

    // Scan each character independently so every letter gets 100% full shape formed by its own particle letters
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const w = charWidths[i];

        rCtx.clearRect(0, 0, width, height);
        rCtx.fillText(char, curX, centerY);

        const charXStart = Math.max(0, Math.floor(curX - 10));
        const charXEnd = Math.min(width, Math.ceil(curX + w + 10));
        const charYStart = Math.max(0, Math.floor(centerY - effectiveFontSize * 0.65));
        const charYEnd = Math.min(height, Math.ceil(centerY + effectiveFontSize * 0.65));

        const charW = charXEnd - charXStart;
        const charH = charYEnd - charYStart;

        if (charW > 0 && charH > 0) {
            const imgData = rCtx.getImageData(charXStart, charYStart, charW, charH).data;
            const coords = [];

            const step = 5;
            for (let y = 0; y < charH; y += step) {
                for (let x = 0; x < charW; x += step) {
                    const idx = (y * charW + x) * 4 + 3;
                    if (imgData[idx] > 80) {
                        coords.push({
                            x: charXStart + x,
                            y: charYStart + y
                        });
                    }
                }
            }

            if (coords.length > 0) {
                const count = Math.min(pointsPerLetter, coords.length);
                for (let k = 0; k < count; k++) {
                    const sIdx = Math.floor((k / count) * coords.length);
                    const coord = coords[sIdx];
                    points.push({
                        x: coord.x,
                        y: coord.y,
                        char: char, // EXACT LETTER: I is formed of 'I', L of 'L', O of 'O', V of 'V', E of 'E'
                        color: palette[(i * 3 + k) % palette.length],
                        fontSize: 11
                    });
                }
            }
        }

        curX += w + spacing;
    }

    return points;
}

// Build Target Points For State
function buildTargetPointsForState(state) {
    let points = [];

    if (state === STATES.FORM_I) {
        points = getLetterByLetterParticlePoints('I', 300, 240);
    } else if (state === STATES.FORM_LOVE) {
        points = getLetterByLetterParticlePoints('LOVE', 190, 110);
    } else if (state === STATES.FORM_YOU) {
        points = getLetterByLetterParticlePoints('YOU', 200, 130);
    } else if (state === STATES.FINALE) {
        points = [];
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].active = false;
    }

    if (points.length === 0) return;

    const total = Math.min(points.length, MAX_PARTICLES);
    for (let i = 0; i < total; i++) {
        const pt = points[i];
        particles[i].initTarget(
            pt.x, 
            pt.y, 
            pt.color, 
            pt.char, 
            pt.fontSize
        );
    }
}

// --- Razor-Sharp Luxury Typography Renderer (Zero Clutter, Zero Moiré) ---
function drawWordTypography(context, word, now, heartBeatScale, stateSubPhase, subPhaseProgress) {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width * 0.88, height * 0.88) / 700;

    let baseFontSize = 200 * scale;
    let fontFam = "'Outfit', 'Montserrat', sans-serif";
    let spacingRatio = 0.24;

    if (word === 'I') {
        baseFontSize = 300 * scale;
        fontFam = "'Cinzel', 'Georgia', serif";
        spacingRatio = 0.1;
    } else if (word === 'YOU') {
        baseFontSize = 210 * scale;
        spacingRatio = 0.26;
    }

    context.save();
    context.font = `900 ${baseFontSize}px ${fontFam}`;
    context.textAlign = 'left';
    context.textBaseline = 'middle';

    const spacing = baseFontSize * spacingRatio;
    const charWidths = [];
    let totalW = 0;

    for (let i = 0; i < word.length; i++) {
        const w = context.measureText(word[i]).width;
        charWidths.push(w);
        totalW += w + (i < word.length - 1 ? spacing : 0);
    }

    let startX = centerX - totalW / 2;

    let alpha = 1.0;
    if (stateSubPhase === 'assembling') {
        alpha = Math.min(1.0, subPhaseProgress * 1.5);
    } else if (stateSubPhase === 'dispersing') {
        alpha = Math.max(0, 1.0 - subPhaseProgress * 1.8);
    }

    if (alpha <= 0.01) {
        context.restore();
        return;
    }

    context.globalAlpha = alpha;

    context.translate(centerX, centerY);
    context.scale(heartBeatScale, heartBeatScale);
    context.translate(-centerX, -centerY);

    context.shadowColor = '#ff2a6d';
    context.shadowBlur = 32 * scale;

    const grad = context.createLinearGradient(startX, centerY - baseFontSize * 0.4, startX + totalW, centerY + baseFontSize * 0.4);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#ffb8c6');
    grad.addColorStop(0.75, '#ff758c');
    grad.addColorStop(1, '#ff2a6d');
    context.fillStyle = grad;

    let curX = startX;
    for (let i = 0; i < word.length; i++) {
        context.fillText(word[i], curX, centerY);
        curX += charWidths[i] + spacing;
    }

    const sweep = (now * 0.0015) % 2.5;
    if (sweep < 1.2 && stateSubPhase === 'holding') {
        const glintX = startX - 50 * scale + sweep * (totalW + 100 * scale);
        const glintGrad = context.createRadialGradient(glintX, centerY, 0, glintX, centerY, 70 * scale);
        glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        glintGrad.addColorStop(0.5, 'rgba(255, 184, 198, 0.35)');
        glintGrad.addColorStop(1, 'transparent');
        context.fillStyle = glintGrad;
        context.beginPath();
        context.arc(glintX, centerY, 70 * scale, 0, Math.PI * 2);
        context.fill();
    }

    context.restore();
}

// --- Cinematic Grand Finale Vector Scene Renderer (Clean & Unobstructed) ---
function drawGrandFinaleMasterpiece(context, now, heartBeatScale) {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width * 0.92, height * 0.92) / 800;

    context.save();
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // 1. Draw Left "I" with luxury serif glow
    const posX_I = centerX - 270 * scale;
    const posY_I = centerY;
    const fontSize_I = 145 * scale;

    context.font = `900 ${fontSize_I}px 'Cinzel', 'Georgia', serif`;
    context.shadowColor = '#ff2a6d';
    context.shadowBlur = 30 * scale;
    const gradI = context.createLinearGradient(posX_I - 40 * scale, posY_I - 70 * scale, posX_I + 40 * scale, posY_I + 70 * scale);
    gradI.addColorStop(0, '#ffffff');
    gradI.addColorStop(0.4, '#ffb8c6');
    gradI.addColorStop(1, '#ff2a6d');
    context.fillStyle = gradI;
    context.fillText('I', posX_I, posY_I);

    // 2. Draw Center Beating 3D Crystal Heart
    const heartX = centerX - 5 * scale;
    const heartY = centerY - 5 * scale;
    const hSize = 88 * scale * heartBeatScale;

    // Glowing Radial Aura
    const auraGrad = context.createRadialGradient(heartX, heartY, hSize * 0.2, heartX, heartY, hSize * 2.2);
    auraGrad.addColorStop(0, 'rgba(255, 42, 109, 0.45)');
    auraGrad.addColorStop(0.5, 'rgba(255, 0, 128, 0.15)');
    auraGrad.addColorStop(1, 'transparent');
    context.fillStyle = auraGrad;
    context.beginPath();
    context.arc(heartX, heartY, hSize * 2.2, 0, Math.PI * 2);
    context.fill();

    // Draw Smooth Beating Heart Path
    context.save();
    context.translate(heartX, heartY);
    context.beginPath();
    for (let t = 0; t <= Math.PI * 2; t += 0.02) {
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const px = hx * (hSize / 17);
        const py = hy * (hSize / 17);
        if (t === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
    }
    context.closePath();

    const heartGrad = context.createLinearGradient(-hSize, -hSize, hSize, hSize);
    heartGrad.addColorStop(0, '#ffffff');
    heartGrad.addColorStop(0.2, '#ff758c');
    heartGrad.addColorStop(0.6, '#ff0055');
    heartGrad.addColorStop(1, '#a30037');

    context.shadowColor = '#ff0055';
    context.shadowBlur = 38 * scale;
    context.fillStyle = heartGrad;
    context.fill();

    // Inner Gloss Highlight on Left Lobe
    context.beginPath();
    context.ellipse(-hSize * 0.35, -hSize * 0.35, hSize * 0.22, hSize * 0.12, -Math.PI / 4, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.45)';
    context.shadowBlur = 0;
    context.fill();
    context.restore();

    // 3. Draw Right "YOU" with luxury romantic gradient
    const posX_YOU = centerX + 270 * scale;
    const posY_YOU = centerY;
    const fontSize_YOU = 130 * scale;

    context.font = `900 ${fontSize_YOU}px 'Outfit', 'Montserrat', sans-serif`;
    context.shadowColor = '#ff2a6d';
    context.shadowBlur = 30 * scale;
    const gradYOU = context.createLinearGradient(posX_YOU - 120 * scale, posY_YOU - 60 * scale, posX_YOU + 120 * scale, posY_YOU + 60 * scale);
    gradYOU.addColorStop(0, '#ffffff');
    gradYOU.addColorStop(0.4, '#ffb8c6');
    gradYOU.addColorStop(1, '#ff2a6d');
    context.fillStyle = gradYOU;
    context.fillText('YOU', posX_YOU, posY_YOU);

    // 4. Shimmering Light Glint sweeping across the scene
    const sweep = (now * 0.0012) % 3;
    if (sweep < 1.3) {
        const glintX = centerX - 360 * scale + sweep * (720 * scale);
        const glintGrad = context.createRadialGradient(glintX, centerY, 0, glintX, centerY, 65 * scale);
        glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        glintGrad.addColorStop(0.5, 'rgba(255, 184, 198, 0.35)');
        glintGrad.addColorStop(1, 'transparent');
        context.fillStyle = glintGrad;
        context.beginPath();
        context.arc(glintX, centerY, 65 * scale, 0, Math.PI * 2);
        context.fill();
    }

    context.restore();
}

// --- Quote Ribbon UI Manager ---
const quoteRibbon = document.getElementById('romanticQuote');
const quoteText = document.getElementById('quoteText');

function updateQuoteForState(state) {
    if (!quoteRibbon || !quoteText) return;
    const text = QUOTES[state];
    if (text) {
        quoteRibbon.classList.remove('hidden');
        quoteText.textContent = text;
    } else {
        quoteRibbon.classList.add('hidden');
    }
}

// --- State Machine ---
let lastFinaleFireworkTime = 0;

function switchState(newState) {
    currentState = newState;
    stateStartTime = performance.now();
    subPhaseStartTime = stateStartTime;
    stateSubPhase = 'assembling';

    updateQuoteForState(newState);

    if (newState === STATES.RAIN) {
        hidePhotoShowcase();
        hideRoyalLetter();
        rainDrops.forEach(d => d.reset(true));
    } else if (newState >= STATES.FORM_I && newState <= STATES.FINALE) {
        hidePhotoShowcase();
        hideRoyalLetter();
        if (newState === STATES.FORM_I) {
            floatingPetals.forEach(p => p.reset());
        }
        buildTargetPointsForState(newState);
        shockwaveRing.trigger(width / 2, height / 2);
        spawnHeartFirework(width / 2, height / 2, 28);
        audioManager.playTransitionChime();
    } else if (newState === STATES.PHOTOS) {
        hideRoyalLetter();
        showPhotoShowcase();
    } else if (newState === STATES.LETTER) {
        hidePhotoShowcase();
        showRoyalLetter();
    }
}

// --- Main Animation Loop (Optimized 60-120 FPS) ---
function animate(now) {
    requestAnimationFrame(animate);

    ctx.globalCompositeOperation = 'source-over';

    if (stateSubPhase === 'assembling' || stateSubPhase === 'dispersing') {
        ctx.fillStyle = 'rgba(3, 0, 5, 0.22)';
    } else {
        ctx.fillStyle = 'rgba(3, 0, 5, 0.38)';
    }
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';

    // 1. Dreamy Background Bokeh Orbs (Fast GPU Sprites)
    for (let i = 0; i < bokehOrbs.length; i++) {
        bokehOrbs[i].update(now);
        bokehOrbs[i].draw(ctx);
    }

    // 2. Twinkling Stars & Fireflies
    for (let i = 0; i < backgroundStars.length; i++) {
        backgroundStars[i].update(now);
        backgroundStars[i].draw(ctx);
    }

    // 3. Shooting Stars
    shootingStar.update(now);
    shootingStar.draw(ctx);

    // 4. Floating Rose Petals (Active only from FORM_I onwards)
    if (currentState >= STATES.FORM_I) {
        for (let i = 0; i < floatingPetals.length; i++) {
            floatingPetals[i].update(now);
            floatingPetals[i].draw(ctx);
        }
    }

    // 5. Expanding Shockwave Aura Ring
    shockwaveRing.update();
    shockwaveRing.draw(ctx);

    // 6. Interactive Fireworks & Sparks (Pure Canvas)
    for (let i = 0; i < fireworksPool.length; i++) {
        if (fireworksPool[i].active) {
            fireworksPool[i].update();
            fireworksPool[i].draw(ctx);
        }
    }

    // Living Heartbeat Pulse calculation (Thump-Thump double beat rhythm)
    const beatPhase = (now % 1200) / 1200 * Math.PI * 2;
    const heartBeatPulse = (Math.pow(Math.sin(beatPhase), 16) * 0.045) + (Math.pow(Math.sin(beatPhase + 0.45), 16) * 0.025);
    const heartBeatScale = 1.0 + heartBeatPulse;

    const timeInState = now - stateStartTime;

    // 1. Rain Scene
    if (currentState === STATES.RAIN) {
        for (let i = 0; i < rainDrops.length; i++) {
            const drop = rainDrops[i];
            drop.update();
            drop.draw(ctx);
        }

        if (timeInState > CONFIG.rainDuration) {
            switchState(STATES.FORM_I);
        }
    } 
    // 2. Morphing Scenes ("I", "LOVE", "YOU")
    else if (currentState >= STATES.FORM_I && currentState <= STATES.FORM_YOU) {
        const timeInSubPhase = now - subPhaseStartTime;
        let subPhaseProgress = 0;

        if (stateSubPhase === 'assembling') {
            subPhaseProgress = timeInSubPhase / CONFIG.assemblyDuration;
            if (timeInSubPhase > CONFIG.assemblyDuration) {
                stateSubPhase = 'holding';
                subPhaseStartTime = now;
            }
        } else if (stateSubPhase === 'holding') {
            subPhaseProgress = timeInSubPhase / CONFIG.letterHoldDuration;
            if (timeInSubPhase > CONFIG.letterHoldDuration) {
                stateSubPhase = 'dispersing';
                subPhaseStartTime = now;
                for (let i = 0; i < particles.length; i++) {
                    particles[i].explodeOutward();
                }
            }
        } else if (stateSubPhase === 'dispersing') {
            subPhaseProgress = timeInSubPhase / CONFIG.disperseDuration;
            if (timeInSubPhase > CONFIG.disperseDuration) {
                switchState(currentState + 1);
            }
        }

        // Draw Swirling Particle Convergence (Forming the word purely out of glowing particles)
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(heartBeatScale);
            particles[i].draw(ctx);
        }
    } 
    // 3. Finale Scene ("I ❤️ YOU" Grand Masterpiece)
    else if (currentState === STATES.FINALE) {
        const timeInSubPhase = now - subPhaseStartTime;
        if (stateSubPhase === 'assembling' && timeInSubPhase > CONFIG.assemblyDuration) {
            stateSubPhase = 'holding';
            subPhaseStartTime = now;
        } else if (stateSubPhase === 'holding') {
            // Heart beats for 3.8 seconds, then transitions into dramatic photo slideshow
            if (now - subPhaseStartTime > 3800) {
                switchState(STATES.PHOTOS);
            }
        }

        // Draw Breathtaking Cinematic Typography & 3D Beating Crystal Heart (Clean & Unobstructed)
        drawGrandFinaleMasterpiece(ctx, now, heartBeatScale);

        // Auto fireworks in grand finale celebration
        if (now - lastFinaleFireworkTime > 1600) {
            const fxX = width * (0.2 + Math.random() * 0.6);
            const fxY = height * (0.2 + Math.random() * 0.5);
            spawnHeartFirework(fxX, fxY, 20);
            audioManager.playInteractiveHarp(fxY / height);
            lastFinaleFireworkTime = now;
        }

        for (let i = 0; i < ambientHearts.length; i++) {
            ambientHearts[i].update(now);
            ambientHearts[i].draw(ctx);
        }
    }
    // 4. Photo Showcase & Royal Letter Scenes (Ambient Canvas Backdrop)
    else if (currentState === STATES.PHOTOS || currentState === STATES.LETTER) {
        for (let i = 0; i < ambientHearts.length; i++) {
            ambientHearts[i].update(now);
            ambientHearts[i].draw(ctx);
        }
    }
}

// ==========================================================
// PHOTO SHOWCASE & ROYAL LETTER CONTROLLERS
// ==========================================================
const photoShowcase = document.getElementById('photoShowcase');
const stageBackdrop = document.getElementById('stageBackdrop');
const photoImage = document.getElementById('photoImage');
const photoCaption = document.getElementById('photoCaption');
const photoDots = document.getElementById('photoDots');
const btnPrevPhoto = document.getElementById('btnPrevPhoto');
const btnNextPhoto = document.getElementById('btnNextPhoto');
const btnSkipToLetter = document.getElementById('btnSkipToLetter');

const royalLetterStage = document.getElementById('royalLetterStage');
const waxEnvelope = document.getElementById('waxEnvelope');
const waxSeal = document.getElementById('waxSeal');
const royalLetterCard = document.getElementById('royalLetterCard');
const btnLetterReplay = document.getElementById('btnLetterReplay');
const btnLetterPhotos = document.getElementById('btnLetterPhotos');

let currentPhotoIndex = 0;
let photoSlideTimer = null;
const PHOTO_DURATION = 3800; // ms per photo

function initPhotoDots() {
    if (!photoDots) return;
    photoDots.innerHTML = '';
    PHOTOS_DATA.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `photo-dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            goToPhoto(idx);
        });
        photoDots.appendChild(dot);
    });
}

function updatePhotoDots(activeIndex) {
    if (!photoDots) return;
    const dots = photoDots.querySelectorAll('.photo-dot');
    dots.forEach((dot, idx) => {
        if (idx === activeIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function showPhoto(index) {
    if (!photoImage || !photoCaption) return;
    const data = PHOTOS_DATA[index];
    if (!data) return;

    photoImage.classList.add('crossfade');
    photoCaption.classList.add('fade');

    setTimeout(() => {
        photoImage.src = data.src;
        if (stageBackdrop) {
            stageBackdrop.style.backgroundImage = `url("${data.src}")`;
        }
        photoCaption.textContent = data.caption;
        updatePhotoDots(index);

        photoImage.classList.remove('crossfade');
        photoCaption.classList.remove('fade');

        // Reset Ken Burns zoom animation
        photoImage.classList.remove('ken-burns');
        void photoImage.offsetWidth;
        photoImage.classList.add('ken-burns');
    }, 380);
}

function goToPhoto(index) {
    clearTimeout(photoSlideTimer);
    currentPhotoIndex = index;
    showPhoto(currentPhotoIndex);
    scheduleNextSlide();
}

function scheduleNextSlide() {
    clearTimeout(photoSlideTimer);
    photoSlideTimer = setTimeout(() => {
        if (currentState !== STATES.PHOTOS) return;
        if (currentPhotoIndex < PHOTOS_DATA.length - 1) {
            currentPhotoIndex++;
            showPhoto(currentPhotoIndex);
            scheduleNextSlide();
        } else {
            // Photos finished! Smoothly transition into Royal Love Letter
            switchState(STATES.LETTER);
        }
    }, PHOTO_DURATION);
}

function showPhotoShowcase() {
    if (!photoShowcase) return;
    initPhotoDots();
    currentPhotoIndex = 0;
    photoShowcase.classList.remove('hidden');
    showPhoto(0);
    scheduleNextSlide();

    spawnHeartFirework(width / 2, height / 2, 28);
    audioManager.playTransitionChime();
}

function hidePhotoShowcase() {
    clearTimeout(photoSlideTimer);
    if (photoShowcase) {
        photoShowcase.classList.add('hidden');
    }
}

// Royal Letter Logic
let envelopeAutoOpenTimer = null;

function showRoyalLetter() {
    if (!royalLetterStage) return;
    royalLetterStage.classList.remove('hidden');

    // Show wax envelope first
    if (waxEnvelope) waxEnvelope.classList.remove('hidden');
    if (royalLetterCard) royalLetterCard.classList.add('hidden');

    spawnHeartFirework(width / 2, height * 0.45, 30);
    audioManager.playTransitionChime();

    // Auto-open after 2.4s or instantly when tapped
    clearTimeout(envelopeAutoOpenTimer);
    envelopeAutoOpenTimer = setTimeout(() => {
        openRoyalLetter();
    }, 2400);
}

function openRoyalLetter() {
    clearTimeout(envelopeAutoOpenTimer);
    if (!waxEnvelope || !royalLetterCard) return;

    // Burst fireworks & sound
    spawnHeartFirework(width / 2, height / 2, 35);
    audioManager.playInteractiveHarp(0.25);
    setTimeout(() => {
        audioManager.playTransitionChime();
    }, 200);

    waxEnvelope.classList.add('hidden');
    royalLetterCard.classList.remove('hidden');
}

function hideRoyalLetter() {
    clearTimeout(envelopeAutoOpenTimer);
    if (royalLetterStage) {
        royalLetterStage.classList.add('hidden');
    }
    if (waxEnvelope) waxEnvelope.classList.remove('hidden');
    if (royalLetterCard) royalLetterCard.classList.add('hidden');
}

// Event Listeners for Photo Showcase & Royal Letter
if (btnPrevPhoto) {
    btnPrevPhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        const prevIdx = (currentPhotoIndex - 1 + PHOTOS_DATA.length) % PHOTOS_DATA.length;
        goToPhoto(prevIdx);
    });
}

if (btnNextPhoto) {
    btnNextPhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentPhotoIndex < PHOTOS_DATA.length - 1) {
            goToPhoto(currentPhotoIndex + 1);
        } else {
            switchState(STATES.LETTER);
        }
    });
}

if (btnSkipToLetter) {
    btnSkipToLetter.addEventListener('click', (e) => {
        e.stopPropagation();
        switchState(STATES.LETTER);
    });
}

if (waxEnvelope) {
    waxEnvelope.addEventListener('click', (e) => {
        e.stopPropagation();
        openRoyalLetter();
    });
}

if (btnLetterReplay) {
    btnLetterReplay.addEventListener('click', (e) => {
        e.stopPropagation();
        switchState(STATES.RAIN);
    });
}

if (btnLetterPhotos) {
    btnLetterPhotos.addEventListener('click', (e) => {
        e.stopPropagation();
        switchState(STATES.PHOTOS);
    });
}

// --- UI Interaction & Pure Canvas Touch FX ---
const startOverlay = document.getElementById('startOverlay');
const btnMusic = document.getElementById('btnMusic');
const btnRestart = document.getElementById('btnRestart');
const btnFullscreen = document.getElementById('btnFullscreen');
const tapHint = document.getElementById('tapHint');

function startExperience() {
    startOverlay.classList.add('hidden');

    // Guarantee audio starts on first user gesture (critical for mobile)
    audioManager.init();
    audioManager.isPlaying = true;
    const playPromise = audioManager.song.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => {
            // Retry once after a short delay (some browsers need this)
            setTimeout(() => {
                audioManager.song.play().catch(() => {});
            }, 100);
        });
    }

    switchState(STATES.RAIN);

    setTimeout(() => {
        if (tapHint) tapHint.style.opacity = '0';
    }, 6000);
}

startOverlay.addEventListener('click', startExperience);
startOverlay.addEventListener('touchstart', startExperience, { passive: true });

// Top Action Controls
if (btnMusic) {
    btnMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audioManager.isPlaying) {
            audioManager.stop();
            btnMusic.innerHTML = '<span class="icon">🔇</span>';
        } else {
            audioManager.start();  // Resumes from where it paused
            btnMusic.innerHTML = '<span class="icon">🎵</span>';
        }
    });
}

if (btnRestart) {
    btnRestart.addEventListener('click', (e) => {
        e.stopPropagation();
        switchState(STATES.RAIN);
    });
}

if (btnFullscreen) {
    btnFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });
}

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R' || e.code === 'Space') {
        switchState(STATES.RAIN);
    } else if (e.key === 'm' || e.key === 'M') {
        if (btnMusic) btnMusic.click();
    } else if (e.key === 'f' || e.key === 'F') {
        if (btnFullscreen) btnFullscreen.click();
    }
});

// Interactive Pure-Canvas Touch Firework (Zero DOM Reflows)
function handleInteractiveTouch(x, y) {
    if (currentState === STATES.IDLE) return;
    spawnHeartFirework(x, y, 20);
    audioManager.playInteractiveHarp(y / height);
}

let lastDragTime = 0;
window.addEventListener('click', (e) => {
    if (e.target.closest('.top-controls') || e.target.closest('.overlay') || e.target.closest('.photo-container') || e.target.closest('.royal-letter-card') || e.target.closest('.wax-envelope')) return;
    handleInteractiveTouch(e.clientX, e.clientY);
});

window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastDragTime > 60 && currentState >= STATES.FORM_I && currentState <= STATES.FINALE) {
        spawnHeartFirework(e.clientX, e.clientY, 3);
        lastDragTime = now;
    }
});

window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.top-controls') || e.target.closest('.overlay') || e.target.closest('.photo-container') || e.target.closest('.royal-letter-card') || e.target.closest('.wax-envelope')) return;
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleInteractiveTouch(touch.clientX, touch.clientY);
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    const now = performance.now();
    if (now - lastDragTime > 60 && e.touches.length > 0 && currentState >= STATES.FORM_I && currentState <= STATES.FINALE) {
        spawnHeartFirework(e.touches[0].clientX, e.touches[0].clientY, 3);
        lastDragTime = now;
    }
}, { passive: true });

// Warm up & Start
if (document.fonts) {
    document.fonts.ready.then(() => {
        resize();
        requestAnimationFrame(animate);
    });
} else {
    resize();
    requestAnimationFrame(animate);
}
