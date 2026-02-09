<script lang="ts">
	import { terrainStore } from '$lib/stores/terrain';
	import { onMount } from 'svelte';

	const AVAILABLE_LAYOUTS = [
		{ id: 'layout-1', name: 'GW Layout 1' },
		{ id: 'layout-2', name: 'GW Layout 2' },
		{ id: 'layout-3', name: 'GW Layout 3' },
		{ id: 'layout-4', name: 'GW Layout 4' },
		{ id: 'layout-5', name: 'GW Layout 5' },
		{ id: 'layout-6', name: 'GW Layout 6' },
		{ id: 'layout-7', name: 'GW Layout 7' },
		{ id: 'layout-8', name: 'GW Layout 8' }
	];

	let selectedLayoutId = '';

	$: currentLayout = $terrainStore.currentLayout;

	function handleLayoutChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const layoutId = target.value;
		if (layoutId) {
			terrainStore.loadLayout(layoutId);
		}
	}

	onMount(() => {
		// Load first layout by default
		if (AVAILABLE_LAYOUTS.length > 0) {
			selectedLayoutId = AVAILABLE_LAYOUTS[0].id;
			terrainStore.loadLayout(selectedLayoutId);
		}
	});
</script>

<div class="mb-4">
	<label for="layout-select" class="block text-sm font-medium text-gray-300 mb-2">
		Terrain Layout
	</label>
	<select
		id="layout-select"
		bind:value={selectedLayoutId}
		on:change={handleLayoutChange}
		class="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
	>
		<option value="">Select a layout...</option>
		{#each AVAILABLE_LAYOUTS as layout}
			<option value={layout.id}>{layout.name}</option>
		{/each}
	</select>
	{#if currentLayout}
		<p class="mt-2 text-sm text-gray-400">
			{currentLayout.pieces.length} terrain pieces
		</p>
	{/if}
</div>
