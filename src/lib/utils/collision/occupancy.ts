/**
 * Terrain Occupancy Detection
 *
 * Determines which terrain pieces a point is "standing on" for LOS calculations.
 * In Warhammer 40k, models standing ON terrain can see through that terrain's
 * footprint, but models BEHIND terrain are blocked.
 *
 * Key concepts:
 * - Footprint: The first shape in each terrain piece's shapes array (the base platform)
 * - Occupancy: A point is "on" terrain if it's inside the footprint shape
 * - Only blocking terrain is considered (non-blocking terrain never affects LOS)
 */

import type { TerrainPiece, Point, Shape } from '$lib/types/terrain';

/**
 * Determines which terrain pieces a point is standing on.
 *
 * @param point - The point to test (in world coordinates, inches)
 * @param terrainPieces - Array of terrain pieces to check against
 * @returns Array of terrain piece IDs the point is on (empty if not on any terrain)
 */
export function getTerrainOccupancy(
  point: Point,
  terrainPieces: TerrainPiece[]
): string[] {
  const occupiedPieces: string[] = [];

  for (const piece of terrainPieces) {
    // Skip non-blocking terrain (never affects LOS)
    if (!piece.blocking) {
      continue;
    }

    // Skip if no shapes defined
    if (!piece.shapes || piece.shapes.length === 0) {
      continue;
    }

    // Only check the first shape (the footprint)
    const footprint = piece.shapes[0];

    // Skip line shapes (walls have no footprint to stand on)
    if (footprint.type === 'line') {
      continue;
    }

    // Check if point is inside this footprint
    if (pointInShape(point, footprint, piece)) {
      occupiedPieces.push(piece.id);
    }
  }

  return occupiedPieces;
}

/**
 * Tests if a point is inside a shape, accounting for position, rotation, and mirroring.
 *
 * @param point - The point to test (world coordinates, inches)
 * @param shape - The shape to test against
 * @param piece - The terrain piece (provides position and transforms)
 * @returns True if point is inside the shape
 */
export function pointInShape(
  point: Point,
  shape: Shape,
  piece: TerrainPiece
): boolean {
  // Transform point from world space to shape's local space
  const localPoint = worldToLocal(point, piece);

  switch (shape.type) {
    case 'rectangle':
      return pointInRectangle(localPoint, shape.width, shape.height);

    case 'polygon':
      return pointInPolygon(localPoint, shape.points, piece);

    case 'circle':
      return pointInCircle(localPoint, shape.radius);

    case 'line':
      // Lines have no interior
      return false;

    default:
      console.warn(`Unknown shape type: ${(shape as any).type}`);
      return false;
  }
}

/**
 * Transforms a point from world coordinates to local shape coordinates.
 *
 * Transform order (inverse): Rotation → Mirroring → Position
 * This reverses the forward transform: Position → Mirroring → Rotation
 *
 * @param worldPoint - Point in world coordinates (inches)
 * @param piece - Terrain piece with position and transforms
 * @returns Point in local coordinates (inches)
 */
function worldToLocal(worldPoint: Point, piece: TerrainPiece): Point {
  // Step 1: Translate to origin (inverse of position)
  let x = worldPoint.x - piece.position.x;
  let y = worldPoint.y - piece.position.y;

  // Step 2: Apply inverse rotation
  if (piece.rotation) {
    const radians = (-piece.rotation * Math.PI) / 180; // Negative for inverse
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    x = rotatedX;
    y = rotatedY;
  }

  // Step 3: Apply inverse mirroring
  // Note: boolean true is treated as 'horizontal' for backward compatibility
  if (piece.mirrored === 'horizontal' || piece.mirrored === true) {
    x = -x;
  } else if (piece.mirrored === 'vertical') {
    y = -y;
  }

  return { x, y };
}

/**
 * Transforms a point from local shape coordinates to world coordinates.
 *
 * Transform order (forward): Position → Mirroring → Rotation
 *
 * @param localPoint - Point in local coordinates (inches)
 * @param piece - Terrain piece with position and transforms
 * @returns Point in world coordinates (inches)
 */
function localToWorld(localPoint: Point, piece: TerrainPiece): Point {
  let x = localPoint.x;
  let y = localPoint.y;

  // Step 1: Apply mirroring
  // Note: boolean true is treated as 'horizontal' for backward compatibility
  if (piece.mirrored === 'horizontal' || piece.mirrored === true) {
    x = -x;
  } else if (piece.mirrored === 'vertical') {
    y = -y;
  }

  // Step 2: Apply rotation
  if (piece.rotation) {
    const radians = (piece.rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    x = rotatedX;
    y = rotatedY;
  }

  // Step 3: Translate to world position
  x += piece.position.x;
  y += piece.position.y;

  return { x, y };
}

/**
 * Tests if a point is inside a rectangle (in local coordinates).
 * Rectangle is centered at origin in local space.
 *
 * @param localPoint - Point in local coordinates
 * @param width - Rectangle width (inches)
 * @param height - Rectangle height (inches)
 * @returns True if point is inside rectangle
 */
function pointInRectangle(
  localPoint: Point,
  width: number,
  height: number
): boolean {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return (
    localPoint.x >= -halfWidth &&
    localPoint.x <= halfWidth &&
    localPoint.y >= -halfHeight &&
    localPoint.y <= halfHeight
  );
}

/**
 * Tests if a point is inside a polygon using ray-casting algorithm.
 *
 * Algorithm: Cast a ray from the point to infinity (in +x direction).
 * Count how many polygon edges the ray crosses:
 * - Odd count = inside
 * - Even count = outside
 *
 * @param localPoint - Point in local coordinates
 * @param points - Polygon vertices (in local coordinates)
 * @param piece - Terrain piece (for debugging, unused)
 * @returns True if point is inside polygon
 */
function pointInPolygon(
  localPoint: Point,
  points: Point[],
  piece: TerrainPiece
): boolean {
  const { x, y } = localPoint;
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    // Check if ray crosses edge (i, j)
    const intersect =
      yi > y !== yj > y && // Edge crosses horizontal line through point
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi; // Ray crosses edge

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Tests if a point is inside a circle (in local coordinates).
 * Circle is centered at origin in local space.
 *
 * @param localPoint - Point in local coordinates
 * @param radius - Circle radius (inches)
 * @returns True if point is inside circle
 */
function pointInCircle(localPoint: Point, radius: number): boolean {
  const distanceSquared = localPoint.x * localPoint.x + localPoint.y * localPoint.y;
  return distanceSquared <= radius * radius;
}
