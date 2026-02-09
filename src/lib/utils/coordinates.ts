import { PIXELS_PER_INCH } from './constants';

/**
 * Convert inches to pixels for canvas rendering
 */
export function inchesToPixels(inches: number): number {
	return inches * PIXELS_PER_INCH;
}

/**
 * Convert pixels to inches for data storage
 */
export function pixelsToInches(pixels: number): number {
	return pixels / PIXELS_PER_INCH;
}

/**
 * Convert millimeters to inches (for base sizes)
 */
export function mmToInches(mm: number): number {
	return mm / 25.4;
}

/**
 * Convert base diameter in mm to radius in inches
 */
export function baseDiameterToRadiusInches(diameterMm: number): number {
	return mmToInches(diameterMm) / 2;
}
