# AGENTS.md — AI Agent Guidelines & Architecture Manual

> **Purpose**: This guide provides AI agents and pair-programming assistants with full architectural context, coordinate systems, design patterns, physics rules, and conventions for modifying or expanding the **LowPoly Rush: 3D Roguelite Endless Runner** codebase.

---

## 1. Project Overview & Tech Stack

- **Game Genre**: Endless 3D Sci-Fi Runner with Gravity Inversion & Boss Fights
- **Graphics & Rendering**: Three.js (WebGL, Low-Poly Flat-Shading, ACES Filmic Tone Mapping)
- **Audio Engine**: Synthesized Web Audio API (Zero external `.mp3`/`.wav` assets, adaptive BPM sequencer)
- **UI & Layout**: Semantic HTML5 overlays with Glassmorphism, Tailwind CSS v4, and Vanilla CSS tokens
- **Build System**: Vite with native ES6 Modules

---

## 2. Directory & Module Architecture

```text
3d-runner/
├── index.html                   # HTML entry point, UI overlays, HUD, and modal templates
├── package.json                 # Scripts and dependencies ("type": "module", Three.js, Vite)
├── vite.config.js               # Bundler configuration
├── AGENTS.md                    # AI Agent instructions (this document)
├── README.md                    # Human-facing project overview and controls
└── src/
    ├── main.js                  # Application bootstrap and Game instance initialization
    ├── config/                  # Configuration, game constants, balance, and catalogs
    │   ├── gameConfig.js        # Physical dimensions, speeds, gravity, lane widths, cooldowns
    │   ├── biomes.js            # Biome definitions (sky, fog, lights, ground, hazard colors)
    │   ├── skins.js             # Character skin catalogs and procedural color palettes
    │   ├── upgrades.js          # Shop upgrades, price curves, and single-run consumable boosts
    │   ├── achievements.js      # Milestone achievements, target criteria, and coin rewards
    │   └── quests.js            # Daily mission templates and tracking logic
    ├── services/                # Standalone service layer (independent of Three.js scenes)
    │   ├── StorageService.js    # LocalStorage persistence, schema migrations, and reset
    │   ├── AudioService.js      # Procedural sound effects & adaptive synthwave music sequencer
    │   └── InputService.js      # Unified controller for Keyboard, Touch Swipes, and Virtual Pads
    ├── core/                    # Engine, renderer, camera, physics, and state machine
    │   ├── Engine.js            # Three.js Scene, Camera, Renderer, Ambient/Directional lighting
    │   ├── CameraManager.js     # Third-person follow lerp, dynamic speed FOV, Screen Shake
    │   ├── ParticleSystem.js    # Object Pool (160 particles) for sparks, smoke, and nitro flames
    │   ├── CollisionSystem.js   # 3D AABB & radial collision tests for obstacles and pickups
    │   └── Game.js              # State Machine (MENU, PLAYING, PAUSED, GAMEOVER) & main loop
    ├── entities/                # 3D game entities and procedural meshes
    │   ├── PlayerModel.js       # Articulated cyber-runner rig (joints, head, visor, jetpack flames)
    │   ├── Player.js            # Physics body, lane lerp, variable jump, double jump, gravity flip
    │   ├── MiniBoss.js          # Hovering sentinel boss, rotating plasma ring, attack patterns
    │   └── LevelGenerator.js    # Endless corridor chunk recycling, dual-surface obstacles, coins
    ├── ui/                      # DOM UI controllers
    │   ├── UIManager.js         # HUD real-time meters, dynamic toasts, screen transitions
    │   ├── ShopModal.js         # Store modal (Upgrades, Skins, Boosts tabs)
    │   ├── AchievementsModal.js # Achievements list and claim handlers
    │   ├── QuestsModal.js       # Daily missions list and claim handlers
    │   └── SettingsModal.js     # Volume sliders, graphics quality presets, virtual pads toggle
    └── styles/
        └── main.css             # Design tokens, typography, glassmorphism, responsive scrollbars
```

---

## 3. Coordinate System & Geometry Conventions (CRITICAL)

Three.js uses a **right-handed coordinate system**:
- Camera is placed at `z = player.z - 7.5` and looks forward along **$+Z$** (`player.z + 12`).
- When the camera faces $+Z$:
  - **Screen LEFT is $+X$** (`+CONFIG.LANE_WIDTH` $= +2.8$)
  - **Screen CENTER is $X = 0$**
  - **Screen RIGHT is $-X$** (`-CONFIG.LANE_WIDTH` $= -2.8$)
- **Floor Surface**: $Y = 0.0$ (`CONFIG.FLOOR_Y`)
- **Ceiling Surface**: $Y = 5.6$ (`CONFIG.CEILING_HEIGHT`)
- **Player Center of Mass (Waist)**:
  - When standing on Floor: `player.y = 0.9` (Feet at $Y = 0.0$, Head at $Y = 1.8$).
  - When standing on Ceiling: `player.y = 4.7` (Feet at $Y = 5.6$, Head at $Y = 3.8$).
  - Bounding Box Half-Height: $0.9\text{m}$ (Normal) or $0.35\text{m}$ (Sliding).

> ⚠️ **RULE**: Never rotate the player around $Y=0$ when flipping gravity. The player model's root is at the waist so that rotation around the $Z$-axis smoothly flips the character in-place between floor and ceiling without clipping through the surfaces.

---

## 4. Key Design Patterns & Rules

### 1. Object Pooling
- Do **not** instantiate new `THREE.Mesh` or `THREE.Geometry` objects in the animation `loop()`!
- `ParticleSystem.js` manages a fixed pre-allocated pool of 160 box meshes. Use `particles.spawn(...)`.
- `LevelGenerator.js` recycles 5 active corridor chunks (`CONFIG.MAX_ACTIVE_CHUNKS = 5`). As a chunk passes behind the player, it is removed and a new chunk is spawned ahead.

### 2. State Machine (`src/core/Game.js`)
- `MENU`: Runner showcases idle turntable preview (`model.group.rotation.y = t * 1.2`), camera in showcase view.
- `PLAYING`: Standard loop, velocity integration, obstacle collision checks, distance accumulation.
- `PAUSED`: Animation loop halts game physics, audio paused.
- `GAMEOVER`: Triggers `startDeathTumble()`, slow-motion matrix simulation (`dt * 0.75`), ragdoll tumble physics, camera tracking, and delayed modal display.

### 3. Web Audio Synthesis (`src/services/AudioService.js`)
- **Zero Asset Dependency**: Do not add external `.mp3` or `.wav` assets. All sounds (laser, jump, double jump, coin, hit, crash, boss alarm, nitro) are synthesized via oscillators, noise buffers, and biquad filters.
- **Dynamic BPM Sync**: The sequencer tempo dynamically scales from 120 BPM up to 160 BPM based on current runner speed (`CONFIG.INITIAL_SPEED` $\rightarrow$ `CONFIG.MAX_SPEED`).
- **Browser Autoplay Compliance**: The `AudioContext` is created/resumed on user interaction.

### 4. Non-Intrusive Dynamic UI (`src/ui/UIManager.js`)
- Alert toasts (`#hud-alert-banner`) are automatically shifted:
  - When running on Floor: Placed at `top: 74px` (under top HUD bar).
  - When running on Ceiling: Placed at `bottom: 96px` (above Nitro bar).
- This keeps the player's direct line of sight unobstructed.

---

## 5. How-To Guides for Common Extensions

### Adding a New Biome
1. Open `src/config/biomes.js`.
2. Add a new biome entry with `id`, `name`, `skyColor`, `fogColor`, `fogDensity`, `groundColor`, `accentColor`, `ceilingColor`, `lightColor`, `hazardColor`.
3. Update `setBiome()` in `src/entities/LevelGenerator.js` and `src/core/Engine.js` if custom scenery colors or materials are required.

### Adding a New Runner Skin
1. Open `src/config/skins.js`.
2. Add a skin object with `id`, `name`, `price`, `unlocked`, and `colors: { body, head, visor, limbs, accent }`.
3. The shop and menu selectors will automatically display and equip the new skin.

### Adding a New Upgrade or Single-Run Boost
1. Open `src/config/upgrades.js`.
2. Add the upgrade or boost definition to `UPGRADES` or `BOOSTS`.
3. In `src/services/StorageService.js`, declare the default state key in `getDefaults()`.
4. In `src/core/Game.js`, apply the upgrade multiplier/level during gameplay.

---

## 6. Build & Verification Commands

```bash
# Install dependencies
npm install

# Run local development server (Vite with hot-reload)
npm run dev

# Run production build validation (MANDATORY before completing tasks)
npm run build

# Preview production bundle locally
npm run preview
```
