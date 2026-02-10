# Implementation Summary

## Overview

Warhammer 40k Deployment Helper is a browser-based tool for planning model deployment on a 60"×44" game board.

## Features

### Terrain System
- GW terrain layout support with blocking terrain pieces
- Rectangle and polygon shape rendering
- Height-based visual indicators (taller = darker)

### Deployment Patterns
6 official Leviathan deployment patterns:
- **Tipping Point** - L-shaped zones
- **Hammer and Anvil** - Vertical strips (18" deep)
- **Sweeping Engagement** - Staggered horizontal zones
- **Dawn of War** - Horizontal strips (12" deep)
- **Crucible of Battle** - Triangular corner zones
- **Search and Destroy** - Corner deployment with center exclusion

### Unit Management
- Support for all standard base sizes (25mm-170mm)
- Drag-and-drop placement
- Double-click to lock/unlock bases
- Multiple bases per unit (for squads)

### Visibility Analysis
- Ray-casting from opponent deployment zone
- Binary heat map: red (danger) / green (safe)
- Configurable grid resolution (0.5" to 2")
- Real-time statistics (% visible, % hidden)

## Tech Stack

- **Framework**: SvelteKit 2.x + Svelte 5
- **Rendering**: Konva.js (direct Canvas API)
- **Collision**: detect-collisions v7
- **Build**: Vite + adapter-static

## Commands

```bash
just dev        # Start development server
just build      # Production build
just check      # TypeScript validation
just deploy     # Build + deployment instructions
```

## Architecture

- All coordinates stored in **inches** (converted to pixels for rendering)
- State managed via Svelte stores (terrain, units, deployment, visibility)
- All canvas rendering centralized in `GameBoard.svelte`
- Static site deployment (no backend required)