# Warhammer 40k Deployment Helper - Project Guide

## Project Overview

A browser-based deployment planning tool for Warhammer 40,000 players. Helps optimize model placement by visualizing official terrain layouts and calculating line-of-sight visibility zones.

**Key Features:**
- Display 8 official GW terrain layouts on a 60"×44" board
- Add and drag units with various base sizes (25mm-170mm)
- Ray-casting visibility analysis to identify "danger zones" (exposed to opponent) and "safe zones" (hidden)
- Pure client-side application (no backend required)

**Target Users:** Competitive and casual 40k players planning deployment strategies

## Technology Stack

### Core Framework
- **SvelteKit 2.x** with **Svelte 5** (latest reactivity model)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Vite** for build tooling

### Canvas Rendering
- **Konva.js** (native library) - Direct Canvas manipulation
- **NOT using svelte-konva** - Incompatible with Svelte 5; we use Konva directly via imperative API

### Physics & Geometry
- **detect-collisions v7+** - BVH-optimized collision detection for ray casting
- **Bresenham algorithm** - Efficient line-of-sight ray sampling
- Custom geometry utilities for coordinate conversion (inches ↔ pixels)

### Key Dependencies
```json
{
  "konva": "^9.3.22",
  "detect-collisions": "^7.x",
  "nanoid": "^5.x" // Unique ID generation
}
```

## Architecture

### Coordinate System
**Critical Convention:** All data stored in **inches**, converted to pixels only for rendering.

```typescript
// Constants
BOARD_WIDTH = 60 inches → 1200px (at 20px/inch)
BOARD_HEIGHT = 44 inches → 880px

// Conversion utilities
inchesToPixels(inches: number): number
pixelsToInches(pixels: number): number
```

**Why inches?**
- Matches Warhammer 40k measurement system
- Data files are human-readable (12" width, not 240px)
- Allows changing pixel scale without rewriting data

### State Management (Svelte Stores)

**Store Pattern:** Custom stores with domain-specific methods

```typescript
// src/lib/stores/
terrain.ts    // Current layout, available layouts
units.ts      // Units on board, CRUD operations
visibility.ts // Visibility grid, analysis state
selection.ts  // Visibility source selection
board.ts      // Zoom/pan (future feature)
```

**Store Usage:**
```typescript
// Subscribe with $ prefix (Svelte auto-subscription)
$: currentLayout = $terrainStore.currentLayout;

// Call store methods directly
terrainStore.loadLayout('layout-1');
unitsStore.createUnit(name, baseSize, count, position, color);
```

### Component Structure

```
src/lib/components/
├── board/
│   └── GameBoard.svelte          # Main Konva stage (all rendering)
├── controls/
│   ├── LayoutSelector.svelte     # Terrain layout dropdown
│   ├── UnitControls.svelte       # Add/remove units
│   └── RayCastControls.svelte    # Visibility analysis UI
├── terrain/                      # (Unused - rendering moved to GameBoard)
└── units/                        # (Unused - rendering moved to GameBoard)
```

**Important:** All Canvas rendering happens in `GameBoard.svelte` using direct Konva API calls. Layer components (`TerrainLayer.svelte`, etc.) exist but are not imported.

### Data Schema

**Terrain Layouts** (`src/lib/data/terrain-layouts/gw/layout-*.json`)
```typescript
{
  id: "gw-layout-1",
  pieces: [
    {
      shape: { type: "rectangle", width: 12, height: 6 },
      position: { x: 24, y: 19 },
      blocking: true,  // Affects line of sight
      height: 5        // Visual indicator (>4" = darker)
    }
  ],
  deploymentZones: [
    {
      name: "Attacker",
      shape: { type: "rectangle", width: 60, height: 12 },
      position: { x: 0, y: 0 },
      color: "#3b82f6"  // Blue
    }
  ]
}
```

**Base Sizes** (`src/lib/data/base-sizes.json`)
```typescript
{
  size: 32,              // mm diameter
  radiusInches: 0.630    // Precomputed: (32mm / 25.4 / 2)
}
```

## Critical Patterns & Conventions

### 1. Konva Rendering Pattern

**Always follow this pattern for drawing:**

```typescript
function drawSomething(data: any[]) {
  // 1. Clear existing shapes
  layer.destroyChildren();

  // 2. Create new shapes
  data.forEach(item => {
    const shape = new Konva.Rect({
      x: inchesToPixels(item.x),
      y: inchesToPixels(item.y),
      listening: false  // Important: prevents interfering with drags
    });
    layer.add(shape);
  });

  // 3. Redraw layer
  layer.batchDraw();  // More efficient than draw()
}
```

**Critical:** Only update store on `dragend`, never `dragmove`. Updating during drag triggers full redraw and breaks dragging.

### 2. Store Subscription Pattern

```typescript
onMount(() => {
  const unsubTerrain = terrainStore.subscribe(($terrain) => {
    drawTerrain($terrain.currentLayout?.pieces || []);
  });

  const unsubUnits = unitsStore.subscribe(($units) => {
    drawUnits($units.units);
  });

  return () => {
    unsubTerrain();
    unsubUnits();
    stage.destroy();  // Clean up Konva
  };
});
```

### 3. Collision Detection (detect-collisions v7 API)

```typescript
// Create system
const system = new System();

// Add bodies using system.create* methods (NOT new Box/Polygon)
const box = system.createBox(
  { x: centerX, y: centerY },
  width,
  height
);

// CRITICAL: Call system.update() after adding all bodies
system.update();  // Rebuilds BVH spatial index - required for collision detection!

// Check collisions
const testCircle = system.createCircle({ x, y }, 0.01);
let isColliding = false;
system.checkOne(testCircle, () => {
  isColliding = true;  // Callback is called for each collision
});
system.remove(testCircle);
```

**Wrong (doesn't work):**
```typescript
const box = new Box(...);
system.insert(box);
testCircle.potentials(); // ❌ Method doesn't exist
```

## Development Workflow

### Starting Development Server

```bash
npm run dev -- --port 5173
# Access at http://localhost:5173
```

**Note:** SvelteKit dev server runs silently when successful. No output = no errors.

### Adding a New Terrain Layout

1. Create `/src/lib/data/terrain-layouts/gw/layout-N.json`
2. Follow schema: pieces array, deploymentZones array, metadata
3. Add to `LayoutSelector.svelte` AVAILABLE_LAYOUTS array
4. Visually verify against Wahapedia diagrams

### Adding a New Base Size

1. Add to `/src/lib/data/base-sizes.json`
2. Calculate radiusInches: `(diameterMm / 25.4) / 2`
3. Add to `BaseSize` type in `/src/lib/types/units.ts`

### Modifying Visibility Algorithm

Key files:
- `src/lib/utils/raycasting/visibility-map.ts` - Grid generation, main loop
- `src/lib/utils/raycasting/bresenham.ts` - Ray sampling
- `src/lib/utils/collision/detector.ts` - Terrain intersection tests

**Performance considerations:**
- Grid resolution: 2" = fast, 1" = detailed but slower, 0.5" = very slow
- Sample spacing: 4" recommended (yields ~120 source points for 12"×60" zone)
- Ray step: 0.2" balances accuracy vs. speed

## Common Issues & Solutions

### Issue: "potentials is not a function"
**Cause:** Using old detect-collisions API pattern
**Fix:** Use `system.createBox()` instead of `new Box()`, call `system.checkOne()` before checking collisions

### Issue: Units barely move when dragging
**Cause:** Updating store on `dragmove` event
**Fix:** Only update store on `dragend` event

### Issue: Canvas not rendering
**Cause:** svelte-konva incompatibility with Svelte 5
**Fix:** Use Konva directly via imperative API in `onMount()`

### Issue: SSR errors with Konva
**Cause:** Canvas API doesn't exist in Node.js
**Fix:** Ensure `src/routes/+page.ts` has `export const ssr = false;`

### Issue: Deployment zones not visible
**Cause:** Opacity too low or overlapping
**Fix:** Use separate shapes for fill (low opacity) and border (high opacity), add text labels

## Testing

### Manual Testing Checklist

**Terrain Rendering:**
- [ ] All 8 layouts load without errors
- [ ] Terrain pieces match Wahapedia diagrams
- [ ] Deployment zones show blue (top) and red (bottom) with labels

**Unit Management:**
- [ ] Can add units with all base sizes
- [ ] Units drag smoothly (60fps)
- [ ] Double-click locks/unlocks bases
- [ ] Can delete units
- [ ] Locked bases can't be dragged

**Visibility Analysis:**
- [ ] Analysis completes without errors
- [ ] Progress bar updates smoothly
- [ ] Red zones (danger) appear in open areas
- [ ] Green zones (safe) appear behind terrain
- [ ] Statistics match visual results
- [ ] Can clear analysis

**Performance:**
- [ ] 20 units (100+ bases) remain responsive
- [ ] 2" grid analysis completes in <5 seconds
- [ ] 1" grid analysis completes in <15 seconds

## File Organization

```
deploy-helper/
├── src/
│   ├── lib/
│   │   ├── components/        # Svelte components
│   │   ├── data/             # JSON data files
│   │   ├── stores/           # State management
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Pure functions
│   └── routes/
│       ├── +page.svelte      # Main app page
│       └── +page.ts          # SSR config (ssr = false)
├── static/                   # Static assets
├── package.json
├── svelte.config.js          # SvelteKit config (adapter-static)
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Deployment

**Build:**
```bash
npm run build
# Outputs to /build directory
```

**Deployment Targets:**
- GitHub Pages
- Netlify
- Vercel

**Configuration:** Using `@sveltejs/adapter-static` for static site generation.

## Future Enhancements

**Planned (Post-MVP):**
- WTC and UKTC terrain layouts
- Movement range circles (6", 12")
- Coherency checking (2" unit spacing)
- Save/load deployments (localStorage)
- Custom terrain editor

**Experimental:**
- 3D height-based line of sight
- Web Worker for async visibility calculation
- GPU-accelerated ray casting

## Key Design Decisions

### Why Canvas over SVG?
- Performance with 100+ interactive objects
- Real-time drag-and-drop requires 60fps
- SVG creates DOM nodes = memory overhead

### Why no backend?
- Simplifies deployment (static hosting)
- User privacy (data never leaves browser)
- No hosting costs
- Fast load times

### Why Svelte 5?
- Latest reactivity model (`$:` syntax)
- Better performance than Svelte 4
- Simplified component API

### Why client-side only visibility analysis?
- Users want instant feedback
- No network latency
- Works offline
- Modern browsers handle computation well

## Getting Help

**Documentation:**
- Konva.js: https://konvajs.org/docs/
- detect-collisions: https://github.com/Prozi/detect-collisions
- SvelteKit: https://kit.svelte.dev/
- Wahapedia (data source): http://wahapedia.ru/wh40k10ed/the-rules/

**Code Style:**
- Use TypeScript strict mode
- Prefer pure functions over classes
- Keep components under 200 lines
- Use descriptive variable names (no abbreviations)

**Git Workflow:**
- Descriptive commit messages
- Co-authored-by: Claude when appropriate
- Test before committing

---

**Last Updated:** 2026-02-09
**Project Status:** Phase 1 complete (terrain, units, dragging), Phase 3 in progress (visibility analysis)
