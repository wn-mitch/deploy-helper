# Warhammer 40k Deployment Helper - Command Runner
# Install just: https://github.com/casey/just

# Default recipe (runs when you just type `just`)
default:
    @just --list

# Install dependencies
install:
    npm install

# Start development server
dev:
    npm run dev

# Alternative alias for dev
boot: dev

# Build for production
build:
    npm run build

# Preview production build
preview:
    npm run preview

# Run TypeScript type checking
check:
    npm run check

# Watch mode for type checking
check-watch:
    npm run check:watch

# Clean build artifacts and generated files
clean:
    rm -rf build
    rm -rf .svelte-kit
    rm -rf node_modules/.vite

# Full clean including node_modules
clean-all: clean
    rm -rf node_modules

# Build and preview (simulates deployment)
deploy-preview: build preview

# Build for deployment (static site)
deploy: build
    @echo "✅ Build complete! Deploy the 'build' directory to your static host."
    @echo ""
    @echo "Deployment options:"
    @echo "  - Netlify:      netlify deploy --prod --dir=build"
    @echo "  - Vercel:       vercel deploy --prod"
    @echo "  - GitHub Pages: Copy build/* to gh-pages branch"
    @echo "  - Any static host: Upload build/ directory"

# Run full pre-deployment checks
pre-deploy: clean install check build
    @echo "✅ All pre-deployment checks passed!"

# Development workflow: install deps and start dev server
start: install dev

# Quick restart: clean cache and restart dev server
restart: clean dev

# Show project info
info:
    @echo "Warhammer 40k Deployment Helper"
    @echo "================================"
    @echo "Dev server:  http://localhost:5173 (or :5174 if 5173 in use)"
    @echo "Build dir:   build/"
    @echo "Source dir:  src/"
    @echo ""
    @echo "Available commands:"
    @just --list
