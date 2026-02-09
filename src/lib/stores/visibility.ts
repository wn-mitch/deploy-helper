import { writable } from 'svelte/store';
import type { VisibilityGrid, VisibilityStats } from '$lib/types/raycasting';

interface VisibilityState {
	visibilityGrid: VisibilityGrid | null;
	isAnalyzing: boolean;
	progress: number; // 0-100
	stats: VisibilityStats | null;
}

const initialState: VisibilityState = {
	visibilityGrid: null,
	isAnalyzing: false,
	progress: 0,
	stats: null
};

function createVisibilityStore() {
	const { subscribe, set, update } = writable<VisibilityState>(initialState);

	return {
		subscribe,
		setGrid: (grid: VisibilityGrid) => {
			update((state) => ({ ...state, visibilityGrid: grid }));
		},
		setStats: (stats: VisibilityStats) => {
			update((state) => ({ ...state, stats }));
		},
		setAnalyzing: (analyzing: boolean) => {
			update((state) => ({ ...state, isAnalyzing: analyzing }));
		},
		updateProgress: (progress: number) => {
			update((state) => ({ ...state, progress }));
		},
		clear: () => {
			set(initialState);
		}
	};
}

export const visibilityStore = createVisibilityStore();
