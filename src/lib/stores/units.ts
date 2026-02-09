import { writable } from 'svelte/store';
import { nanoid } from 'nanoid';
import type { Unit, Base, BaseSize, Point } from '$lib/types/units';

interface UnitsState {
	units: Unit[];
}

const initialState: UnitsState = {
	units: []
};

function createUnitsStore() {
	const { subscribe, set, update } = writable<UnitsState>(initialState);

	return {
		subscribe,
		createUnit: (
			name: string,
			baseSize: BaseSize,
			baseCount: number,
			position: Point,
			color?: string
		) => {
			const unitId = nanoid();
			const bases: Base[] = [];

			// Create bases in a line formation by default
			for (let i = 0; i < baseCount; i++) {
				bases.push({
					id: nanoid(),
					size: baseSize,
					position: {
						x: position.x + i * 2, // Space bases 2" apart
						y: position.y
					},
					locked: false
				});
			}

			const newUnit: Unit = {
				id: unitId,
				name,
				bases,
				color: color || '#3b82f6' // Default blue
			};

			update((state) => ({
				...state,
				units: [...state.units, newUnit]
			}));

			return unitId;
		},
		removeUnit: (unitId: string) => {
			update((state) => ({
				...state,
				units: state.units.filter((u) => u.id !== unitId)
			}));
		},
		updateBasePosition: (baseId: string, position: Point) => {
			update((state) => ({
				...state,
				units: state.units.map((unit) => ({
					...unit,
					bases: unit.bases.map((base) =>
						base.id === baseId ? { ...base, position } : base
					)
				}))
			}));
		},
		toggleBaseLock: (baseId: string) => {
			update((state) => ({
				...state,
				units: state.units.map((unit) => ({
					...unit,
					bases: unit.bases.map((base) =>
						base.id === baseId ? { ...base, locked: !base.locked } : base
					)
				}))
			}));
		},
		clear: () => {
			set(initialState);
		}
	};
}

export const unitsStore = createUnitsStore();
