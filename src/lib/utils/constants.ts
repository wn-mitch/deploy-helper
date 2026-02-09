// Board dimensions in inches (standard 40k board)
export const BOARD_WIDTH = 60;
export const BOARD_HEIGHT = 44;

// Rendering scale: pixels per inch
// 20 px/inch gives us 1200×880 canvas
export const PIXELS_PER_INCH = 20;

// Derived canvas dimensions
export const CANVAS_WIDTH = BOARD_WIDTH * PIXELS_PER_INCH; // 1200
export const CANVAS_HEIGHT = BOARD_HEIGHT * PIXELS_PER_INCH; // 880

// Ray casting configuration
export const DEFAULT_GRID_RESOLUTION = 2; // inches per grid cell
export const MIN_GRID_RESOLUTION = 0.5;
export const MAX_GRID_RESOLUTION = 2;

// Bresenham ray sampling step size
export const RAY_SAMPLE_STEP = 0.1; // inches

// Deployment zone sampling
export const ZONE_SAMPLE_SPACING = 4; // inches between sample points
