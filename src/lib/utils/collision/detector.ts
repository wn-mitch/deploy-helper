import { System, Box, Polygon, Circle } from 'detect-collisions';
import type { TerrainPiece, Point } from '$lib/types/terrain';

/**
 * Create a collision detection system from terrain layout
 * Uses BVH spatial partitioning for efficient queries
 */
export function createCollisionSystem(terrainPieces: TerrainPiece[]): System {
	const system = new System();

	// Add each blocking terrain piece to the collision system
	for (const piece of terrainPieces) {
		if (!piece.blocking) continue; // Only blocking terrain affects LOS

		if (piece.shape.type === 'rectangle') {
			// Create a box body - Box expects center position, not top-left
			const centerX = piece.position.x + piece.shape.width / 2;
			const centerY = piece.position.y + piece.shape.height / 2;
			const box = system.createBox(
				{ x: centerX, y: centerY },
				piece.shape.width,
				piece.shape.height
			);

			// Apply rotation if specified (convert degrees to radians)
			if (piece.rotation) {
				box.setAngle((piece.rotation * Math.PI) / 180);
			}

			// Note: Mirroring (scaleX: -1) doesn't affect collision for rectangles
			// since a box is symmetric - the collision area is identical whether mirrored or not

			// Store piece id for debugging
			(box as any).pieceId = piece.id;
		} else if (piece.shape.type === 'polygon') {
			// Create a polygon body
			// Start with local points, apply mirroring, then rotation, then absolute position
			let localPoints = piece.shape.points;

			// Apply mirroring if specified (horizontal flip around x=0 in local space)
			if (piece.mirrored) {
				localPoints = localPoints.map((p) => ({
					x: -p.x,
					y: p.y
				}));
			}

			// Convert to absolute coordinates
			let absolutePoints = localPoints.map((p) => ({
				x: piece.position.x + p.x,
				y: piece.position.y + p.y
			}));

			// Apply rotation if specified
			if (piece.rotation) {
				// Apply rotation matrix around piece position
				const angleRad = (piece.rotation * Math.PI) / 180;
				const cos = Math.cos(angleRad);
				const sin = Math.sin(angleRad);

				absolutePoints = absolutePoints.map((p) => {
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
			(poly as any).pieceId = piece.id;
		}
	}

	// CRITICAL: Update the system to rebuild the BVH spatial index
	// Without this, collision detection won't work!
	system.update();

	return system;
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
