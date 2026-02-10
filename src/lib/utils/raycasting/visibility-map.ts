import type { Point, TerrainPiece, DeploymentZone } from '$lib/types/terrain';
import type {
	VisibilityGrid,
	GridCell,
	VisibilityStats,
	VisibilitySource
} from '$lib/types/raycasting';
import {
	createCollisionSystem,
	createTerrainCollisionSystems,
	pointIntersectsTerrain
} from '$lib/utils/collision/detector';
import { isRayBlocked, isRayBlockedSelective } from './bresenham';
import { getTerrainOccupancy } from '$lib/utils/collision/occupancy';
import { BOARD_WIDTH, BOARD_HEIGHT, ZONE_SAMPLE_SPACING } from '$lib/utils/constants';

/**
 * Sample points within a deployment zone at regular intervals
 */
export function sampleZonePoints(zone: DeploymentZone, spacing: number = 4): Point[] {
	const points: Point[] = [];

	if (zone.shape.type === 'rectangle') {
		const startX = zone.position.x + spacing / 2;
		const startY = zone.position.y + spacing / 2;
		const endX = zone.position.x + zone.shape.width;
		const endY = zone.position.y + zone.shape.height;

		for (let x = startX; x < endX; x += spacing) {
			for (let y = startY; y < endY; y += spacing) {
				points.push({ x, y });
			}
		}
	}

	return points;
}

/**
 * Generate a visibility grid for the entire board
 * Analyzes which grid cells are visible from source points
 *
 * @param sourcePoints Array of source points to cast rays from
 * @param terrainPieces Blocking terrain pieces
 * @param gridResolution Size of each grid cell in inches
 * @param onProgress Optional callback for progress updates (0-100)
 * @returns Visibility grid with danger/safe zones
 */
export function generateVisibilityMap(
	sourcePoints: Point[],
	terrainPieces: TerrainPiece[],
	gridResolution: number = 2,
	onProgress?: (progress: number) => void
): VisibilityGrid {
	// Create enhanced collision systems for terrain-aware LOS
	const collisionSystems = createTerrainCollisionSystems(terrainPieces);

	// Pre-compute terrain occupancy for all source points (optimization)
	// This saves repeated occupancy calculations during ray casting
	const sourceOccupancy = new Map<string, string[]>();
	for (const source of sourcePoints) {
		const occupiedPieces = getTerrainOccupancy(source, terrainPieces);
		const key = `${source.x},${source.y}`;
		sourceOccupancy.set(key, occupiedPieces);
	}

	// Generate grid cells
	const columns = Math.ceil(BOARD_WIDTH / gridResolution);
	const rows = Math.ceil(BOARD_HEIGHT / gridResolution);
	const cells: GridCell[][] = [];

	// Initialize grid
	for (let row = 0; row < rows; row++) {
		cells[row] = [];
		for (let col = 0; col < columns; col++) {
			const centerX = col * gridResolution + gridResolution / 2;
			const centerY = row * gridResolution + gridResolution / 2;

			cells[row][col] = {
				x: col,
				y: row,
				centerPosition: { x: centerX, y: centerY },
				isVisible: false,
				zone: 'unanalyzed',
				testedSourcePoints: 0
			};
		}
	}

	// Analyze each grid cell
	const totalCells = rows * columns;
	let processedCells = 0;

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < columns; col++) {
			const cell = cells[row][col];
			let hasLineOfSight = false;

			// Determine which terrain pieces this cell is standing on
			const cellOccupancy = getTerrainOccupancy(cell.centerPosition, terrainPieces);

			// Check visibility from each source point
			// Early exit: if ANY source point can see this cell, it's a danger zone
			for (const source of sourcePoints) {
				// Get source's terrain occupancy
				const sourceKey = `${source.x},${source.y}`;
				const sourcePieces = sourceOccupancy.get(sourceKey) || [];

				// Combine exclusions: both source and target footprints don't block
				const excludeFootprints = new Set([...sourcePieces, ...cellOccupancy]);

				// Cast ray with selective blocking
				const blocked = isRayBlockedSelective(
					source,
					cell.centerPosition,
					collisionSystems,
					Array.from(excludeFootprints),
					0.2 // Sample every 0.2 inches
				);

				if (!blocked) {
					// Found a clear line of sight
					hasLineOfSight = true;
					break; // Early exit - no need to test remaining sources
				}
			}

			// Classify cell
			cell.isVisible = hasLineOfSight;
			cell.zone = hasLineOfSight ? 'danger' : 'safe';
			cell.testedSourcePoints = sourcePoints.length;

			// Update progress
			processedCells++;
			if (onProgress && processedCells % 10 === 0) {
				const progress = (processedCells / totalCells) * 100;
				onProgress(progress);
			}
		}
	}

	// Final progress update
	if (onProgress) {
		onProgress(100);
	}

	return {
		cells,
		gridResolution,
		columns,
		rows,
		sourceZone: 'opponent', // TODO: Make this configurable
		timestamp: Date.now()
	};
}

/**
 * Calculate statistics from a visibility grid
 */
export function calculateVisibilityStats(grid: VisibilityGrid): VisibilityStats {
	let totalCells = 0;
	let dangerCells = 0;
	let safeCells = 0;

	for (const row of grid.cells) {
		for (const cell of row) {
			totalCells++;
			if (cell.zone === 'danger') dangerCells++;
			else if (cell.zone === 'safe') safeCells++;
		}
	}

	return {
		totalCells,
		dangerCells,
		safeCells,
		dangerPercentage: (dangerCells / totalCells) * 100,
		safePercentage: (safeCells / totalCells) * 100
	};
}
