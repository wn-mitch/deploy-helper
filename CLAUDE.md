# Warhammer 40k Deployment Helper - Project Guide

## Project Overview

A browser-based deployment planning tool for Warhammer 40,000 players. Helps optimize model placement by visualizing official terrain layouts and calculating line-of-sight visibility zones.

**Key Features:**
- Display GW terrain layouts on a 60"×44" board
- 6 official Leviathan deployment patterns (independent of terrain)
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
```deploy-helper/package.json#L1-5
{
  "konva": "^9.3.22",
  "detect-collisions": "^7.x",
  "nanoid": "^5.x"
}
```

## Architecture

### Coordinate System
**Critical Convention:** All data stored in **inches**, converted to pixels only for rendering.

```deploy-helper/src/lib/utils/constants.ts#L1-6
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

```deploy-helper/src/lib/stores/index.ts#L1-7
// src/lib/stores/
terrain.ts     // Current layout, available layouts
units.ts       // Units on board, CRUD operations
visibility.ts  // Visibility grid, analysis state
selection.ts   // Visibility source selection
deployment.ts  // Deployment pattern selection (6 Leviathan patterns)
board.ts       // Zoom/pan (future feature)
```

**Store Usage:**
```deploy-helper/example.ts#L1-8
// Subscribe with $ prefix (Svelte auto-subscription)
$: currentLayout = $terrainStore.currentLayout;

// Call store methods directly
terrainStore.loadLayout('layout-1');
unitsStore.createUnit(name, baseSize, count, position, color);
deploymentStore.loadPattern('dawn-of-war');
```

### Component Structure

```
src/lib/components/
├── board/
│   └── GameBoard.svelte          # Main Konva stage (all rendering)
├── controls/
│   ├── DeploymentSelector.svelte # Deployment pattern dropdown (6 patterns)
│   ├── LayoutSelector.svelte     # Terrain layout dropdown
│   ├── UnitControls.svelte       # Add/remove units
│   └── RayCastControls.svelte    # Visibility analysis UI
├── terrain/                      # (Unused - rendering moved to GameBoard)
├── ui/                           # Shared UI components
└── units/                        # (Unused - rendering moved to GameBoard)
```

**Important:** All Canvas rendering happens in `GameBoard.svelte` using direct Konva API calls.

### Data Schema

**Terrain Layouts** (`src/lib/data/terrain-layouts/gw/layout-*.json`)
```deploy-helper/src/lib/data/terrain-layouts/gw/schema.ts#L1-14
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
  deploymentZones: [...]  // Optional default zones
}
```

**Deployment Patterns** (`src/lib/data/deployment-patterns.json`)
```deploy-helper/src/lib/data/deployment-patterns.json#L1-15
{
  id: "dawn-of-war",
  name: "Dawn of War",
  source: "leviathan",
  zones: [
    {
      player: "attacker",
      shape: { type: "rectangle", width: 60, height: 12 },
      position: { x: 0, y: 0 },
      color: "#3b82f6"
    },
    // Defender zone mirrored...
  ]
}
```

**Available Deployment Patterns:**
- Tipping Point (L-shaped polygons)
- Hammer and Anvil (vertical strips)
- Sweeping Engagement (staggered polygons)
- Dawn of War (horizontal strips)
- Crucible of Battle (triangular zones)
- Search and Destroy (corner deployment)

**Base Sizes** (`src/lib/data/base-sizes.json`)
```deploy-helper/src/lib/data/base-sizes.json#L1-4
{
  size: 32,              // mm diameter
  radiusInches: 0.630    // Precomputed: (32mm / 25.4 / 2)
}
```

## Critical Patterns & Conventions

### 1. Konva Rendering Pattern

**Always follow this pattern for drawing:**

```deploy-helper/src/lib/components/board/pattern.ts#L1-17
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

```deploy-helper/src/lib/components/board/subscription.ts#L1-15
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

```deploy-helper/src/lib/utils/collision/example.ts#L1-19
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
```deploy-helper/src/lib/utils/collision/wrong.ts#L1-3
const box = new Box(...);
system.insert(box);
testCircle.potentials(); // ❌ Method doesn't exist
```

## Development Workflow

### Starting Development Server

```deploy-helper/justfile#L1-3
just dev
# Or: npm run dev -- --port 5173
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
- [ ] Layouts load without errors
- [ ] Terrain pieces match Wahapedia diagrams
- [ ] Deployment zones render correctly (rectangles and polygons)

**Deployment Patterns:**
- [ ] All 6 patterns selectable from dropdown
- [ ] Polygon zones render correctly (Crucible, Tipping Point, etc.)
- [ ] "Use terrain default" option works

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
│   │   ├── data/              # JSON data files
│   │   │   ├── terrain-layouts/gw/  # GW terrain layouts
│   │   │   ├── base-sizes.json
│   │   │   └── deployment-patterns.json
│   │   ├── stores/            # State management
│   │   ├── types/             # TypeScript interfaces
│   │   │   ├── terrain.ts
│   │   │   ├── units.ts
│   │   │   ├── deployment.ts
│   │   │   └── raycasting.ts
│   │   └── utils/             # Pure functions
│   └── routes/
│       ├── +page.svelte       # Main app page
│       └── +page.ts           # SSR config (ssr = false)
├── static/                    # Static assets
├── justfile                   # Command runner
├── package.json
├── svelte.config.js           # SvelteKit config (adapter-static)
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Deployment

**Build:**
```deploy-helper/justfile#L1-2
just build
# Or: npm run build - outputs to /build directory
```

**Deployment Targets:**
- GitHub Pages
- Netlify
- Vercel

**Configuration:** Using `@sveltejs/adapter-static` for static site generation.

## Future Enhancements

**Planned (Post-MVP):**
- Additional terrain layouts (currently only layout-1 implemented)
- WTC and UKTC terrain layouts
- Movement range circles (6", 12")
- Coherency checking (2" unit spacing)
- Save/load deployments (localStorage)
- Mission objectives overlay
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

### Why separate deployment patterns from terrain?
- Matches how 40k 10th edition works (deployment chosen separately)
- Allows any terrain + any deployment combination
- Cleaner data organization

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

**Last Updated:** 2026-02-10
**Project Status:** MVP complete - terrain rendering, 6 deployment patterns, unit management, visibility analysis all functional