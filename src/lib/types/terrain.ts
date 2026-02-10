// Coordinate system: all measurements in inches from top-left corner

export interface Point {
	x: number; // inches from left edge
	y: number; // inches from top edge
}

// Shape definitions

export interface RectangleShape {
	type: 'rectangle';
	width: number; // inches
	height: number; // inches
}

export interface PolygonShape {
	type: 'polygon';
	points: Point[]; // Points relative to piece position
}

export interface LineShape {
	type: 'line';
	start: Point; // Relative to piece position
	end: Point; // Relative to piece position
	thickness: number; // inches (1" for walls)
}

export interface CircleShape {
	type: 'circle';
	radius: number; // inches
}

export type TerrainShape = RectangleShape | PolygonShape | LineShape | CircleShape;

// Terrain pieces

/**
 * Terrain piece with position and rotation.
 *
 * Position Semantics:
 * - The `position` field represents the **top-left corner** for rectangles (or reference
 *   point for polygons).
 * - Rotation is applied around the position point (top-left for rectangles).
 * - Example: A 12×6 piece at (10, 10) with 90° rotation pivots around (10, 10).
 *
 * Implementation:
 * - Rendering: Konva.Rect naturally rotates around (x, y) which is the top-left
 * - Collision: Uses detect-collisions `setAngle()` to rotate bodies around their center
 * - Data: Rotation values are in degrees (0, 90, 180, 270)
 */
export interface TerrainPiece {
	id: string;
	name?: string;
	shapes: TerrainShape[]; // Array of shapes - first is footprint, rest are terrain structures
	position: Point; // Top-left corner for rectangles, reference point for polygons
	rotation?: number; // Degrees (0, 90, 180, 270) - rotates around position point
	mirrored?: boolean | 'horizontal' | 'vertical'; // Flip direction - applied before rotation (boolean = horizontal for backward compat)
	blocking: boolean; // Blocks line of sight?
	height?: number; // inches (for future height rules)
	category?: 'ruins' | 'walls' | 'debris' | 'structure';
}

// Deployment zones

export interface DeploymentZone {
	name: string;
	shape: TerrainShape; // Keep as single shape for deployment zones (always rectangles)
	position: Point;
	color?: string; // Hex color for visualization
}

// Complete terrain layout

export interface TerrainLayout {
	id: string;
	name: string;
	source: 'gw' | 'wtc' | 'uktc' | 'custom';
	version?: string;
	boardWidth: number; // 60
	boardHeight: number; // 44
	pieces: TerrainPiece[];
	deploymentZones?: DeploymentZone[];
	metadata?: {
		description?: string;
		missionType?: string;
		created?: string;
		author?: string;
	};
}
