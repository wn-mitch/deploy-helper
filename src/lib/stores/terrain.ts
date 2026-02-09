import { writable } from 'svelte/store';
import type { TerrainLayout } from '$lib/types/terrain';

interface TerrainState {
	currentLayout: TerrainLayout | null;
	availableLayouts: TerrainLayout[];
}

const initialState: TerrainState = {
	currentLayout: null,
	availableLayouts: []
};

function createTerrainStore() {
	const { subscribe, set, update } = writable<TerrainState>(initialState);

	return {
		subscribe,
		loadLayout: async (layoutId: string) => {
			try {
				// Dynamic import of layout JSON file
				const module = await import(`$lib/data/terrain-layouts/gw/${layoutId}.json`);
				const layout = module.default as TerrainLayout;
				update((state) => ({ ...state, currentLayout: layout }));
			} catch (error) {
				console.error(`Failed to load layout ${layoutId}:`, error);
			}
		},
		setAvailableLayouts: (layouts: TerrainLayout[]) => {
			update((state) => ({ ...state, availableLayouts: layouts }));
		},
		clearLayout: () => {
			update((state) => ({ ...state, currentLayout: null }));
		}
	};
}

export const terrainStore = createTerrainStore();
