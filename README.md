# Lumina | Generative Romantic Canvas & Particle Engine

A zero-dependency, GPU-accelerated interactive canvas experience engineered with Vanilla JavaScript, HTML5 Canvas 2D, and the Web Audio API. Designed for high-framerate particle morphing, mathematical typography sampling, and real-time procedural sound synthesis.

---

## Architecture Overview

```
                        ┌─────────────────────────────────────────┐
                        │          Main Animation Loop            │
                        │        (requestAnimationFrame)          │
                        └────────────────────┬────────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
    ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
    │ Particle Dynamics    │      │ Procedural Web Audio │      │ Typography Raster &  │
    │ - Convergence Easing │      │ - Warm Chord Pad     │      │   Parametric Hearts  │
    │ - Cardiac Scale LFO  │      │ - Pentatonic Harp    │      │ - Per-Glyph Sampling │
    │ - Polar Dispersion   │      │ - Spatial Reverb     │      │ - Cardioid Geometry  │
    └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

---

## Key Technical Systems

### 1. GPU Sprite Pre-Caching & Blitting
To eliminate runtime font measurement (`ctx.measureText`) and heavy CPU-side text rasterization during active particle loops:
- Individual glyphs (`I`, `L`, `O`, `V`, `E`, `Y`, `U`, `✨`, `💖`) and radial glow discs are pre-rendered into isolated offscreen `<canvas>` buffers.
- Particles blit cached bitmap references via `ctx.drawImage()`, maintaining a steady **60–120 FPS** on both desktop and mobile viewports with zero garbage collection spikes.

### 2. Parametric Typography Sampling
- **Isolated Bounding-Box Rasterization**: Each character in the active word is rendered independently to compute its exact alpha mask bounding box.
- **Normalized Parametric Mapping**: Coordinates are sampled using indexed distribution:
  $$\text{sampleIndex} = \left\lfloor \frac{k}{\text{targetCount}} \times \text{coords.length} \right\rfloor$$
  This preserves the full structural topology of every glyph without vertical truncations or density clumping.
- **Letter-by-Letter Integrity**: Particles composing `L` are rendered strictly as `L`, `O` as `O`, `V` as `V`, and `E` as `E`.

### 3. Cardiac Heartbeat Pulse Equation
The rhythmic contraction and expansion simulates a realistic anatomical double-beat ("lub-dub") rhythm calculated per frame:

$$\text{Scale}(t) = 1.0 + \sin^{16}(\omega t) \times 0.045 + \sin^{16}(\omega t + 0.45) \times 0.025$$

This trigonometric modulation drives both the text particle holding phase and the 3D crystal heart in the Grand Finale.

### 4. 16th-Order Parametric Cardioid Curve
The central beating crystal heart in the final scene is mapped using the cardioid formula:

$$x(t) = 16 \sin^3(t)$$
$$y(t) = -(13\cos(t) - 5\cos(2t) - 2\cos(3t) - \cos(4t)) \quad \text{for } t \in [0, 2\pi]$$

Layered with multi-stop linear gradients, a 38px neon shadow bloom, and an elliptical specular gloss highlight.

### 5. Pure Web Audio API Sound Engine
A standalone polyphonic synthesizer running without external audio assets:
- **Warm Dream Chord Pads**: Multi-oscillator harmonic chord progression (`Fmaj7`, `Cmaj7`, `Am7`, `G`) filtered through a low-pass biquad filter with gentle exponential envelopes.
- **Dynamic Harp Arpeggiator**: Frequency quantization mapped to an interactive pentatonic scale triggered on pointer interaction and scene transitions.

---

## File Structure

```
├── index.html       # DOM structure, responsive viewport configuration, Google Fonts
├── style.css        # Minimalist dark theme, glassmorphic HUD, hardware-accelerated animations
├── script.js       # Core particle physics, state engine, Web Audio synth, canvas render loop
└── README.md        # Technical documentation & architecture breakdown
```

---

## State Machine Pipeline

| State | Phase | Visual Description | Duration |
| :--- | :--- | :--- | :--- |
| `0` | `RAIN` | Multi-lane "i love you" cascading stardust streams with decay trails | 5.2s |
| `1` | `FORM_I` | Stardust & petal convergence forming serif **I** from discrete `I` particles | ~4.1s |
| `2` | `FORM_LOVE` | Outward radial explosion into wide-spaced **L O V E** (each letter self-composed) | ~4.1s |
| `3` | `FORM_YOU` | Re-convergence into wide-spaced **Y O U** (each letter self-composed) | ~4.1s |
| `4` | `FINALE` | Permanent Grand Masterpiece: Left **I**, Center 3D Crystal Beating Heart, Right **YOU** + Ambient Fireworks | Loop |

---

## Controls & Keyboard Shortcuts

- **Touch / Click & Drag**: Triggers particle heart fireworks and plays interactive harp tones.
- **`Space` or `R`**: Instant replay (restarts the sequence from the initial rain scene).
- **`M`**: Toggle background audio synthesizer.
- **`F`**: Toggle browser fullscreen mode.

---

## Running Locally

Because this project uses native Web APIs and ES features, you can run it via any local static server:

```bash
# Using Python
python -m http.server 5500

# Using Node.js (npx serve)
npx serve .

# Or open index.html directly in any modern browser supporting Canvas & Web Audio
```

---

## Compatibility

- Chrome 90+
- Safari 14+ (iOS & macOS)
- Firefox 88+
- Edge 90+
