# Eye of Horus – Abydos WebXR (عين حورس · أبيدوس)

Photorealistic, bilingual (AR/EN) WebXR experience of the Temple of Seti I and the Osireion at Abydos.

## Architecture
`abydos.glb` (Draco, PBR) → three.js renderer (ACES tone mapping, physical sky, soft sun shadows, IBL) →
modes: Explore / Walk / real 360° photo nodes (from `bootstrap.json`) / WebXR AR (tap to place) / VR.

## Prerequisites
Node 18+, a WebXR browser (Chrome on Android for AR; HTTPS required on devices).

## Run
```bash
npm install
npm run dev      # development
npm run build    # production build in dist/
```

## Usage
- Mouse/touch: orbit and zoom. "Time" cycles sun position. "Real 360° photos" enters scan nodes; use ← → to move.
- AR: open on an ARCore phone via HTTPS, tap "Augmented reality", tap a surface to place the temple.

## Credits / Author
Built by Mohamed Salem – Expert AI Engineer & Automation Architect.

## Textures
High-resolution masters (2048px PNG) live in `textures_src/` (git-ignored). The web build uses compressed JPEGs in `public/textures/` (albedo, `_normal`, `_rough`), mapped to GLB materials by name in `TEXTURE_MAP` (`src/main.js`). See `TEXTURE_BRIEF.md`.
