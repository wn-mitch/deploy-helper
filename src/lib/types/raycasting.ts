import type { Point, DeploymentZone } from './terrain';

// Visibility zone classification
export type VisibilityZone = 'danger' | 'safe' | 'unanalyzed';

// Grid cell for visibility analysis
export interface GridCell {
	x: number; // Grid column index
	y: number; // Grid row index
	centerPosition: Point; // Center point in inches
	isVisible: boolean; // True if ANY source point has LOS to this cell
	zone: VisibilityZone; // 'danger' if visible, 'safe' if hidden from all sources
	testedSourcePoints: number; // Number of source points tested (for progress tracking)
}

// Complete visibility grid result
export interface VisibilityGrid {
	cells: GridCell[][]; // 2D array [row][col]
	gridResolution: number; // inches per cell (0.5, 1, or 2)
	columns: number;
	rows: number;
	sourceZone: 'opponent' | 'unit' | 'custom';
	timestamp: number; // When analysis was run
}

// Visibility source definition
export interface VisibilitySource {
	type: 'deployment-zone' | 'unit' | 'custom-point';
	id?: string; // Unit ID if type is 'unit'
	zone?: DeploymentZone; // Zone definition if type is 'deployment-zone'
	points: Point[]; // Sampled source points for ray casting
}

// Statistics about visibility analysis results
export interface VisibilityStats {
	totalCells: number;
	dangerCells: number; // Count of cells visible from ANY source point
	safeCells: number; // Count of cells hidden from ALL source points
	dangerPercentage: number;
	safePercentage: number;
}
