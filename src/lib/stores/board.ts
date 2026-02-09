import { writable } from 'svelte/store';

interface BoardState {
	scale: number; // Zoom level (1 = 100%)
	offsetX: number; // Pan offset X
	offsetY: number; // Pan offset Y
}

const initialState: BoardState = {
	scale: 1,
	offsetX: 0,
	offsetY: 0
};

function createBoardStore() {
	const { subscribe, set, update } = writable<BoardState>(initialState);

	return {
		subscribe,
		setZoom: (scale: number) => {
			update((state) => ({ ...state, scale }));
		},
		setPan: (x: number, y: number) => {
			update((state) => ({ ...state, offsetX: x, offsetY: y }));
		},
		reset: () => {
			set(initialState);
		}
	};
}

export const boardStore = createBoardStore();
