import { writable } from 'svelte/store';
import type { VisibilitySource } from '$lib/types/raycasting';
import type { DeploymentZone, Point } from '$lib/types/terrain';

interface SelectionState {
	selectedSource: VisibilitySource | null;
	customPoints: Point[];
}

const initialState: SelectionState = {
	selectedSource: null,
	customPoints: []
};

function createSelectionStore() {
	const { subscribe, set, update } = writable<SelectionState>(initialState);

	return {
		subscribe,
		setSourceDeploymentZone: (zone: DeploymentZone, points: Point[]) => {
			update((state) => ({
				...state,
				selectedSource: {
					type: 'deployment-zone',
					zone,
					points
				}
			}));
		},
		setSourceUnit: (unitId: string, points: Point[]) => {
			update((state) => ({
				...state,
				selectedSource: {
					type: 'unit',
					id: unitId,
					points
				}
			}));
		},
		addCustomPoint: (point: Point) => {
			update((state) => ({
				...state,
				customPoints: [...state.customPoints, point]
			}));
		},
		removeCustomPoint: (index: number) => {
			update((state) => ({
				...state,
				customPoints: state.customPoints.filter((_, i) => i !== index)
			}));
		},
		clearCustomPoints: () => {
			update((state) => ({
				...state,
				customPoints: []
			}));
		},
		clear: () => {
			set(initialState);
		}
	};
}

export const selectionStore = createSelectionStore();
