import { System } from 'detect-collisions';
import type { TerrainPiece, Point, TerrainShape } from '$lib/types/terrain';

/**
 * Enhanced collision detection systems for terrain-aware LOS
 */
export interface TerrainCollisionSystems {
	full: System; // All shapes (current behavior)
	footprints: System; // Only first shape of each piece
	walls: System; // All shapes except first shape
	byPieceId: Map<
		string,
		{
			footprint: System; // First shape only
			walls: System; // Non-first shapes only
		}
	>;
}

/**
 * Create a collision detection system from terrain layout
 * Uses BVH spatial partitioning for efficient queries
 *
 * DEPRECATED: Use createTerrainCollisionSystems for enhanced LOS.
 * This function is kept for backward compatibility.
 */
export function createCollisionSystem(terrainPieces: TerrainPiece[]): System {
	const system = new System();

	// Add each blocking terrain piece to the collision system
	for (const piece of terrainPieces) {
		if (!piece.blocking) continue; // Only blocking terrain affects LOS
		if (!piece.shapes || piece.shapes.length === 0) continue;

		// Process all shapes (for backward compatibility, treat all shapes as blocking)
		for (let shapeIndex = 0; shapeIndex < piece.shapes.length; shapeIndex++) {
			const shape = piece.shapes[shapeIndex];
			const body = createBodyFromShape(shape, piece, system);
			if (body) {
				addBodyMetadata(body, piece.id, shapeIndex, shapeIndex === 0);
			}
		}
	}

	// CRITICAL: Update the system to rebuild the BVH spatial index
	// Without this, collision detection won't work!
	system.update();

	return system;
}

/**
 * Create enhanced collision systems for terrain-aware LOS calculations.
 *
 * This separates footprints (first shape) from walls (other shapes) to enable
 * selective LOS blocking based on model positions.
 */
export function createTerrainCollisionSystems(
	terrainPieces: TerrainPiece[]
): TerrainCollisionSystems {
	const fullSystem = new System();
	const footprintsSystem = new System();
	const wallsSystem = new System();
	const byPieceId = new Map<string, { footprint: System; walls: System }>();

	for (const piece of terrainPieces) {
		if (!piece.blocking) continue; // Only blocking terrain affects LOS
		if (!piece.shapes || piece.shapes.length === 0) continue;

		// Create per-piece systems
		const pieceFootprintSystem = new System();
		const pieceWallsSystem = new System();

		// Process each shape
		for (let shapeIndex = 0; shapeIndex < piece.shapes.length; shapeIndex++) {
			const shape = piece.shapes[shapeIndex];
			const isFootprint = shapeIndex === 0;

			// Skip line shapes as footprints (can't stand on walls)
			if (isFootprint && shape.type === 'line') {
				continue;
			}

			// Create separate bodies for each system (bodies can't be shared between systems)
			const fullBody = createBodyFromShape(shape, piece, fullSystem);
			if (!fullBody) continue;
			addBodyMetadata(fullBody, piece.id, shapeIndex, isFootprint);

			if (isFootprint) {
				const footprintBody = createBodyFromShape(shape, piece, footprintsSystem);
				if (footprintBody) {
					addBodyMetadata(footprintBody, piece.id, shapeIndex, isFootprint);
				}

				const pieceFootprintBody = createBodyFromShape(shape, piece, pieceFootprintSystem);
				if (pieceFootprintBody) {
					addBodyMetadata(pieceFootprintBody, piece.id, shapeIndex, isFootprint);
				}
			} else {
				const wallBody = createBodyFromShape(shape, piece, wallsSystem);
				if (wallBody) {
					addBodyMetadata(wallBody, piece.id, shapeIndex, isFootprint);
				}

				const pieceWallBody = createBodyFromShape(shape, piece, pieceWallsSystem);
				if (pieceWallBody) {
					addBodyMetadata(pieceWallBody, piece.id, shapeIndex, isFootprint);
				}
			}
		}

		// Update per-piece systems and store
		pieceFootprintSystem.update();
		pieceWallsSystem.update();
		byPieceId.set(piece.id, {
			footprint: pieceFootprintSystem,
			walls: pieceWallsSystem
		});
	}

	// Update all systems
	fullSystem.update();
	footprintsSystem.update();
	wallsSystem.update();

	return {
		full: fullSystem,
		footprints: footprintsSystem,
		walls: wallsSystem,
		byPieceId
	};
}

/**
 * Creates a collision body from a shape definition.
 * Handles rectangles, polygons, circles, and lines.
 */
function createBodyFromShape(shape: TerrainShape, piece: TerrainPiece, system: System): any {
	if (shape.type === 'rectangle') {
		// Create a box body - Box expects center position, not top-left
		const centerX = piece.position.x + shape.width / 2;
		const centerY = piece.position.y + shape.height / 2;
		const box = system.createBox({ x: centerX, y: centerY }, shape.width, shape.height);

		// Apply rotation if specified (convert degrees to radians)
		if (piece.rotation) {
			box.setAngle((piece.rotation * Math.PI) / 180);
		}

		// Note: Mirroring (scaleX: -1) doesn't affect collision for rectangles
		// since a box is symmetric - the collision area is identical whether mirrored or not

		return box;
	} else if (shape.type === 'polygon') {
		// Create a polygon body
		// Start with local points, apply mirroring, then rotation, then absolute position
		let localPoints = shape.points;

		// Apply mirroring if specified (horizontal flip around x=0 in local space)
		if (piece.mirrored) {
			localPoints = localPoints.map((p: Point) => ({
				x: -p.x,
				y: p.y
			}));
		}

		// Convert to absolute coordinates
		let absolutePoints = localPoints.map((p: Point) => ({
			x: piece.position.x + p.x,
			y: piece.position.y + p.y
		}));

		// Apply rotation if specified
		if (piece.rotation) {
			// Apply rotation matrix around piece position
			const angleRad = (piece.rotation * Math.PI) / 180;
			const cos = Math.cos(angleRad);
			const sin = Math.sin(angleRad);

			absolutePoints = absolutePoints.map((p: Point) => {
				// Translate to origin
				const dx = p.x - piece.position.x;
				const dy = p.y - piece.position.y;

				// Rotate
				const rotatedX = dx * cos - dy * sin;
				const rotatedY = dx * sin + dy * cos;

				// Translate back
				return {
					x: rotatedX + piece.position.x,
					y: rotatedY + piece.position.y
				};
			});
		}

		const poly = system.createPolygon(piece.position, absolutePoints);
		return poly;
	} else if (shape.type === 'circle') {
		// Create a circle body
		const centerX = piece.position.x;
		const centerY = piece.position.y;
		const circle = system.createCircle({ x: centerX, y: centerY }, shape.radius);
		return circle;
	} else if (shape.type === 'line') {
		// Lines are treated as thin rectangles for collision detection
		const dx = shape.end.x - shape.start.x;
		const dy = shape.end.y - shape.start.y;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = Math.atan2(dy, dx);

		// Center of the line
		const centerX = piece.position.x + (shape.start.x + shape.end.x) / 2;
		const centerY = piece.position.y + (shape.start.y + shape.end.y) / 2;

		const box = system.createBox({ x: centerX, y: centerY }, length, shape.thickness);
		box.setAngle(angle);

		// Apply piece rotation if specified
		if (piece.rotation) {
			const pieceAngleRad = (piece.rotation * Math.PI) / 180;
			box.setAngle(angle + pieceAngleRad);
		}

		return box;
	}

	return null;
}

/**
 * Attaches metadata to a collision body for debugging and selective collision.
 */
function addBodyMetadata(body: any, pieceId: string, shapeIndex: number, isFootprint: boolean) {
	body.pieceId = pieceId;
	body.shapeIndex = shapeIndex;
	body.isFootprint = isFootprint;
}

/**
 * Check if a point intersects any terrain in the collision system
 * TEMPORARY: Using simple geometric collision instead of detect-collisions library
 */
export function pointIntersectsTerrain(system: System, point: Point): boolean {
	// Get all bodies from the system
	const bodies = system.all();

	// Check each body manually
	for (const body of bodies) {
		// For Box bodies, check if point is inside the box bounds
		if ((body as any).type === 'box' || body.constructor.name === 'Box') {
			// Box has pos (center), width, height, and angle
			const box = body as any;
			const halfWidth = box.width / 2;
			const halfHeight = box.height / 2;

			// Simple AABB check (assuming no rotation for now)
			const minX = box.pos.x - halfWidth;
			const maxX = box.pos.x + halfWidth;
			const minY = box.pos.y - halfHeight;
			const maxY = box.pos.y + halfHeight;

			if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
				if (Math.random() < 0.01) {
					console.log(`Point check (${point.x.toFixed(2)}, ${point.y.toFixed(2)}): HIT`, box.pieceId);
				}
				return true;
			}
		}
	}

	if (Math.random() < 0.01) {
		console.log(`Point check (${point.x.toFixed(2)}, ${point.y.toFixed(2)}): MISS`);
	}

	return false;
}

/**
 * Check if a point intersects terrain with selective footprint exclusion.
 *
 * This enables terrain-aware LOS: models standing ON terrain can see through
 * that terrain's footprint, but walls and other terrain still block.
 *
 * @param systems - Enhanced collision systems
 * @param point - Point to test (world coordinates, inches)
 * @param excludeFootprints - Array of piece IDs whose footprints should not block
 * @returns True if point intersects any blocking terrain
 */
export function pointIntersectsTerrainSelective(
	systems: TerrainCollisionSystems,
	point: Point,
	excludeFootprints: string[]
): boolean {
	// Fast path: if no exclusions, use full system
	if (excludeFootprints.length === 0) {
		return pointIntersectsTerrain(systems.full, point);
	}

	// Check walls first (they always block regardless of occupancy)
	if (pointIntersectsTerrain(systems.walls, point)) {
		return true;
	}

	// Check footprints, excluding specified pieces
	const excludeSet = new Set(excludeFootprints);
	const bodies = systems.footprints.all();

	for (const body of bodies) {
		const pieceId = (body as any).pieceId;

		// Skip excluded footprints
		if (excludeSet.has(pieceId)) {
			continue;
		}

		// Check if point intersects this footprint
		if (pointIntersectsBody(body, point)) {
			return true;
		}
	}

	return false;
}

/**
 * Check if a point intersects a specific collision body.
 * Handles Box and Polygon types with rotation.
 */
function pointIntersectsBody(body: any, point: Point): boolean {
	if (body.type === 'box' || body.constructor.name === 'Box') {
		const box = body as any;
		const halfWidth = box.width / 2;
		const halfHeight = box.height / 2;

		// Transform point to box local space (accounting for rotation)
		const dx = point.x - box.pos.x;
		const dy = point.y - box.pos.y;

		if (box.angle && box.angle !== 0) {
			// Rotate point by -angle
			const cos = Math.cos(-box.angle);
			const sin = Math.sin(-box.angle);
			const localX = dx * cos - dy * sin;
			const localY = dx * sin + dy * cos;

			return Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight;
		} else {
			// Simple AABB check (no rotation)
			return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
		}
	} else if (body.type === 'polygon' || body.constructor.name === 'Polygon') {
		// Use ray-casting algorithm for polygon containment
		const poly = body as any;
		const points = poly.points || [];

		let inside = false;
		for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
			const xi = points[i].x;
			const yi = points[i].y;
			const xj = points[j].x;
			const yj = points[j].y;

			const intersect =
				yi > point.y !== yj > point.y &&
				point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

			if (intersect) {
				inside = !inside;
			}
		}

		return inside;
	}

	return false;
}
