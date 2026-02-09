import type { BaseSize, BaseDefinition, Unit, Base } from '$lib/types/units';
import baseSizesData from '$lib/data/base-sizes.json';

const baseSizes = baseSizesData as BaseDefinition[];

/**
 * Get base definition by size
 */
export function getBaseDefinition(size: BaseSize): BaseDefinition {
	const def = baseSizes.find((b) => b.size === size);
	if (!def) {
		throw new Error(`Unknown base size: ${size}`);
	}
	return def;
}

/**
 * Get all available base sizes
 */
export function getAllBaseSizes(): BaseDefinition[] {
	return baseSizes;
}

/**
 * Find a base by ID across all units
 */
export function findBase(units: Unit[], baseId: string): Base | null {
	for (const unit of units) {
		const base = unit.bases.find((b) => b.id === baseId);
		if (base) return base;
	}
	return null;
}

/**
 * Find which unit a base belongs to
 */
export function findUnitByBase(units: Unit[], baseId: string): Unit | null {
	for (const unit of units) {
		if (unit.bases.some((b) => b.id === baseId)) {
			return unit;
		}
	}
	return null;
}
