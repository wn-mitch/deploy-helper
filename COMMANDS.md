# Quick Command Reference

## Just Commands (Recommended)

### Daily Development
```bash
just dev            # Start dev server
just                # List all commands
```

### First Time Setup
```bash
just start          # Install deps + start dev
```

### Before Committing
```bash
just check          # Type check
```

### Building & Deploying
```bash
just build          # Build for production
just preview        # Preview build locally
just deploy         # Build + show deploy instructions
just pre-deploy     # Full validation (clean + install + check + build)
```

### Maintenance
```bash
just clean          # Clean build artifacts
just clean-all      # Clean everything including node_modules
just restart        # Clean cache + restart dev
```

### Information
```bash
just info           # Show project info
just --list         # List all commands with descriptions
```

## NPM Commands (Alternative)

If you prefer npm directly or don't want to install just:

```bash
npm install         # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
npm run check       # Type checking
npm run check:watch # Type checking in watch mode
```

## Common Workflows

### Starting Fresh Project
```bash
just start
# Opens http://localhost:5173 or :5174
```

### Daily Development Cycle
```bash
just dev           # Start working
# Make changes...
just check         # Verify types before commit
```

### Pre-Deployment Checklist
```bash
just pre-deploy    # Runs: clean → install → check → build
just deploy        # Shows deployment instructions
```

### Deployment to Various Platforms

After running `just deploy`, you'll get instructions for:

**Netlify:**
```bash
netlify deploy --prod --dir=build
```

**Vercel:**
```bash
vercel deploy --prod
```

**GitHub Pages:**
```bash
# Copy build/* to gh-pages branch or configure GitHub Actions
```

**Any Static Host:**
```bash
# Upload contents of build/ directory
```

### Troubleshooting

**Dev server won't start?**
```bash
just restart        # Clean cache and restart
```

**Build failing?**
```bash
just check          # Check for type errors first
```

**Complete reset?**
```bash
just clean-all      # Remove everything
just start          # Fresh install and start
```

## Keyboard Shortcuts in App

- **Double-click base**: Lock/unlock to prevent dragging
- **Drag**: Move units around board

## File Locations

- **Build output**: `build/`
- **Source code**: `src/`
- **Terrain layouts**: `src/lib/data/terrain-layouts/gw/`
- **Config files**: `svelte.config.js`, `tailwind.config.js`, `vite.config.ts`

## Port Information

- Dev server runs on port **5173** (or 5174 if 5173 is in use)
- Preview server runs on port **4173**

## Quick Links

- [README.md](README.md) - Full project documentation
- [.justfile.md](.justfile.md) - Detailed just documentation
- [justfile](justfile) - Command definitions
