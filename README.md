# ⚔️ Warhammer 40k Deployment Helper

A browser-based application to help Warhammer 40k players optimize their model placement at the start of games. Visualize official terrain layouts, position units, and analyze line-of-sight to determine optimal deployment strategies.

## Features

### ✅ Implemented (MVP)

- **Terrain Visualization**: 8 official GW terrain layouts rendered on a 60"×44" board
- **Interactive Unit Placement**: Add units with various base sizes (25mm-170mm) and drag them into position
- **Double-click Lock**: Lock/unlock bases to prevent accidental movement
- **Visibility Analysis**: Binary danger/safe zone heat maps showing which positions are visible from opponent deployment zones
- **Ray Casting Engine**: Efficient line-of-sight calculations using BVH spatial partitioning
- **Deployment Zones**: Visual overlay of attacker/opponent zones

### Technical Stack

- **Framework**: SvelteKit 2 with TypeScript
- **Rendering**: Canvas via svelte-konva (high performance for many objects)
- **Styling**: Tailwind CSS
- **Ray Casting**: detect-collisions (BVH optimization) + custom Bresenham algorithm
- **Build**: Vite + static site generation (no backend required)

## Getting Started

### Quick Start (with just)

This project uses [just](https://github.com/casey/just) as a command runner for convenience. Install it first:

```bash
# macOS
brew install just

# Linux
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin
```

Then run:

```bash
just start      # Install dependencies and start dev server
# or
just dev        # Just start dev server
# Open http://localhost:5174
```

See all available commands: `just --list` or read [.justfile.md](.justfile.md)

### Without just (using npm directly)

```bash
# Installation
npm install

# Development
npm run dev

# Build
npm run build
npm run preview
```

## Usage Guide

### 1. Select Terrain Layout

Use the dropdown to choose one of 8 GW official layouts. The terrain will render on the board with:
- Dark gray = blocking terrain (tall ruins)
- Light gray = non-blocking terrain (low debris)

### 2. Add Units

Fill out the form:
- **Unit Name**: e.g., "Intercessors"
- **Base Size**: Select from 25mm to 170mm
- **Model Count**: Number of bases (1-20)
- **Color**: Pick a color to identify your units

Click "Add Unit" and bases will appear in the center of the board.

### 3. Position Units

- **Drag** bases to desired positions
- **Double-click** a base to lock/unlock it (prevents accidental movement)
- Units remain interactive - you can continue adjusting after visibility analysis

### 4. Analyze Visibility

1. Ensure terrain layout is selected
2. Adjust **Analysis Detail** slider:
   - 0.5" = High detail (slower, ~10s)
   - 2" = Low detail (faster, ~2s) - recommended for MVP
3. Click **Analyze Visibility**
4. Wait for heat map to generate

### 5. Interpret Results

The board will overlay a heat map:
- 🔴 **Red zones** = Danger (visible from ANY opponent position)
- 🟢 **Green zones** = Safe (hidden from ALL opponent positions)

Statistics panel shows:
- % of board in danger/safe zones
- Number of cells analyzed

**Strategy tip**: Deploy vulnerable units in green zones, aggressive units in red zones where they can strike first.

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── board/           # Canvas rendering components
│   │   ├── controls/        # UI controls
│   │   ├── terrain/         # Terrain rendering
│   │   └── units/           # Unit/base rendering
│   ├── data/
│   │   ├── terrain-layouts/gw/  # 8 GW layouts
│   │   └── base-sizes.json      # All 40k base sizes
│   ├── stores/              # Svelte stores for state
│   ├── types/               # TypeScript definitions
│   └── utils/
│       ├── raycasting/      # Visibility analysis
│       ├── collision/       # Terrain intersection
│       ├── coordinates.ts   # Inch↔pixel conversion
│       └── constants.ts     # Board dimensions
└── routes/
    └── +page.svelte         # Main app page
```

## Architecture Highlights

### Coordinate System

All data stored in **inches** (matching 40k rules), converted to pixels only for rendering:
- Board: 60"×44" (standard 40k dimensions)
- Rendering: 20 pixels/inch = 1200×880 canvas
- This keeps JSON data human-readable and rendering-independent

### Visibility Analysis Algorithm

1. **Grid Generation**: Divide board into cells (0.5"-2" squares)
2. **Source Sampling**: Sample 4" intervals across opponent deployment zone (~120 points)
3. **Ray Casting**: For each grid cell:
   - Cast rays from all source points to cell center
   - Use Bresenham algorithm to sample points along ray
   - Check terrain intersection with BVH collision system
   - **Early exit**: If ANY source has LOS, mark as danger (skip remaining sources)
4. **Classification**: Binary zones - danger (any visibility) or safe (no visibility)

### Performance Optimizations

- **BVH Spatial Partitioning**: O(log n) terrain queries via detect-collisions
- **Early Exit Strategy**: Stop testing sources once LOS found (saves ~80% of ray casts)
- **Canvas Rendering**: Much faster than SVG for interactive dragging
- **Layered Rendering**: Only redraws changed layers (terrain is static)

**Estimated Performance** (2" grid, 120 sources):
- ~2-3 seconds for full board analysis
- ~36,000 ray casts with early exit optimization

## Future Enhancements

### Short-Term
- Zoom/pan controls
- Movement range circles (6"/12" distances)
- Measurement tool
- Save/load deployments to localStorage
- Keyboard shortcuts

### Medium-Term
- WTC and UKTC terrain layouts
- Custom layout editor
- Coherency checking
- Objective marker placement
- Unit-to-unit LOS checking

### Long-Term
- 3D height considerations
- True line-of-sight (model height)
- Multi-user sharing
- Army list integration
- Mobile app

## Development

### With just (recommended)

```bash
just start          # First time: install deps and start dev
just dev            # Start dev server
just check          # Type checking
just build          # Build for production
just preview        # Preview production build
just pre-deploy     # Full validation before deploy
just deploy         # Build and show deployment instructions
just clean          # Clean build artifacts
just --list         # See all commands
```

### With npm

```bash
npm install         # Install dependencies
npm run dev         # Run dev server
npm run check       # Type checking
npm run build       # Build for production
npm run preview     # Preview production build
```

See [.justfile.md](.justfile.md) for complete just documentation.

## Credits

- Terrain layouts: Games Workshop via [Wahapedia](http://wahapedia.ru)
- Ray casting: Bresenham's line algorithm
- Collision detection: [detect-collisions](https://github.com/Prozi/detect-collisions)
- Canvas rendering: [Konva.js](https://konvajs.org/) + [svelte-konva](https://github.com/konvajs/svelte-konva)

---

Built for the Warhammer 40k community 🎲
