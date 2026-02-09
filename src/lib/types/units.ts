import type { Point } from './terrain';

// Re-export Point for convenience
export type { Point };

// Standard Warhammer 40k base sizes (diameter in mm)
export type BaseSize =
	| 25
	| 28
	| 32
	| 40
	| 50
	| 60
	| 65
	| 75
	| 80
	| 90
	| 100
	| 105
	| 130
	| 160
	| 170;

// Individual model base
export interface Base {
	id: string;
	size: BaseSize; // Diameter in mm
	position: Point; // Center position in inches
	locked: boolean; // Prevent dragging when true
}

// Unit (collection of bases)
export interface Unit {
	id: string;
	name: string;
	bases: Base[];
	color?: string; // Hex color for visualization
	faction?: string;
}

// Base size definition with conversions
export interface BaseDefinition {
	size: BaseSize;
	diameterMm: number;
	radiusInches: number;
}
