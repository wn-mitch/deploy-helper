import { writable } from 'svelte/store';
import type { DeploymentPattern } from '$lib/types/deployment';

interface DeploymentState {
	currentPattern: DeploymentPattern | null;
	availablePatterns: DeploymentPattern[];
}

const initialState: DeploymentState = {
	currentPattern: null,
	availablePatterns: []
};

function createDeploymentStore() {
	const { subscribe, set, update } = writable<DeploymentState>(initialState);

	return {
		subscribe,
		loadPattern: async (patternId: string) => {
			try {
				// Import the patterns JSON file
				const module = await import('$lib/data/deployment-patterns.json');
				const patterns = module.default as DeploymentPattern[];

				// Find the requested pattern
				const pattern = patterns.find((p) => p.id === patternId);

				if (pattern) {
					update((state) => ({ ...state, currentPattern: pattern }));
				} else {
					console.error(`Pattern ${patternId} not found`);
				}
			} catch (error) {
				console.error(`Failed to load deployment pattern ${patternId}:`, error);
			}
		},
		setAvailablePatterns: (patterns: DeploymentPattern[]) => {
			update((state) => ({ ...state, availablePatterns: patterns }));
		},
		clearPattern: () => {
			update((state) => ({ ...state, currentPattern: null }));
		}
	};
}

export const deploymentStore = createDeploymentStore();
