import type { Point } from '$lib/types/terrain';
import type { TerrainCollisionSystems } from '$lib/utils/collision/detector';
import { pointIntersectsTerrainSelective } from '$lib/utils/collision/detector';

/**
 * Bresenham's line algorithm for sampling points along a ray
 * Returns array of points from (x0, y0) to (x1, y1) with given step size
 *
 * @param x0 Start X coordinate (inches)
 * @param y0 Start Y coordinate (inches)
 * @param x1 End X coordinate (inches)
 * @param y1 End Y coordinate (inches)
 * @param step Distance between sample points (inches)
 * @returns Array of sampled points along the line
 */
export function bresenham(
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	step: number = 0.1
): Point[] {
	const points: Point[] = [];

	const dx = x1 - x0;
	const dy = y1 - y0;
	const distance = Math.sqrt(dx * dx + dy * dy);

	// Handle zero-length rays
	if (distance < step) {
		return [{ x: x0, y: y0 }, { x: x1, y: y1 }];
	}

	const steps = Math.ceil(distance / step);
	const xStep = dx / steps;
	const yStep = dy / steps;

	for (let i = 0; i <= steps; i++) {
		points.push({
			x: x0 + xStep * i,
			y: y0 + yStep * i
		});
	}

	return points;
}

/**
 * Cast a ray and check if it intersects any blocking terrain
 * Returns true if the ray is blocked, false if clear
 *
 * @param from Source point (inches)
 * @param to Target point (inches)
 * @param checkIntersection Function that checks if a point intersects blocking terrain
 * @param step Sample step size (inches)
 * @returns true if blocked, false if clear line of sight
 */
export function isRayBlocked(
	from: Point,
	to: Point,
	checkIntersection: (point: Point) => boolean,
	step: number = 0.1
): boolean {
	const samples = bresenham(from.x, from.y, to.x, to.y, step);

	// Check each sample point for intersection
	for (const sample of samples) {
		if (checkIntersection(sample)) {
			return true;
		}
	}

	return false;
}

/**
 * Cast a ray with selective terrain blocking (terrain-aware LOS).
 *
 * Models standing ON terrain can see through that terrain's footprint,
 * but models BEHIND terrain are blocked. Walls always block.
 *
 * @param from Source point (inches)
 * @param to Target point (inches)
 * @param collisionSystems Enhanced collision systems with separated footprints/walls
 * @param excludeFootprints Array of piece IDs whose footprints should not block
 * @param step Sample step size (inches)
 * @returns true if blocked, false if clear line of sight
 */
export function isRayBlockedSelective(
	from: Point,
	to: Point,
	collisionSystems: TerrainCollisionSystems,
	excludeFootprints: string[],
	step: number = 0.1
): boolean {
	const samples = bresenham(from.x, from.y, to.x, to.y, step);

	// Check each sample point for intersection
	for (const sample of samples) {
		if (pointIntersectsTerrainSelective(collisionSystems, sample, excludeFootprints)) {
			return true;
		}
	}

	return false;
}
